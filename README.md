# MediChain — Hospital Network Application

Overview

MediChain provides a real-time hospital bed-tracking and simple transfer notification system. It includes a FastAPI backend (MongoDB), a WebSocket manager for realtime events, and a React (Vite) frontend with separate Admin and Patient dashboards.

Key features

- Live bed availability updates via WebSockets
- Hospital list with search & filters (facility, city)
- Admin bed controller to increment/decrement bed counts
- Mock login to switch between Admin/Patient views
- Seed scripts for demo data

Tech stack

- Backend: Python 3.11+, FastAPI, pymongo
- Realtime: WebSockets (FastAPI connection manager)
- Database: MongoDB
- Frontend: React (Vite)

Repository structure (important paths)

- backend/       — FastAPI app, routes, MongoDB integration
- frontend/      — React app (Vite)
- backend/.env.example — sample env for MongoDB
- frontend/.env.example — sample env for frontend API URL

Environment variables

Backend (.env in backend/)
- MONGO_URI (e.g. mongodb://localhost:27017)
- DATABASE_NAME (e.g. medichain)

Frontend (.env in frontend/)
- VITE_API_URL (e.g. http://localhost:8000)

Installation & run (Windows)

1. Backend
   - Open a terminal in the repository root or backend/
   - Create and activate a virtualenv (PowerShell):
     .\backend\.venv\Scripts\Activate.ps1    # or use CMD: .\backend\.venv\Scripts\activate.bat
   - Install requirements:
     pip install -r backend/requirements.txt
   - Copy env example and edit if needed:
     copy backend\.env.example backend\.env
   - Start the API (recommended from backend/):
     uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

   Notes: If PowerShell blocks scripts (npm/activate), either run PowerShell as Administrator and set execution policy for the session:
     Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
   Or open cmd.exe to activate virtualenv with the .bat script.

2. Frontend
   - Open a separate terminal in /frontend
   - Install packages:
     npm install
   - Start dev server:
     npm run dev
   - Frontend runs on Vite default port (5173). If host is 127.0.0.1 the URL will be http://127.0.0.1:5173

   Windows note: If PowerShell reports an npm.ps1 execution policy error, run the commands in Command Prompt (cmd.exe) or use `npm.cmd` instead of `npm` in PowerShell.

Quick health checks

- Backend root: GET http://127.0.0.1:8000/ should return {"status":"Hospital Network API running"}
- WebSocket endpoint: ws://127.0.0.1:8000/ws
- Frontend: open http://127.0.0.1:5173 (or the host/port printed by Vite)

Demo workflow (5–10 minutes)

1. Start MongoDB locally.
2. Start backend (see above) and run seed script if desired:
   python -m scripts.seed_hospitals
3. Start frontend (npm run dev).
4. Open two browser windows/tabs:
   - Patient dashboard (select mock login as Patient)
   - Admin dashboard (select mock login as Admin for one seeded hospital)
5. In Admin dashboard, decrement/increment a bed category (e.g., ICU).
6. Observe the Patient dashboard updating in real-time without refresh.

Testing checklist (important)

- Hospital list loads and filters by facility/city
- Admin bed updates broadcast and patient UI updates live
- No runtime errors in browser console or backend logs when following demo flow

Troubleshooting notes

- If backend fails to start: ensure uvicorn is installed in the virtualenv (pip install uvicorn) and requirements are installed.
- If frontend dev server fails: run `npm install` in /frontend, then `npm run dev` from cmd.exe if PowerShell blocks npm scripts.
- Do NOT add .env files to source control. Keep sensitive credentials out of the repo.

Contribution / Milestone 10 scope

This repository has completed Milestones 0–9. Milestone 10 (this branch) focuses on final integration, testing, documentation, and demo readiness only. No production refactors, renames, or tech-stack changes were made.

Contact / Demo tip

- For a smooth demo, assign one operator to the UI and one narrator. Keep MongoDB running and seed demo data before the run.

---

(Updated README for Milestone 10: final integration & demo instructions)
