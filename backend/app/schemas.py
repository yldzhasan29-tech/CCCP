from datetime import datetime
from pydantic import BaseModel, ConfigDict

class RideCreate(BaseModel):
    driver_name: str
    from_location: str
    to_location: str
    departure_time: datetime
    available_seats: int = 1
    price: float = 0
    rating: float = 5.0
    car: str = ""

class RideOut(RideCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)

class RideMatch(RideOut):
    match_score: int
    ai_explanation: str

class BookingCreate(BaseModel):
    seats: int = 1
