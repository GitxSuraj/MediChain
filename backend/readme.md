# Backend

## MongoDB Connection

Copy `.env.example` to `.env` and ensure MongoDB is running before testing the connection.

Required environment variables:

```env
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=medichain
```

Run the connection check from the `backend` directory:

```powershell
.\.venv\Scripts\python.exe -m database.mongodb
```

MongoDB connection requires a running MongoDB instance. If MongoDB is not available locally, the check will report that requirement instead of claiming a successful connection.

## Hospital Seed Data

Seed the `hospitals` collection with five demo hospitals:

```powershell
.\.venv\Scripts\python.exe -m scripts.seed_hospitals
```

The seed script is idempotent and updates hospitals by `name` and `city`.

Hospital documents use this shape:

```json
{
  "name": "CityCare General Hospital",
  "city": "Delhi",
  "facilities": ["Emergency", "ICU", "Oxygen", "Pharmacy"],
  "beds": {
    "general": {"total": 120, "available": 42},
    "icu": {"total": 24, "available": 6},
    "oxygen": {"total": 40, "available": 12},
    "emergency": {"total": 18, "available": 5}
  }
}
```

## Hospital API

List all hospitals:

```http
GET /hospitals
```

Filter by facility and city:

```http
GET /hospitals?facility=ICU&city=Delhi
```

Update bed availability:

```http
POST /beds/{hospital_id}/{category}
Content-Type: application/json

{
  "delta": -1
}
```

Supported bed categories are `general`, `icu`, `oxygen`, and `emergency`. The API prevents available beds from going below `0` or above the category total.

## WebSocket API

Connect to realtime updates:

```text
ws://localhost:8000/ws
```

The server sends a `connection_established` event when a client connects. Clients can send `{"event": "ping"}` and receive `{"event": "pong"}`. Broadcast events are handled by the shared connection manager and will be used by bed updates in the next milestone.

Successful bed updates broadcast this event to all connected WebSocket clients:

```json
{
  "event": "bed_update",
  "hospital_id": "65f...",
  "category": "icu",
  "new_available_count": 4
}
```
