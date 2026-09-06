"""
database.py — SQLite schema and connection helper for Попутка ИИ.

Keeps everything in a single file on disk (poputka.db) so the whole
project can run with zero external services — good for a hackathon demo.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "poputka.db")

# Predefined pickup zones in Yekaterinburg and their approximate distance
# (km) to the campus (Novokoltsovsky). In a real product this would come
# from a maps API (e.g. Yandex.Maps), but for the demo we hardcode it so
# the whole thing works fully offline.
ZONES = {
    "Центр":            6.5,
    "Уралмаш":          9.0,
    "ВИЗ":              8.0,
    "Юго-Западный":     10.5,
    "Академический":    11.0,
    "Ботанический":     7.5,
    "Химмаш":           12.0,
}

CAMPUS = "Новокольцовский кампус"

# Reference taxi price range mentioned in the brief (RUB), used only to
# show the savings compared with a taxi.
TAXI_MIN, TAXI_MAX = 400, 700


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    verified INTEGER NOT NULL DEFAULT 0,
    emergency_contact TEXT,
    rating_sum INTEGER NOT NULL DEFAULT 0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_id INTEGER NOT NULL REFERENCES users(id),
    origin_zone TEXT NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('to_campus','from_campus')),
    departure_time TEXT NOT NULL,        -- 'HH:MM'
    flexibility_min INTEGER NOT NULL DEFAULT 15,
    seats_total INTEGER NOT NULL,
    seats_available INTEGER NOT NULL,
    music INTEGER NOT NULL DEFAULT 1,     -- 1 = music ok, 0 = no music
    talkative INTEGER NOT NULL DEFAULT 1, -- 1 = happy to chat, 0 = quiet ride
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ride_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    passenger_id INTEGER NOT NULL REFERENCES users(id),
    origin_zone TEXT NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('to_campus','from_campus')),
    desired_time TEXT NOT NULL,
    flexibility_min INTEGER NOT NULL DEFAULT 15,
    passengers_count INTEGER NOT NULL DEFAULT 1,
    pref_music INTEGER,          -- NULL = no preference
    pref_talkative INTEGER,      -- NULL = no preference
    status TEXT NOT NULL DEFAULT 'pending', -- pending / matched / cancelled
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id INTEGER NOT NULL REFERENCES routes(id),
    request_id INTEGER NOT NULL REFERENCES ride_requests(id),
    price_rub INTEGER NOT NULL,
    match_score REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed / completed / cancelled
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL REFERENCES trips(id),
    rater_id INTEGER NOT NULL REFERENCES users(id),
    ratee_id INTEGER NOT NULL REFERENCES users(id),
    score INTEGER NOT NULL CHECK(score BETWEEN 1 AND 5),
    comment TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""


def init_db(reset=False):
    if reset and os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    conn = get_connection()
    conn.executescript(SCHEMA)
    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db(reset=True)
    print(f"Database initialised at {DB_PATH}")
