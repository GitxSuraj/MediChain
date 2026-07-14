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
