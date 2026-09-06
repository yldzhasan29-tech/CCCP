"""
pricing.py — Динамическое ценообразование (dynamic pricing).

Computes a fair per-passenger price for a matched trip, based on:
  - distance from the pickup zone to campus,
  - traffic conditions at the departure hour (peak vs off-peak),
  - number of passengers sharing the car (cost split),
while always keeping the result below the taxi price range and above a
floor that fairly compensates the driver's fuel.

In production the traffic factor would come from a live source such as
the Yandex.Maps API (see brief: "пробок (через API Яндекс.Карт)"); here
we simulate it with a simple time-of-day model so the whole app works
offline for the demo.
"""

from database import ZONES, TAXI_MIN, TAXI_MAX

BASE_RATE_PER_KM = 14        # RUB/km, base fuel+wear cost
DRIVER_MARGIN = 1.15         # small margin so driving is worth it for the driver
FUEL_FLOOR_RUB = 60          # minimum total trip payout to the driver

# Peak hours (rush hour into/out of campus) get a traffic multiplier.
PEAK_HOURS = {7, 8, 9, 16, 17, 18}


def traffic_multiplier(hour: int) -> float:
    """Simulated traffic factor: 1.35x during rush hour, 1.0x otherwise."""
    return 1.35 if hour in PEAK_HOURS else 1.0


def is_peak_hour(hour: int) -> bool:
    return hour in PEAK_HOURS


def calculate_trip_price(origin_zone: str, departure_time: str, seats_shared: int):
    """
    Returns a dict with the total trip cost and the fair per-passenger price.

    origin_zone: one of database.ZONES keys
    departure_time: 'HH:MM'
    seats_shared: how many passengers are splitting this ride (>=1)
    """
    distance_km = ZONES.get(origin_zone)
    if distance_km is None:
        raise ValueError(f"Unknown zone: {origin_zone}")

    hour = int(departure_time.split(":")[0])
    mult = traffic_multiplier(hour)

    total_cost = distance_km * BASE_RATE_PER_KM * mult * DRIVER_MARGIN
    total_cost = max(total_cost, FUEL_FLOOR_RUB)

    seats_shared = max(1, seats_shared)
    per_passenger = round(total_cost / seats_shared)

    # Safety net: never charge at or above the cheapest taxi estimate.
    per_passenger = min(per_passenger, TAXI_MIN - 50)
    per_passenger = max(per_passenger, 40)

    return {
        "distance_km": distance_km,
        "traffic_multiplier": mult,
        "is_peak": is_peak_hour(hour),
        "total_trip_cost_rub": round(total_cost),
        "price_per_passenger_rub": per_passenger,
        "taxi_estimate_rub": [TAXI_MIN, TAXI_MAX],
        "savings_rub": TAXI_MIN - per_passenger,
    }
