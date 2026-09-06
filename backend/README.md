# Попутка ИИ — простой MVP backend

Backend для вашего фронтенда `Попутка ИИ`. Ваш HTML использует поля «Откуда», «Куда», «Дата» и «Время», а API предоставляет поиск поездок, создание поездки и бронирование. fileciteturn0file0L21-L46

## 1. Установка

```bash
python3 -m venv venv
source venv/bin/activate       # macOS/Linux
# Windows: venv\Scripts\activate

pip3 install -r requirements.txt
```

## 2. Запуск

```bash
uvicorn app.main:app --reload
```

API будет на `http://127.0.0.1:8000`

Swagger: `http://127.0.0.1:8000/docs`

## 3. Тестовые данные

После запуска откройте:

```text
POST /seed
```

через Swagger или curl.

## 4. Поиск

Пример:

```text
GET /rides/search?from_location=УрФУ%20%2F%20Главный%20корпус&to_location=Новокольцовский%20кампус&date=2026-09-07&time=08:30
```

Ответ содержит поездки, `match_score` и объяснение совпадения.

## 5. Подключение frontend

В `app.js` используйте:

```javascript
const API = "http://127.0.0.1:8000";

const params = new URLSearchParams({
  from_location: document.getElementById("from").value,
  to_location: document.getElementById("to").value,
  date: document.getElementById("date").value,
  time: document.getElementById("time").value,
});

fetch(`${API}/rides/search?${params}`)
  .then(r => r.json())
  .then(data => console.log(data));
```

Для хакатона этого достаточно как демонстрационного MVP: SQLite вместо отдельного PostgreSQL-сервера, простой matching вместо сложной ML-модели и Swagger для демонстрации API.
