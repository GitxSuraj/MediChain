# 🏥 MediChain — Unified Hospital Network Platform

MediChain is a real-time hospital network platform that connects patients and hospital staff on a single system — live bed availability, emergency inter-hospital transfers, and patient-facing appointment booking, all synced instantly over WebSockets.

Built in one week by a 3-person first-year team as a hackathon project.

---

## ✨ Features

### 🧑‍⚕️ Patient Portal (`/login`, `/dashboard`, ...)
- Mock authentication (any email + 4+ character password)
- Personal dashboard with health overview
- **Hospital Directory** — browse hospitals with ratings, distance, specialties, and doctor rosters
- **Book Appointment** — 3-step flow: choose hospital → doctor → visit details → confirm
- **Appointment Status** tracking (Pending / Confirmed / Completed)
- **Medical History** — lab reports, prescriptions, and visit timeline
- **Patient Profile** — personal & medical details, ABHA ID, blood group

### 🩺 Admin / Hospital Staff Dashboard (`/admin`)
- **Live network overview** — real-time stat cards for total hospitals and beds available network-wide (ICU / General / Oxygen)
- **Real-time Bed Controller** — increment/decrement bed counts per hospital per category, instantly broadcast to every connected client via WebSockets
- **On-Duty Doctor Directory** — see which doctors are attached to the selected hospital
- **Emergency Transfer System**:
  - Select a patient, pick a destination hospital from a live dropdown, choose the required facility, and send a transfer request
  - Every connected admin sees the request appear **live**, with Accept / Decline actions
  - On acceptance, the patient's record (blood type, allergies, medical history) is pulled and displayed instantly
  - The patient's **current hospital updates automatically** across the whole network the moment a transfer is accepted

### ⚡ Real-Time Backbone
A single shared WebSocket connection manager broadcasts every live event across the app:
- `bed_update` — bed availability changes
- `transfer_request` — a new transfer request is created
- `transfer_response` — a transfer is accepted or declined

No polling, no manual refresh — every connected screen updates the instant something changes anywhere in the network.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+, FastAPI, Pydantic |
| Database | MongoDB (via `pymongo`) |
| Real-time | Native WebSockets, shared connection manager |
| Frontend | React 19 + Vite, TypeScript (patient app) & JavaScript (admin app) |
| Routing | React Router (patient side) |
| Styling | Hand-rolled CSS design system (no framework) |

---

## 📁 Repository Structure

```
MediChain/
├── backend/
│   ├── main.py                  # FastAPI app entrypoint, router registration
│   ├── models/                  # Pydantic schemas (hospital, transfer)
│   ├── database/                # MongoDB access layer (hospitals, transfers, patients)
│   ├── routes/                  # API endpoints (hospitals, transfers, realtime)
│   ├── realtime/                # Shared WebSocket ConnectionManager
│   ├── scripts/                 # seed_hospitals.py — demo data seeding
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # Route definitions (patient + admin)
│   │   ├── pages/                # AdminDashboard, PatientDashboard, BookAppointment, ...
│   │   ├── components/           # BedController, TransferPanel, HospitalCard, ...
│   │   ├── services/             # api.js (real backend calls), hospital.ts / patient.ts / appointment.ts (mocked patient data)
│   │   ├── websocket/socket.js   # Shared WebSocket client helper
│   │   └── context/AuthContext.tsx
│   └── .env.example
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- A MongoDB database (local install or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster)

### 1. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\Activate.ps1        # Windows PowerShell
# source venv/bin/activate       # macOS/Linux

pip install -r requirements.txt
copy .env.example .env           # then fill in MONGO_URI and DATABASE_NAME
```

Seed demo hospitals:
```bash
python -m scripts.seed_hospitals
```

Run the API:
```bash
uvicorn main:app --reload
```
API available at `http://127.0.0.1:8000` · WebSocket at `ws://127.0.0.1:8000/ws`

### 2. Frontend setup

In a **second terminal**:
```bash
cd frontend
npm install
copy .env.example .env           # confirm VITE_API_URL matches your backend
npm run dev
```
App available at `http://localhost:5173`

### 3. Try it out

| Route | What it shows |
|---|---|
| `http://localhost:5173/admin` | Hospital bed system + transfer system (no login required) |
| `http://localhost:5173/login` | Patient portal — any email + 4+ character password |

---

## 🔑 Environment Variables

**`backend/.env`**
```
MONGO_URI=your_mongodb_connection_string
DATABASE_NAME=hospital_network
```

**`frontend/.env`**
```
VITE_API_URL=http://localhost:8000
```

> ⚠️ Never commit real `.env` files. Only `.env.example` files (with placeholder values) belong in the repo.

---

## 🎬 Demo Script (5 minutes)

1. Open **two browser windows** side by side — both on `http://localhost:5173/admin`
2. **Bed update demo**: in window 1, decrement an ICU bed count → watch it update instantly in window 2
3. **Transfer demo**: in window 1, select a patient and send a transfer request to a different hospital → window 2 receives a live alert → click Accept → the patient's record (allergies, blood type, history) appears instantly, and their tracked hospital location updates network-wide
4. Open a **third window** on `/login`, sign in with any email/password, and walk through booking an appointment as a patient

---

## 🧪 What's Mocked vs. Real (by design, for hackathon scope)

| Feature | Status |
|---|---|
| Hospital bed data | ✅ Real — MongoDB, live via WebSockets |
| Transfer system | ✅ Real — MongoDB, live via WebSockets |
| Patient records (admin-side lookup) | ✅ Real — MongoDB |
| Patient login/auth | 🟡 Mocked client-side (any valid-looking credentials work) |
| Appointment booking, patient profile, medical history | 🟡 Mocked client-side (in-memory, resets on reload) |
| Doctor roster | 🟡 Static local data (admin: by hospital name, patient: by hospital ID) |
| Geolocation | 🟡 Text-based city/distance, no real GPS |

This mirrors the original scope: prioritize a rock-solid real-time demo for the two core flows (bed updates, transfers) while keeping the rest of the patient experience fully functional but lightweight.

---

## 🧑‍🤝‍🧑 Team & Ownership

Built by a 3-person team with a vertical-ownership model — each person owned a feature end-to-end (backend + frontend):

- **Bed System & Shared Backend Foundation** — hospital data, WebSocket connection manager, admin bed controller
- **Emergency Transfer System** — transfer requests, live accept/decline, patient record viewer, hospital location tracking
- **Patient-Facing Experience** — login, dashboard, booking, appointment tracking, medical history, hospital directory

---

## 🩹 Troubleshooting

- **Backend won't start** → confirm `venv` is activated and `pip install -r requirements.txt` completed without errors
- **`[]` returned from `/hospitals`** → run `python -m scripts.seed_hospitals`
- **CORS error in browser console** → confirm the backend's CORS middleware allows your frontend origin (already configured for local dev)
- **White screen on load** → hard refresh (`Ctrl+Shift+R`); if it persists, check the browser console (F12) for the exact error — usually an ambiguous import if a stray duplicate file exists
- **PowerShell blocks `npm`/`venv` activation** → run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process`, or use Command Prompt instead

---

## 📌 Status

Core real-time features (bed system, transfer system) are complete and fully tested end-to-end. Patient-facing features are complete on the frontend with mocked data, ready to be connected to real backend endpoints in a future iteration.
