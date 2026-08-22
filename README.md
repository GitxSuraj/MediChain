
# 🏥 MediChain — Unified Hospital Network Platform

> **A real-time hospital network platform** connecting patients and hospitals through live bed availability, appointment management, emergency patient transfers, and hospital operations.

<p align="center">

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![WebSockets](https://img.shields.io/badge/WebSockets-Real--Time-success?style=for-the-badge)

</p>

---

## ✨ Features

### 👤 Patient Portal

- ✅ MongoDB-backed patient registration & login
- ✅ Persistent patient profile with ABHA ID, blood group, allergies
- ✅ Browse hospitals with live bed availability (General, ICU, Oxygen, Emergency)
- ✅ Book appointments with time slot selection
- ✅ Track appointment status
- ✅ Submit hospital transfer requests
- ✅ Medicine Reminders (add, manage, schedule)
- ✅ Medical History with vitals tracking and file upload (Lab reports, Prescriptions, Scans)
- ✅ Medicine Store with cart and Razorpay payment
- ✅ My Orders — order history tracking
- ✅ Find hospitals on interactive map with directions (Leaflet / OpenStreetMap)
- ✅ Hospital Reviews & Ratings
- ✅ Real-time WebSocket notifications

**Appointment Status**
- 🟡 Pending
- 🟢 Confirmed
- 🔵 Completed
- 🔴 Cancelled

---

### 🏥 Hospital Portal

Accessible via **`/hospital-login`**

- Secure hospital staff login
- Hospital Admin Dashboard
- Manage ICU, General, Oxygen & Emergency beds
- Receive & manage appointment requests (Accept/Decline)
- Receive & manage transfer requests (Accept/Decline)
- Inventory management
- Billing management
- Super Admin Dashboard for platform-wide oversight
- Secure logout

---

## ⚡ Real-Time Updates

Powered by **Native WebSockets**

| Event | Description |
|-------|-------------|
| `bed_update` | Live bed availability |
| `transfer_request` | New transfer request |
| `transfer_response` | Accepted / Declined transfer |

---

# 🛠 Tech Stack

| Layer | Technology |
|------|------------|
| Backend | Python • FastAPI • Pydantic |
| Database | MongoDB + PyMongo |
| Frontend | React • Vite • TypeScript • JavaScript |
| Real-time | Native WebSockets |
| Styling | Custom CSS |

---

# 📂 Project Structure

```text
MediChain/
├── backend/
│   ├── database/
│   ├── models/
│   ├── routes/
│   ├── realtime/
│   ├── scripts/
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── websocket/
│   └── package.json
│
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

- Python **3.10+**
- Node.js **18+**
- MongoDB Atlas or Local MongoDB

### 1️⃣ Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
copy .env.example .env
```

**backend/.env**

```env
MONGO_URI=your_mongodb_connection_string
DATABASE_NAME=hospital_network
```

Seed hospitals:

```bash
python -m scripts.seed_hospitals
```

Run backend:

```bash
uvicorn main:app --reload --port 8000
```

- API → http://localhost:8000
- Docs → http://localhost:8000/docs

---

### 2️⃣ Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

**frontend/.env**

```env
VITE_API_URL=http://localhost:8000
```

Frontend:

http://localhost:5173

---

# 🔐 Login

## 👤 Patient

`http://localhost:5173/login`

Create a patient account. All patient information is stored in MongoDB.

## 🏥 Hospital

`http://localhost:5173/hospital-login`

**Password**

```text
Hospital@123
```

Redirects to:

`http://localhost:5173/admin`

---

# 🗺 Important Routes

| Route | Description |
|------|-------------|
| `/` | Landing Page |
| `/login` | Patient Login / Register |
| `/dashboard` | Patient Dashboard |
| `/profile` | Patient Profile |
| `/book-appointment` | Book Appointment |
| `/appointment-status` | Appointment Status |
| `/hospitals` | Hospital Directory |
| `/hospital-map` | Find Hospitals on Map |
| `/medical-history` | Medical History & Vitals |
| `/medicine-reminders` | Medicine Reminders |
| `/medicine-store` | Medicine Store (Pharmacy) |
| `/my-orders` | My Orders |
| `/transfer` | Transfer Request |
| `/hospital-login` | Hospital Login |
| `/admin` | Hospital Admin Dashboard |
| `/super-admin` | Super Admin Dashboard |

---

# 🌱 Database Seeding

```bash
python -m scripts.seed_hospitals
```

Creates demo hospitals and hospital login accounts.

> ⚠️ Do not run this on an existing production database.

---

# 💾 Persistent Features

| Feature | Stored In |
|---------|-----------|
| Patient Accounts | MongoDB |
| Patient Profiles (ABHA, allergies, blood group) | MongoDB |
| Bed Availability | MongoDB |
| Appointments | MongoDB |
| Transfers | MongoDB |
| Hospital Sessions | MongoDB |
| Medicine Reminders | MongoDB |
| Orders & Payments | MongoDB |
| Medical Records & Files (base64) | MongoDB |
| Vitals & Health Summary | MongoDB |
| Hospital Reviews & Ratings | MongoDB |

---

# 📝 Notes

- Never commit `.env` files.
- Store credentials using environment variables.
- Run `python -m scripts.seed_hospitals` to populate the database with demo hospitals.
- `VITE_*` environment variables are baked in at Vite build time — redeploy Vercel after any `VITE_` change.

---

## ⭐ Future Improvements

- Email / SMS notifications for appointment confirmations
- Doctor roster management
- Analytics dashboard for hospitals
- Docker compose deployment
- Mobile app (React Native)

---

<p align="center">
Made with ❤️ using FastAPI, React, MongoDB and WebSockets.
</p>


---

# 🧑‍🤝‍🧑 Team & Contributors

Built by a **3-person team** using a **vertical ownership model**, where each member owned a feature end-to-end (backend + frontend). Each member also extended the platform with significant V2 additions before final integration and deployment.

---

### 👨‍💻 Satyam Jaiswal — Person A

**Base Work:**
- 🚑 Emergency Transfer System — full backend + frontend transfer request workflow
- ✅ Live accept/decline transfer functionality
- 🏥 Hospital Login UI and hospital staff authentication
- 🔗 Integration of backend and frontend modules across the full application

**V2 Additions:**
- 🔀 Merged all three persons' codebases into the unified `MediChain_Merged` project
- ⚙️ Backend: Medicine Reminders API, Orders API, Hospital Reviews API, Vitals API, Clinic Management API
- 🗺️ Mock hospital locations + Find on Map feature (Leaflet/OpenStreetMap integration)
- 📋 Medical history file upload with base64 preview (100 KB limit)
- 🔔 Real-time WebSocket notifications
- 🌐 Landing Page with hero section, feature overview, and hospital lead form
- 🚀 Production deployment — Vercel (frontend) + Render (backend) + GitHub CI

---

### 👨‍💻 Suraj Sharma — Person B

**Base Work:**
- 🛏️ Bed System & Shared Backend Foundation
- 🏥 Hospital data management, live bed controller
- 🔌 WebSocket connection manager and real-time bed updates

**V2 Additions:**
- 💊 Medicine Store (product listing, cart, order placement)
- 📦 My Orders page — order history tracking
- 💳 Payment integration with Razorpay
- 🏥 Hospital Admin Dashboard — inventory management, billing, appointment requests
- 🔐 Super Admin Dashboard — platform-wide oversight
- 🩺 Hospital Directory with search, filter, and hospital detail modal
- ⭐ Hospital review and rating system

---

### 👩‍💻 Sajal Vaish — Person C

**Base Work:**
- 💻 Patient-facing frontend — Login, Dashboard, Profile
- 📅 Appointment Booking and Appointment Status
- 🗺️ Hospital Directory and Hospital Location Tracking
- 🎨 Patient portal UI development

**V2 Additions:**
- 🎨 Complete UI/UX Master Rebuild — production-quality healthcare SaaS design system
- 🌿 Dark Navy & Emerald high-contrast sidebar with Lucide icons
- 📊 Vibrant colorful Patient Dashboard — Welcome banner, 4-metric Health Summary vitals, Quick Action cards, Today's Medications, Upcoming Appointment card
- 🏥 Rebuilt Hospital Directory, Hospital Card, Map View, Hospital Detail Modal, and Hospital Review Form
- 🩺 Rebuilt Medical History Timeline, Patient Profile, Medical Record upload & preview
- 💊 Rebuilt Medicine Reminders, Medication Reminders, Medicine Store, My Orders pages
- 📱 Rebuilt Sidebar, Navbar, Appointment Status, Book Appointment, Patient Transfer pages
- 🔑 MediChain logo integrated on Login and Landing Page hero
- 🔧 Vercel SPA routing fix (`vercel.json` rewrites) for 404 on direct link and page refresh

---

# 🩹 Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend won't start | Ensure the virtual environment is activated and run `pip install -r requirements.txt`. |
| `/hospitals` returns `[]` | Run `python -m scripts.seed_hospitals`. |
| CORS error | Verify the backend CORS middleware allows your frontend origin. |
| White screen on startup | Hard refresh (`Ctrl + Shift + R`). If it persists, open the browser console (`F12`) and check for import/runtime errors. |
| PowerShell blocks `npm` or virtual environment activation | Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` or use Command Prompt. |

---

<p align="center">

⭐ **If you found this project interesting, consider giving it a star!** ⭐

Built with ❤️ using **FastAPI**, **React**, **MongoDB**, and **WebSockets**.

</p>
