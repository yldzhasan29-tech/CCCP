from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import Base, engine, get_db
from . import models, schemas
from .matching import find_matches

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Попутка ИИ API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"service": "Попутка ИИ", "status": "ok"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/rides", response_model=list[schemas.RideOut])
def rides(db: Session = Depends(get_db)):
    return db.query(models.Ride).filter(models.Ride.available_seats > 0).all()

@app.post("/rides", response_model=schemas.RideOut)
def create_ride(ride: schemas.RideCreate, db: Session = Depends(get_db)):
    obj = models.Ride(**ride.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@app.get("/rides/search", response_model=list[schemas.RideMatch])
def search_rides(
    from_location: str,
    to_location: str,
    date: str,
    time: str,
    db: Session = Depends(get_db),
):
    try:
        requested_dt = datetime.fromisoformat(f"{date}T{time}")
    except ValueError:
        raise HTTPException(400, "Неверные дата или время")

    rides = db.query(models.Ride).filter(
        models.Ride.from_location == from_location,
        models.Ride.to_location == to_location,
        models.Ride.available_seats > 0,
    ).all()

    return find_matches(rides, requested_dt)

@app.post("/rides/{ride_id}/book")
def book_ride(ride_id: int, booking: schemas.BookingCreate, db: Session = Depends(get_db)):
    ride = db.query(models.Ride).filter(models.Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(404, "Поездка не найдена")
    if ride.available_seats < booking.seats:
        raise HTTPException(400, "Недостаточно свободных мест")
    ride.available_seats -= booking.seats
    db.commit()
    return {"message": "Место забронировано", "ride_id": ride_id, "seats": booking.seats}

@app.post("/seed")
def seed(db: Session = Depends(get_db)):
    if db.query(models.Ride).count():
        return {"message": "Тестовые данные уже есть"}
    demo = [
        models.Ride(driver_name="Алексей", from_location="УрФУ / Главный корпус",
                    to_location="Новокольцовский кампус", departure_time=datetime(2026,9,7,8,30),
                    available_seats=3, price=120, rating=4.9, car="Kia Rio"),
        models.Ride(driver_name="Дмитрий", from_location="УрФУ / Главный корпус",
                    to_location="Новокольцовский кампус", departure_time=datetime(2026,9,7,8,45),
                    available_seats=2, price=100, rating=4.8, car="Hyundai Solaris"),
        models.Ride(driver_name="Иван", from_location="Площадь 1905 года",
                    to_location="Новокольцовский кампус", departure_time=datetime(2026,9,7,8,30),
                    available_seats=1, price=150, rating=4.7, car="Lada Vesta"),
    ]
    db.add_all(demo)
    db.commit()
    return {"message": "Добавлены тестовые поездки", "count": len(demo)}
