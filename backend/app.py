"""
app.py — Попутка ИИ: студенческий райдшеринг (без заказчика)
Flask REST API tying together verification/safety, smart matching,
demand forecasting and dynamic pricing.

Run with:  python app.py
Then open frontend/index.html (served automatically at /  ).
"""

import os
from flask import Flask, request, jsonify, send_from_directory

from database import init_db, get_connection, ZONES, CAMPUS, TAXI_MIN, TAXI_MAX
from matching import find_matches
from pricing import calculate_trip_price
import demand as demand_module

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")

# Allowed university email domain used for lightweight "safety" verification,
# per the brief: "верификация через университетскую почту @stud.urfu.ru"
ALLOWED_EMAIL_DOMAIN = "stud.urfu.ru"


# --------------------------------------------------------------------------
# Static frontend
# --------------------------------------------------------------------------

@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


# --------------------------------------------------------------------------
# Reference data
# --------------------------------------------------------------------------

@app.route("/api/zones")
def api_zones():
    return jsonify({
        "zones": ZONES,
        "campus": CAMPUS,
        "taxi_estimate_rub": [TAXI_MIN, TAXI_MAX],
    })


# --------------------------------------------------------------------------
# Users & safety (verification, rating, emergency contact)
# --------------------------------------------------------------------------

@app.route("/api/users/register", methods=["POST"])
def register_user():
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    emergency_contact = (data.get("emergency_contact") or "").strip()

    if not name or not email:
        return jsonify({"error": "name and email are required"}), 400

    verified = 1 if email.endswith("@" + ALLOWED_EMAIL_DOMAIN) else 0

    conn = get_connection()
    try:
        cur = conn.execute(
            "INSERT INTO users (name, email, verified, emergency_contact) VALUES (?,?,?,?)",
            (name, email, verified, emergency_contact),
        )
        conn.commit()
        user_id = cur.lastrowid
    except Exception:
        # Already registered -> fetch existing profile instead of erroring.
        row = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        conn.close()
        if row:
            return jsonify(_user_to_dict(row))
        raise
    conn.close()

    return jsonify({
        "id": user_id,
        "name": name,
        "email": email,
        "verified": bool(verified),
        "message": (
            "Аккаунт подтверждён через университетскую почту."
            if verified else
            "Внимание: email не относится к домену @stud.urfu.ru — аккаунт не верифицирован. "
            "Функции безопасности (поиск/подбор поездок) доступны только верифицированным пользователям."
        ),
    })


def _user_to_dict(row):
    rating_avg = (row["rating_sum"] / row["rating_count"]) if row["rating_count"] else None
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "verified": bool(row["verified"]),
        "rating": round(rating_avg, 2) if rating_avg else None,
        "rating_count": row["rating_count"],
        "emergency_contact": row["emergency_contact"],
    }


