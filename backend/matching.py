"""
matching.py — Умный матчинг (smart matching).

Finds the best driver route(s) for a given passenger request using a
scored, multi-factor algorithm:

  1. HARD FILTERS (must match, otherwise the route is not a candidate):
     - same direction (to_campus / from_campus)
     - same origin zone
     - at least 1 free seat for the request's passenger count
     - departure times fall within each other's flexibility window

  2. SOFT SCORING (ranks the remaining candidates):
     - how close the times are (closer = higher score)
     - music preference match
     - talkative preference match
     - how full the car already is (prefer filling partially-full cars,
       which helps consolidate rides and reduces total cars on the road)

This mirrors the brief's example: "еду в 8:30 от Уралмаша, могу взять 2
человек" -> the algorithm finds overlapping requests/routes with a
flexible +/-15 minute window plus preference matching.
"""

from database import get_connection


def _time_to_minutes(t: str) -> int:
    h, m = t.split(":")
    return int(h) * 60 + int(m)


def _windows_overlap(time_a, flex_a, time_b, flex_b) -> bool:
    a = _time_to_minutes(time_a)
    b = _time_to_minutes(time_b)
    return abs(a - b) <= (flex_a + flex_b)


def _time_score(time_a, time_b) -> float:
    """1.0 for an exact match, decaying linearly to 0 at 60 minutes apart."""
    diff = abs(_time_to_minutes(time_a) - _time_to_minutes(time_b))
    return max(0.0, 1.0 - diff / 60.0)


def find_matches(request_row):
    """
    request_row: a sqlite3.Row from ride_requests.
    Returns a list of candidate routes with match scores, best first.
    """
    conn = get_connection()
    candidates = conn.execute(
        """
        SELECT r.*, u.name AS driver_name, u.rating_sum, u.rating_count
        FROM routes r
        JOIN users u ON u.id = r.driver_id
        WHERE r.active = 1
          AND r.origin_zone = ?
          AND r.direction = ?
          AND r.seats_available >= ?
        """,
        (request_row["origin_zone"], request_row["direction"], request_row["passengers_count"]),
    ).fetchall()
    conn.close()

    scored = []
    for route in candidates:
        if not _windows_overlap(
            route["departure_time"], route["flexibility_min"],
            request_row["desired_time"], request_row["flexibility_min"],
        ):
            continue

        score = _time_score(route["departure_time"], request_row["desired_time"]) * 0.6

        # Preference bonuses (only applied if the passenger expressed a preference)
        pref_music = request_row["pref_music"]
        pref_talk = request_row["pref_talkative"]
        if pref_music is not None:
            score += 0.15 if int(pref_music) == route["music"] else 0
        else:
            score += 0.075  # neutral partial credit
        if pref_talk is not None:
            score += 0.15 if int(pref_talk) == route["talkative"] else 0
        else:
            score += 0.075

        # Prefer consolidating rides: reward routes that already have some
        # passengers (fewer empty seats relative to total = higher score),
        # which reduces the number of cars needed overall.
        fill_ratio = 1 - (route["seats_available"] / route["seats_total"])
        score += fill_ratio * 0.1

        rating_count = route["rating_count"]
        rating_avg = (route["rating_sum"] / rating_count) if rating_count else None
        score += 0.05 if (rating_avg and rating_avg >= 4.5) else 0

        scored.append({
            "route_id": route["id"],
            "driver_name": route["driver_name"],
            "departure_time": route["departure_time"],
            "seats_available": route["seats_available"],
            "seats_total": route["seats_total"],
            "music": bool(route["music"]),
            "talkative": bool(route["talkative"]),
            "driver_rating": round(rating_avg, 2) if rating_avg else None,
            "match_score": round(min(score, 1.0), 3),
        })

    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return scored
