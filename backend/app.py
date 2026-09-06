from fastapi import FastAPI, HTTPException
import sqlite3
from datetime import timedelta, datetime

# Создаем базу данных и заполняем её тестовыми данными
def init_db():
    conn = sqlite3.connect('rides.db')
    c = conn.cursor()
    
    # Таблица поездок
    c.execute('''
        CREATE TABLE IF NOT EXISTS rides (
            id INTEGER PRIMARY KEY,
            driver_id TEXT,
            from_location TEXT,
            to_location TEXT,
            departure_time DATETIME,
            seats SMALLINT DEFAULT 4,
            price NUMERIC(8, 2),
            available_seats SMALLINT DEFAULT 4
        )
    ''')

    # Посеиваем демо-данные только при первом запуске
    try:
        # Проверяем, пустая ли база
        c.execute("SELECT COUNT(*) FROM rides")
        if not c.fetchone()[0]:
            # Добавляем поездки на 7 сентября 2026 года
            demo_data = [
                {"departure": "2026-09-07T08:30", "price": 50},
                {"departure": "2026-09-07T08:45", "price": 60},
                {"departure": "2026-09-07T17:30", "price": 40},
                {"departure": "2026-09-07T19:00", "price": 30}
            ]
            
            for ride in demo_data:
                c.execute(
                    """
                    INSERT INTO rides 
                        (driver_id, from_location, to_location, departure_time, seats, price)
                    VALUES ('demo_driver', 'УрФУ / Главный корпус', 'Новокольцовский кампус', ?, 4, ?);
                    """,
                    [ride["departure"], ride["price"]]
                )
    except Exception as e:
        print(f"Ошибка инициализации БД: {e}")
        
    conn.commit()
    conn.close()

init_db()  # Инициализируем базу


# Запускаем приложение
app = FastAPI()

@app.get("/rides/search/")
async def search_rides(from_location: str | None = None, to_location: str | None = None, date: str | None = None, time: str | None = None):
    """Поиск по времени и маршруту."""

    # Парсим время запроса пользователя
    requested_dt = datetime.strptime(date + " " + time, "%Y-%m-%d %H:%M") if date and time else None

    # Если нет даты или времени, возвращаем все доступные поездки
    query_params = []
    sql_query = "SELECT *, CASE WHEN available_seats > 0 THEN 1 ELSE 0 END AS match_score FROM rides WHERE"

    if requested_dt is not None:
        # Искать в окне ±30 минут от запрошенного времени
        start_window = requested_dt - timedelta(minutes=30)
        end_window = requested_dt + timedelta(minutes=30)
        sql_query += " departure_time BETWEEN ? AND ?"
        query_params.extend([start_window.isoformat(), end_window.isoformat()])

    # Фильтруем маршруты
    if from_location:
        sql_query += f" AND from_location LIKE '%{from_location}%'"
    if to_location:
        sql_query += f" AND to_location LIKE '%{to_location}%'"

    with sqlite3.connect('rides.db') as conn:
        cursor = conn.cursor()
        cursor.execute(sql_query, tuple(query_params))
        rows = cursor.fetchall()

    # Формируем ответ для фронта
    result = []
    for row in rows:
        r = {
            "id": row[0],
            "driver_name": "Демо водитель",   # Для MVP подставим фиктивные данные
            "rating": 4.8,
            "car": "Hyundai Solaris",
            "from_location": row[2],
            "to_location": row[3],
            "time": row[4].split("T")[1][:5],  # Формат 08:30
            "price": float(row[6]),
            "available_seats": int(row[7]),
            "match_score": int(row[8] * 100),  # Процент совпадения
            "ai_explanation": "Маршрут и время близки к запросу."
        }
        result.append(r)

    return result[:5]  # Вернем максимум 5 вариантов


@app.post("/rides/{ride_id}/book/")
async def book_ride(ride_id: int, seats: int = 1):
    """Бронирование места. Просто уменьшаем количество доступных мест."""

    with sqlite3.connect('rides.db') as conn:
        cursor = conn.cursor()

        # Проверка наличия свободных мест
        cursor.execute("SELECT available_seats FROM rides WHERE id=?", (ride_id,))
        current_seats = cursor.fetchone()
        if not current_seats or current_seats[0] < seats:
            raise HTTPException(status_code=400, detail="Нет свободных мест!")

        # Забронировать место
        new_seats = current_seats[0] - seats
        cursor.execute("UPDATE rides SET available_seats=? WHERE id=?", (new_seats, ride_id))

    return {"status": "success"}