def _require_verified(user_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    conn.close()
    if not row:
        return None, (jsonify({"error": "user not found"}), 404)
    if not row["verified"]:
        return None, (jsonify({"error": "user is not verified via @stud.urfu.ru email"}), 403)
    return row, None


# --------------------------------------------------------------------------
# Driver routes
# --------------------------------------------------------------------------

@app.route("/api/routes", methods=["POST"])
def create_route():
    data = request.get_json(force=True)
    driver_id = data.get("driver_id")
    _, err = _require_verified(driver_id)
    if err:
        return err

    required = ["origin_zone", "direction", "departure_time", "seats_total"]
    if any(f not in data for f in required):
        return jsonify({"error": f"missing fields, required: {required}"}), 400
    if data["origin_zone"] not in ZONES:
        return jsonify({"error": f"unknown zone, choose one of {list(ZONES)}"}), 400

    conn = get_connection()
    cur = conn.execute(
        """INSERT INTO routes
           (driver_id, origin_zone, direction, departure_time, flexibility_min,
            seats_total, seats_available, music, talkative)
           VALUES (?,?,?,?,?,?,?,?,?)""",
        (
            driver_id, data["origin_zone"], data["direction"], data["departure_time"],
            int(data.get("flexibility_min", 15)), int(data["seats_total"]), int(data["seats_total"]),
            int(bool(data.get("music", True))), int(bool(data.get("talkative", True))),
        ),
    )
    conn.commit()
    route_id = cur.lastrowid
    conn.close()
    return jsonify({"id": route_id, "message": "Маршрут опубликован."})


@app.route("/api/routes", methods=["GET"])
def list_routes():
    conn = get_connection()
    rows = conn.execute(
        """SELECT r.*, u.name AS driver_name
           FROM routes r JOIN users u ON u.id = r.driver_id
           WHERE r.active = 1 ORDER BY r.departure_time"""
    ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


# --------------------------------------------------------------------------
# Passenger requests + smart matching
# --------------------------------------------------------------------------

@app.route("/api/requests", methods=["POST"])
def create_request():
    data = request.get_json(force=True)
    passenger_id = data.get("passenger_id")
    _, err = _require_verified(passenger_id)
    if err:
        return err

    required = ["origin_zone", "direction", "desired_time"]
    if any(f not in data for f in required):
        return jsonify({"error": f"missing fields, required: {required}"}), 400
    if data["origin_zone"] not in ZONES:
        return jsonify({"error": f"unknown zone, choose one of {list(ZONES)}"}), 400

    conn = get_connection()
    pref_music = data.get("pref_music")
    pref_talk = data.get("pref_talkative")
    cur = conn.execute(
        """INSERT INTO ride_requests
           (passenger_id, origin_zone, direction, desired_time, flexibility_min,
            passengers_count, pref_music, pref_talkative)
           VALUES (?,?,?,?,?,?,?,?)""",
        (
            passenger_id, data["origin_zone"], data["direction"], data["desired_time"],
            int(data.get("flexibility_min", 15)), int(data.get("passengers_count", 1)),
            None if pref_music is None else int(bool(pref_music)),
            None if pref_talk is None else int(bool(pref_talk)),
        ),
    )
    conn.commit()
    request_id = cur.lastrowid
    row = conn.execute("SELECT * FROM ride_requests WHERE id=?", (request_id,)).fetchone()
    conn.close()

    matches = find_matches(row)
    # Attach a live price quote to every match candidate.
    for m in matches:
        m["price"] = calculate_trip_price(
            row["origin_zone"], m["departure_time"], seats_shared=m["seats_total"] - m["seats_available"] + row["passengers_count"]
        )

    return jsonify({"request_id": request_id, "matches": matches})


@app.route("/api/requests/<int:request_id>/matches", methods=["GET"])
def get_matches(request_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM ride_requests WHERE id=?", (request_id,)).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "request not found"}), 404

    matches = find_matches(row)
    for m in matches:
        m["price"] = calculate_trip_price(
            row["origin_zone"], m["departure_time"], seats_shared=m["seats_total"] - m["seats_available"] + row["passengers_count"]
        )
    return jsonify({"request_id": request_id, "matches": matches})


# --------------------------------------------------------------------------
# Confirming a trip (books seats + locks in the price)
# --------------------------------------------------------------------------

@app.route("/api/trips", methods=["POST"])
def confirm_trip():
    data = request.get_json(force=True)
    route_id = data.get("route_id")
    request_id = data.get("request_id")

    conn = get_connection()
    route = conn.execute("SELECT * FROM routes WHERE id=?", (route_id,)).fetchone()
    req = conn.execute("SELECT * FROM ride_requests WHERE id=?", (request_id,)).fetchone()

    if not route or not req:
        conn.close()
        return jsonify({"error": "route or request not found"}), 404
    if req["status"] != "pending":
        conn.close()
        return jsonify({"error": "this request is no longer pending"}), 400
    if route["seats_available"] < req["passengers_count"]:
        conn.close()
        return jsonify({"error": "not enough seats available anymore"}), 400

    seats_already_used = route["seats_total"] - route["seats_available"]
    quote = calculate_trip_price(
        req["origin_zone"], route["departure_time"],
        seats_shared=seats_already_used + req["passengers_count"],
    )
    price = quote["price_per_passenger_rub"] * req["passengers_count"]

    matches = find_matches(req)
    match_score = next((m["match_score"] for m in matches if m["route_id"] == route_id), 0.0)

    cur = conn.execute(
        "INSERT INTO trips (route_id, request_id, price_rub, match_score) VALUES (?,?,?,?)",
        (route_id, request_id, price, match_score),
    )
    trip_id = cur.lastrowid

    conn.execute(
        "UPDATE routes SET seats_available = seats_available - ? WHERE id=?",
        (req["passengers_count"], route_id),
    )
    conn.execute("UPDATE ride_requests SET status='matched' WHERE id=?", (request_id,))
    conn.commit()
    conn.close()

    return jsonify({
        "trip_id": trip_id,
        "price_rub": price,
        "match_score": match_score,
        "message": "Поездка подтверждена! Хорошей дороги.",
    })


@app.route("/api/trips/<int:trip_id>/rate", methods=["POST"])
def rate_trip(trip_id):
    data = request.get_json(force=True)
    rater_id = data.get("rater_id")
    ratee_id = data.get("ratee_id")
    score = int(data.get("score", 0))
    comment = data.get("comment", "")

    if not (1 <= score <= 5):
        return jsonify({"error": "score must be between 1 and 5"}), 400

    conn = get_connection()
    conn.execute(
        "INSERT INTO ratings (trip_id, rater_id, ratee_id, score, comment) VALUES (?,?,?,?,?)",
        (trip_id, rater_id, ratee_id, score, comment),
    )
    conn.execute(
        "UPDATE users SET rating_sum = rating_sum + ?, rating_count = rating_count + 1 WHERE id=?",
        (score, ratee_id),
    )
    conn.execute("UPDATE trips SET status='completed' WHERE id=?", (trip_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Спасибо за оценку!"})


# --------------------------------------------------------------------------
# Demand forecasting dashboard
# --------------------------------------------------------------------------

@app.route("/api/demand/forecast")
def api_forecast():
    return jsonify(demand_module.forecast())


@app.route("/api/demand/summary")
def api_demand_summary():
    return jsonify(demand_module.peak_hours_summary())


if __name__ == "__main__":
    if not os.path.exists(os.path.join(os.path.dirname(__file__), "poputka.db")):
        init_db(reset=True)
    app.run(debug=True, port=5000)
