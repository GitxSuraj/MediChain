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
