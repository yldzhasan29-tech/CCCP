from datetime import datetime
from math import fabs

def find_matches(rides, requested_dt: datetime):
    result = []
    for ride in rides:
        diff = fabs((ride.departure_time - requested_dt).total_seconds()) / 60
        if diff <= 60:
            # Simple MVP scoring: time proximity + driver rating.
            score = max(0, 100 - int(diff)) + int(ride.rating * 5)
            explanation = f"Время отличается на {int(diff)} мин.; рейтинг водителя {ride.rating:.1f}/5."
            result.append({
                "id": ride.id,
                "driver_name": ride.driver_name,
                "from_location": ride.from_location,
                "to_location": ride.to_location,
                "departure_time": ride.departure_time,
                "available_seats": ride.available_seats,
                "price": ride.price,
                "rating": ride.rating,
                "car": ride.car,
                "match_score": score,
                "ai_explanation": explanation,
            })
    return sorted(result, key=lambda x: x["match_score"], reverse=True)
