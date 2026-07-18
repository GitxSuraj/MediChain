# MediChain — setup and run instructions

## 1. Prerequisites

Install Python 3.10+ and Node.js 20+. Create a MongoDB Atlas cluster (or run local MongoDB).

## 2. Configure MongoDB

1. Open `backend/.env` (copy it from `backend/.env.example` if needed).
2. Set `MONGO_URI` to your MongoDB connection string.
3. Set `DATABASE_NAME=medichain` (or another name you prefer).
4. For Atlas, add your current IP address in **Network Access** and create a database user.

## 3. Start the backend

Open a terminal in `backend` and run:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python scripts\seed_hospitals.py
uvicorn main:app --reload --port 8000
```

The API should be available at `http://localhost:8000` and its interactive docs at `http://localhost:8000/docs`.

## 4. Start the frontend

Open another terminal in `frontend` and run:

```powershell
npm install
npm run dev
```

Open the local URL shown by Vite (normally `http://localhost:5173`).

## 5. Use the new features

1. On the login page choose **Create a patient account** and register.
2. Book an appointment. It is written to MongoDB and remains after refresh/sign-in.
3. Open **Hospital Directory** to see the same hospitals and bed information used by the hospital portal.
4. Use **Request Transfer** as a patient to send a destination-specific request.
5. Open `/hospital-login`, select a hospital, and sign in with `Hospital@123` after seeding. The hospital portal at `/admin` is restricted to that hospital's own beds and incoming requests.

## Notes

* Live bed changes are persisted in MongoDB and broadcast through WebSockets to open screens.
* Passwords are salted and PBKDF2-hashed; sessions are stored in MongoDB. For a public deployment, add HTTPS, expiry/revocation, role-based authorization, and audit logging.
* `npm run build` may expose pre-existing TypeScript casing/JSX compatibility issues in the starter project. The frontend production bundle itself verifies with `npx vite build`.
