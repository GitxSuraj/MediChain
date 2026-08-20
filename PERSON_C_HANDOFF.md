# 🟠 Person C — Patient Experience — Handoff Guide

> Read this before writing a single line of code. Everything Person A has already built that you depend on is documented here.

---

## ✅ What Person A Has Already Built (Don't Rebuild)

| Feature | File(s) | Status |
|---|---|---|
| Hospital staff auth | `backend/routes/hospital_auth.py` | ✅ Done |
| Payment backend (create-order + verify) | `backend/routes/payments.py` | ✅ Done |
| Payment frontend component | `frontend/src/components/PaymentCheckout.tsx` | ✅ Done |
| Payment service | `frontend/src/services/payment.ts` | ✅ Done |
| BookAppointment wired to payment | `frontend/src/pages/BookAppointment.tsx` | ✅ Done |
| Targeted WebSocket send | `backend/realtime/connection_manager.py` | ✅ Done |
| Notification bell in Navbar | `frontend/src/components/Navbar.tsx` | ✅ Done (basic wiring) |

---

## 🗺 Your Files — Full Ownership List

### Backend (create these)
| File | Purpose |
|---|---|
| `backend/models/reminder.py` | Reminder model |
| `backend/database/reminders.py` | DB helpers |
| `backend/routes/reminders.py` | CRUD: `GET/POST/PUT/DELETE /patients/{id}/reminders` |
| `backend/models/review.py` | Review model |
| `backend/database/reviews.py` | DB helpers |
| `backend/routes/reviews.py` | `GET/POST /hospitals/{id}/reviews` (gated to completed appt) |

### Frontend (create these)
| File | Purpose |
|---|---|
| `frontend/src/hooks/useNotifications.ts` | `fireAlert(type, message)` hook |
| `frontend/src/components/NotificationBell.tsx` | *(optional — Navbar already has basic bell)* |
| `frontend/src/pages/MedicineReminders.tsx` | Reminder CRUD + `setInterval` checker |
| `frontend/src/services/reminders.ts` | API calls for reminders |
| `frontend/src/components/HospitalReviewForm.tsx` | Star-rating form |
| `frontend/src/components/MapView.tsx` | Leaflet map with hospital pins |
| `frontend/src/components/DirectionsButton.tsx` | Google Maps directions link (no API key) |

### Modify these (flagged — message team before touching)
| File | What to change | Risk |
|---|---|---|
| `frontend/src/pages/HospitalDirectory.tsx` | Add ratings + bed counts to cards | Low |
| `frontend/src/pages/PatientHistory.tsx` | Call real `GET /patients/{id}/history` | Medium — confirm B's endpoint shape |
| `frontend/src/App.tsx` | Change `/` route to `<Cover />` or `<LandingPage />` — **flag in PR** | High |

---

## 🔌 How to Register Your Backend Routes

Open `backend/main.py` and add these:

```python
from routes.reminders import router as reminders_router
from routes.reviews   import router as reviews_router

app.include_router(reminders_router)
app.include_router(reviews_router)
```

---

## 💳 Payment Handoff Contract (with Person A)

The payment flow is **already wired** in `BookAppointment.tsx`. You do NOT need to touch it.  
If you need to know how it works for your `PatientHistory.tsx`:

```typescript
// In BookAppointment.tsx — already done:
const order = await createPaymentOrder({ appointment_id: appt.id, amount: 50000, hospital_id });
// → renders <PaymentCheckout orderId={order.orderId} onSuccess={finalizeAppointment} />
// onSuccess → setPaymentSuccess(true) — appointment is now confirmed + paid in DB
```

---

## 🧬 Medical History Contract (with Person B)

When Person B delivers `GET /patients/{id}/history`, call it in `PatientHistory.tsx`.  
**Expected shape** (agreed with B):

```typescript
// GET /patients/{patientId}/history
type VisitRecord = {
  date: string;           // "2026-07-29"
  diagnosis: string;
  prescription: string;
  doctor_name: string;
  hospital_name: string;
  notes: string;
}

// Usage:
const history = await fetch(`/patients/${patientId}/history`, {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());
```

---

## 🔔 WebSocket — Targeted Notifications (already updated)

`connection_manager.py` now supports targeted sends. To receive a notification **only for the logged-in patient**, connect with an identity query param:

```python
# backend/routes/realtime.py — update the WebSocket endpoint to accept identity:
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, identity: str | None = None):
    await manager.connect(websocket, identity=identity)
    ...

# To send to a specific patient (call this after appointment confirmed):
await manager.send_to(patient_id, {
    "event": "appointment_confirmed",
    "hospital_name": "Apollo Hospital"
})
```

Frontend connection with identity (add to `frontend/src/websocket/socket.js`):
```typescript
const patientId = localStorage.getItem("medichain_token_subject"); // or get from auth context
const ws = new WebSocket(`${WS_BASE}/realtime/ws?identity=${patientId}`);
```

---

## 🔐 Authentication Pattern

Same rule as B — always use `Header(default=None)`:

```python
from fastapi import APIRouter, Header
from routes.auth import current_patient

@router.post("/patients/{patient_id}/reminders")
def add_reminder(patient_id: str, payload: ReminderCreate, authorization: str | None = Header(default=None)):
    patient = current_patient(authorization)
    if str(patient["_id"]) != patient_id:
        raise HTTPException(403, "Access denied.")
    ...
```

> [!IMPORTANT]
> **Never use `Depends(current_patient)` — always use `Header(default=None)` and call directly.** Using `Depends()` causes 422 validation errors.

---

## 🗺 Leaflet Map Setup

```bash
# Install in frontend/
npm install leaflet react-leaflet
npm install --save-dev @types/leaflet
```

Add to your `MapView.tsx`:
```tsx
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
```

> [!NOTE]
> **No API key needed.** OpenStreetMap tiles are free. `DirectionsButton.tsx` just needs a plain URL:
> ```tsx
> <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`} target="_blank" rel="noreferrer">
>   Get Directions 🗺️
> </a>
> ```

---

## 🤝 Coordination Points

| What | With whom | When |
|---|---|---|
| Confirm `PatientHistory.tsx` renders B's real endpoint | Person B | Day 5-6 |
| Confirm notification bell fires on booking confirmation | Person A's payment | Day 6 |
| `App.tsx` `/` route change | Flag in PR | Before pushing |
| Full E2E: Landing → Login → Map → Book → Pay → Notification → Review | All | Day 6 |

---

## 📦 Environment Variables

No new environment variables needed for your track.

---

## 🚦 Merge Order (Day 7)

**You merge LAST** — after B and A. Pull B's branch and A's branch first, resolve any conflicts, then merge yours.

The merge order is: **B → A → C**
