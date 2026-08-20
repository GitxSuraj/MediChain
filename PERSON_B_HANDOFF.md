# 🟢 Person B — Hospital Operations — Handoff Guide

> Read this before writing a single line of code. Everything Person A has already built that you depend on is documented here.

---

## ✅ What Person A Has Already Built (Don't Rebuild)

| Feature | File(s) | Status |
|---|---|---|
| Hospital staff auth (login, signup, JWT) | `backend/routes/hospital_auth.py` | ✅ Done |
| Staff model (role, permissions) | `backend/models/hospital_user.py`, `backend/database/hospital_users.py` | ✅ Done |
| Permission gate component | `frontend/src/components/PermissionGate.jsx` | ✅ Done |
| Super Admin Dashboard (staff + payments) | `frontend/src/pages/SuperAdminDashboard.jsx` | ✅ Done |
| Payment create-order + verify | `backend/routes/payments.py` | ✅ Done |
| Targeted WebSocket send | `backend/realtime/connection_manager.py` | ✅ Done |

---

## 🗺 Your Files — Full Ownership List

### Backend (create these)
| File | Purpose |
|---|---|
| `backend/models/medicine.py` | Medicine model |
| `backend/database/medicines.py` | DB helpers |
| `backend/routes/inventory.py` | CRUD + dispense endpoint |
| `backend/models/bill.py` | Bill + BillItem models |
| `backend/database/billing.py` | DB helpers |
| `backend/routes/billing.py` | Billing CRUD |
| `backend/routes/medical_records.py` | `GET/POST /patients/{id}/history` |

### Frontend (create these)
| File | Purpose |
|---|---|
| `frontend/src/pages/InventoryManagement.jsx` | Medicine table + add/edit/delete |
| `frontend/src/pages/Billing.jsx` | Bill generator + print |
| `frontend/src/components/AddVisitRecord.jsx` | Visit log form |

### Modify these (you own clinic rendering)
| File | What to add |
|---|---|
| `frontend/src/pages/AdminDashboard.jsx` | Read `hospital.type`, hide `BedController`/`TransferPanel` for clinics; add sidebar links to Inventory + Billing |
| `backend/models/hospital.py` | Add `type: str = "hospital"` field |
| `backend/scripts/seed_hospitals.py` | Add `"type": "hospital"` to all seeds; add 2 clinic seeds |

---

## 🔌 How to Register Your Backend Routes

Open `backend/main.py` and add these **after** the existing `include_router` calls:

```python
from routes.inventory       import router as inventory_router
from routes.billing         import router as billing_router
from routes.medical_records import router as medical_records_router

app.include_router(inventory_router)
app.include_router(billing_router)
app.include_router(medical_records_router)
```

---

## 🏗 Database Collections You Own

| Collection | Used by |
|---|---|
| `medicines` | `/hospitals/{id}/inventory` endpoints |
| `bills` | `/billing/` endpoints |
| `dispensed_medicines` | Log of each dispense action (referenced by billing) |

> [!NOTE]
> All other collections (`hospitals`, `patients`, `appointments`, `sessions`, `payments`, `hospital_staff`) are owned by Person A. **Do not drop or restructure them.**

---

## 📋 Medical History Contract (agreed with Person C)

Person C's `PatientHistory.tsx` will call `GET /patients/{id}/history`.  
**Your endpoint must return this exact shape** — no extra nesting, no renamed keys:

```json
[
  {
    "date": "2026-07-29",
    "diagnosis": "Viral fever",
    "prescription": "Paracetamol 500mg twice daily for 5 days",
    "doctor_name": "Dr. Sharma",
    "hospital_name": "Apollo Hospital",
    "notes": "Follow up in 1 week"
  }
]
```

Store records in a `medical_history` collection:
```python
db.medical_history.insert_one({
    "patient_id": patient_id,         # string ObjectId
    "date": payload.date,
    "diagnosis": payload.diagnosis,
    "prescription": payload.prescription,
    "doctor_name": payload.doctor_name,
    "hospital_name": payload.hospital_name,
    "notes": payload.notes,
    "created_at": datetime.now(timezone.utc)
})
```

---

## 🔐 Authentication Pattern (copy this exactly)

All your protected endpoints should follow this pattern (same as `appointments.py`):

```python
from fastapi import APIRouter, Header, HTTPException
from routes.hospital_auth import get_current_staff

@router.post("/hospitals/{hospital_id}/inventory")
def add_medicine(hospital_id: str, payload: MedicineCreate, authorization: str | None = Header(default=None)):
    staff = get_current_staff(authorization)
    # staff["hospital_id"] is available
    # staff["permissions"] is a list of strings
    if "manage_inventory" not in staff.get("permissions", []):
        raise HTTPException(403, "manage_inventory permission required.")
    ...
```

> [!IMPORTANT]
> **Never use `Depends(get_current_staff)` — always use `Header(default=None)` and call the function directly.** Using `Depends()` with functions that take a plain string causes 422 validation errors (this was a bug in A's original payment code that has now been fixed).

---

## 🤝 Coordination Points

| What | With whom | When |
|---|---|---|
| Confirm `GET /patients/{id}/history` shape | Person C | Before Day 5 |
| Add inventory + billing links to AdminDashboard sidebar | You | Day 5 |
| Low-stock alert banner | You | Day 6 |
| Test dispensing flow with Person C's booking flow | Both | Day 6 |

---

## 📦 Environment Variables

No new environment variables needed for your track.

---

## 🚦 Merge Order (Day 7)

**You merge FIRST.** Person A merges second, Person C merges last.  
After your merge is complete, message the team so they can pull before merging.
