"""
demand.py — Прогнозирование спроса (demand forecasting).

A lightweight, explainable model (no external ML libs needed — keeps the
project dependency-free) that looks at historical ride requests/trips and:
  1. predicts the busiest hours & directions for the next day,
  2. proposes a bonus multiplier for drivers to fill in the quiet slots.

This is intentionally a transparent statistical model rather than a black
box — for a hackathon demo it's easy to explain and to swap later for a
real ML model (e.g. a small regression/LLM-based predictor) without
changing the API surface.
"""

from collections import Counter, defaultdict
from database import get_connection

HOURS = list(range(6, 23))  # campus-relevant hours, 06:00-22:00


def _hour_of(time_str: str) -> int:
    return int(time_str.split(":")[0])


def historical_demand():
    """
    Aggregates all ride_requests (pending, matched, whatever) grouped by
    (hour, direction) to build a simple frequency table representing demand.
    """
    conn = get_connection()
    rows = conn.execute(
        "SELECT desired_time, direction FROM ride_requests"
    ).fetchall()
    conn.close()

    counts = defaultdict(int)
    for r in rows:
        h = _hour_of(r["desired_time"])
        counts[(h, r["direction"])] += 1
    return counts


def historical_supply():
    """Same aggregation but for driver-posted routes (seats offered)."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT departure_time, direction, seats_total FROM routes WHERE active=1"
    ).fetchall()
    conn.close()

    seats = defaultdict(int)
    for r in rows:
        h = _hour_of(r["departure_time"])
        seats[(h, r["direction"])] += r["seats_total"]
    return seats


def forecast():
    """
    Returns, for each direction, a ranked list of hours with:
      - predicted demand level (requests seen historically),
      - current supply (seats offered),
      - a gap score,
      - a suggested bonus % for drivers to incentivise off-peak/undersupplied hours.
    """
    demand = historical_demand()
    supply = historical_supply()

    directions = ["to_campus", "from_campus"]
    result = {}

    for direction in directions:
        rows = []
        for h in HOURS:
            d = demand.get((h, direction), 0)
            s = supply.get((h, direction), 0)
            gap = d - s
            rows.append({"hour": h, "demand": d, "supply": s, "gap": gap})

        max_gap = max((r["gap"] for r in rows), default=0)
        for r in rows:
            if max_gap > 0 and r["gap"] > 0:
                # Bigger gap -> bigger bonus, capped at +40%.
                r["bonus_percent"] = round(min(40, (r["gap"] / max_gap) * 40))
            else:
                r["bonus_percent"] = 0

        rows.sort(key=lambda r: r["demand"], reverse=True)
        result[direction] = rows

    return result


def peak_hours_summary():
    """Small convenience summary used by the frontend dashboard."""
    data = forecast()
    summary = {}
    for direction, rows in data.items():
        top = [r for r in rows if r["demand"] > 0][:3]
        summary[direction] = top
    return summary
