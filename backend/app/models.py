from sqlalchemy import Column, Integer, String, DateTime, Float
from .database import Base

class Ride(Base):
    __tablename__ = "rides"

    id = Column(Integer, primary_key=True, index=True)
    driver_name = Column(String, nullable=False)
    from_location = Column(String, nullable=False)
    to_location = Column(String, nullable=False)
    departure_time = Column(DateTime, nullable=False)
    available_seats = Column(Integer, default=1)
    price = Column(Float, default=0)
    rating = Column(Float, default=5.0)
    car = Column(String, default="")
