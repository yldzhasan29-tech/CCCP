"""
seed_data.py — populates the database with realistic demo data so the
demand-forecasting dashboard and matching demo have something to show
right after setup, without needing to manually create dozens of entries.

Run with:  python seed_data.py
"""

import random
from database import init_db, get_connection, ZONES

random.seed(42)

DEMO_DRIVERS = [
    ("Артём Соколов", "artem.sokolov@stud.urfu.ru"),
    ("Мария Иванова", "maria.ivanova@stud.urfu.ru"),
    ("Данил Петров", "danil.petrov@stud.urfu.ru"),
    ("Полина Смирнова", "polina.smirnova@stud.urfu.ru"),
]

DEMO_PASSENGERS = [
    ("Егор Кузнецов", "egor.kuznetsov@stud.urfu.ru"),
    ("Алина Волкова", "alina.volkova@stud.urfu.ru"),
    ("Иван Морозов", "ivan.morozov@stud.urfu.ru"),
    ("Софья Лебедева", "sofia.lebedeva@stud.urfu.ru"),
    ("Кирилл Новиков", "kirill.novikov@stud.urfu.ru"),
    ("Дарья Козлова", "daria.kozlova@stud.urfu.ru"),
]


def add_user(conn, name, email, emergency="+7 900 000-00-00"):
    verified = 1 if email.endswith("@stud.urfu.ru") else 0
    cur = conn.execute(
        "INSERT INTO users (name, email, verified, emergency_contact) VALUES (?,?,?,?)",
        (name, email, verified, emergency),
    )
    return cur.lastrowid


def main():
    init_db(reset=True)
    conn = get_connection()

    driver_ids = [add_user(conn, n, e) for n, e in DEMO_DRIVERS]
    passenger_ids = [add_user(conn, n, e) for n, e in DEMO_PASSENGERS]

    zones = list(ZONES.keys())
    directions = ["to_campus", "from_campus"]

    # --- Driver routes for "today" (used for live matching demo) ---
    live_routes = [
        (driver_ids[0], "Уралмаш", "to_campus", "08:30", 3),
        (driver_ids[1], "Центр", "to_campus", "08:15", 4),
        (driver_ids[2], "Юго-Западный", "to_campus", "08:45", 2),
        (driver_ids[3], "Центр", "from_campus", "18:00", 3),
        (driver_ids[0], "Академический", "from_campus", "17:30", 3),
    ]
    for drv, zone, direction, dep_time, seats in live_routes:
        conn.execute(
            """INSERT INTO routes (driver_id, origin_zone, direction, departure_time,
               flexibility_min, seats_total, seats_available, music, talkative)
               VALUES (?,?,?,?,15,?,?,1,1)""",
            (drv, zone, direction, dep_time, seats, seats),
        )

    # --- Historical ride requests (last ~2 weeks) to feed demand forecasting ---
    # Morning peak (7-9) and evening peak (17-18) get many more requests,
    # so the demand model has something meaningful to show.
    peak_weight = {7: 6, 8: 10, 9: 5, 17: 8, 18: 9}
    for _ in range(220):
        hour = random.choices(
            population=list(range(6, 22)),
            weights=[peak_weight.get(h, 1) for h in range(6, 22)],
        )[0]
        minute = random.choice(["00", "15", "30", "45"])
        direction = "to_campus" if hour < 13 else "from_campus"
        zone = random.choice(zones)
        passenger = random.choice(passenger_ids)
        conn.execute(
            """INSERT INTO ride_requests
               (passenger_id, origin_zone, direction, desired_time, flexibility_min, passengers_count, status)
               VALUES (?,?,?,?,15,1,'completed')""",
            (passenger, zone, direction, f"{hour:02d}:{minute}"),
        )

    conn.commit()
    conn.close()
    print("Seed data inserted: 4 drivers, 6 passengers, 5 live routes, 220 historical requests.")
    print("\nDemo accounts (all verified via @stud.urfu.ru):")
    for n, e in DEMO_DRIVERS + DEMO_PASSENGERS:
        print(f"  {n:20s} {e}")


if __name__ == "__main__":
    main()
