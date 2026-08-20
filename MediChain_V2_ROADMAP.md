# 🏥 MediChain v2 — Complete Master Roadmap

> **Team Size**: 3 Developers | **Timeline**: 6 Working Days + Integration  
> **Structure**: 3 Independent Tracks — each person owns separate files; shared touches are flagged explicitly as **Coordination Points**

---

## 🧱 Tech Stack Additions

| Feature | New Tech | Notes |
|---|---|---|
| Cover / Landing Page | React (existing) | New public route only, zero new dependencies |
| Super Admin + Roles | FastAPI + MongoDB (existing) | New `hospital_staff` account model, mirrors patient auth pattern |
| Payment Gateway | **Razorpay** (test mode) | Free sandbox, UPI/card support, simple `checkout.js` widget. Stripe is the global alternative |
| Medicine Inventory + Billing | FastAPI + MongoDB (existing) | New collections + CRUD only |
| Clinic Entity Type | FastAPI + MongoDB (existing) | A `type` field on existing hospital model — clinics get appointments + records only (no beds, no transfers) |
| Real Patient Medical History | FastAPI + MongoDB (existing) | Replaces hardcoded demo data in `services/patient.ts` with real per-patient records |
| Hospital Reviews + Facility Info | FastAPI + MongoDB (existing) | New `reviews` collection; search cards show live bed/ventilator counts + aggregate rating |
| Maps / Nearest Hospital | **Leaflet + OpenStreetMap** | 100% free, no API key, no billing account needed. "Get Directions" links to `maps.google.com/dir/?destination=lat,lng` |
| Notifications | Existing WebSocket system | Extend `connection_manager.py` to target one specific patient OR one hospital — not just broadcast-to-all |
| Medicine Reminders | Browser Notification API + FastAPI | In-app reminders (works while site is open). Background push via Service Worker is a stretch goal |

---

## 👥 Track Ownership at a Glance

| Track | Owner | Features |
|---|---|---|
| 🔵 **Track 1 — Access & Commerce** | **Person A** | Super Admin + Role Permissions + Payment Gateway |
| 🟢 **Track 2 — Hospital Operations** | **Person B** | Inventory + Billing + Clinic Type + Real Medical History |
| 🟠 **Track 3 — Patient Experience** | **Person C** | Cover Page + Maps + Notifications + Reminders + Reviews |

**Estimated load:** Person A ≈ 33% | Person B ≈ 35% | Person C ≈ 32%

---

## 📊 Full File Ownership Map

| File | Owner | Status |
|---|---|---|
| `backend/models/hospital_user.py` | A | NEW |
| `backend/database/hospital_users.py` | A | NEW |
| `backend/routes/hospital_auth.py` | A | NEW |
| `backend/models/payment.py` | A | NEW |
| `backend/database/payments.py` | A | NEW |
| `backend/routes/payments.py` | A | NEW |
| `frontend/src/pages/SuperAdminDashboard.jsx` | A | NEW |
| `frontend/src/components/PermissionGate.jsx` | A | NEW |
| `frontend/src/components/PaymentCheckout.tsx` | A | NEW |
| `frontend/src/services/payment.ts` | A | NEW |
| `backend/models/hospital.py` | **B** (Day 1 push) | MODIFY |
| `backend/scripts/seed_hospitals.py` | **B** (Day 1 push) | MODIFY |
| `backend/models/medicine.py` | B | NEW |
| `backend/database/medicines.py` | B | NEW |
| `backend/routes/inventory.py` | B | NEW |
| `backend/models/bill.py` | B | NEW |
| `backend/database/billing.py` | B | NEW |
| `backend/routes/billing.py` | B | NEW |
| `backend/routes/medical_records.py` | B | NEW |
| `frontend/src/pages/InventoryManagement.jsx` | B | NEW |
| `frontend/src/pages/Billing.jsx` | B | NEW |
| `frontend/src/components/AddVisitRecord.jsx` | B | NEW |
| `frontend/src/pages/HospitalDashboard.jsx` | B (add clinic rendering) | MODIFY |
| `backend/realtime/connection_manager.py` | **C** (Day 1 push) | MODIFY |
| `backend/models/reminder.py` | C | NEW |
| `backend/database/reminders.py` | C | NEW |
| `backend/routes/reminders.py` | C | NEW |
| `backend/models/review.py` | C | NEW |
| `backend/database/reviews.py` | C | NEW |
| `backend/routes/reviews.py` | C | NEW |
| `frontend/src/pages/LandingPage.tsx` | C | NEW |
| `frontend/src/components/MapView.tsx` | C | NEW |
| `frontend/src/components/DirectionsButton.tsx` | C | NEW |
| `frontend/src/pages/MedicineReminders.tsx` | C | NEW |
| `frontend/src/hooks/useNotifications.ts` | C | NEW |
| `frontend/src/components/NotificationBell.tsx` | C | NEW |
| `frontend/src/components/HospitalReviewForm.tsx` | C | NEW |
| `frontend/src/services/reminders.ts` | C | NEW |
| `frontend/src/App.tsx` | C (route change, flag in PR) | MODIFY |
| `frontend/src/components/Navbar.tsx` | C (add bell) | MODIFY |
| `frontend/src/pages/HospitalDirectory.tsx` | C (add ratings + beds) | MODIFY |
| `frontend/src/pages/BookAppointment.tsx` | A + C (Day 6, joint) | MODIFY |
| `frontend/src/pages/PatientHistory.tsx` | B + C (Day 5/6, joint) | MODIFY |
| `frontend/src/components/TransferPanel.jsx` | A (wrap PermissionGate) | MODIFY |
| `frontend/src/components/BedController.jsx` | A (wrap PermissionGate) | MODIFY |

---

## 🔗 Shared Contracts — Agree Day 1, Build Independently After

> [!IMPORTANT]
> Write both contracts in a shared note/group chat on Day 1. Once written, everyone builds their own side independently without waiting for the other.

### Contract 1: Payment Handoff (A ↔ C)
```typescript
// In BookAppointment.tsx (Person C's file):
const { orderId } = await createPaymentOrder(appointmentDraft); // calls Person A's service
return <PaymentCheckout orderId={orderId} onSuccess={finalizeAppointment} />; // Person A's component
// onSuccess → marks appointment as confirmed + paid via API
```

### Contract 2: Medical History Shape (B ↔ C)
```typescript
// In PatientHistory.tsx (Person C's file):
const history = await getPatientHistory(patientId); // calls GET /patients/{id}/history
// Person B's endpoint returns:
[{ date: string, diagnosis: string, prescription: string, doctor_name: string, hospital_name: string, notes: string }]
```

---

## 📅 6-Day Team Calendar

| Day | 🔵 Person A | 🟢 Person B | 🟠 Person C |
|---|---|---|---|
| **Day 1** | Sign up Razorpay, confirm test keys, agree payment contract with C | **Push `hospital.type` field FIRST** → notify team | **Push WebSocket targeting SECOND** → confirm broadcasts → notify team |
| **Day 2** | Staff account model + DB + auth routes | Medicine model + DB + inventory routes + `InventoryManagement.jsx` | `LandingPage.tsx` + update `App.tsx` route |
| **Day 3** | Permissions endpoint + `SuperAdminDashboard.jsx` | Dispense action + billing model/routes | Notification helper `fireAlert()` + `NotificationBell.tsx` |
| **Day 4** | `PermissionGate.jsx` + wrap sensitive UI + E2E test | `Billing.jsx` + medical records endpoint | Reminder model/routes + `MedicineReminders.tsx` |
| **Day 5** | Payment backend (`create-order`, `verify`) + `PaymentCheckout.tsx` | `AddVisitRecord.jsx` + clinic conditional rendering in `HospitalDashboard.jsx` | Review model/routes + `HospitalReviewForm.tsx` + update `HospitalDirectory.tsx` |
| **Day 6** | Wire `BookAppointment` → payment → confirm + final full test | Full clinic flow test + low-stock alerts + print CSS polish | Leaflet `MapView.tsx` + wire both contracts (payment + history) + final E2E test |
| **Day 7** 🔴 | **INTEGRATION DAY — Merge B first → A second → C last. Test after each merge. Full walkthrough.** | | |

---
---

# 🔵 PERSON A — Access & Commerce
> **Owns:** Super Admin + Role Permissions + Payment Gateway

---

## Day 1 — Setup & Shared Groundwork

### ☑ Tasks
- [ ] Sign up at [razorpay.com](https://razorpay.com) → go to **Test Mode** → copy `Key ID` and `Key Secret`
- [ ] Confirm keys work with one raw API call:
  ```bash
  curl -u rzp_test_KEY:SECRET https://api.razorpay.com/v1/orders -X POST \
    -H "Content-Type: application/json" \
    -d '{"amount":50000,"currency":"INR","receipt":"rcpt_001"}'
  ```
- [ ] Add to `backend/.env`:
  ```env
  RAZORPAY_KEY_ID=rzp_test_xxxx
  RAZORPAY_KEY_SECRET=xxxx
  ```
- [ ] Update `backend/.env.example` with key names (no real values)
- [ ] **Agree with Person C** on the payment handoff contract (see Contract 1 above)
- [ ] Write the contract in the shared team note

### 📁 Files
- `backend/.env.example` ← update

### ✅ End of Day Goal
Razorpay test keys confirmed working. Payment contract agreed and written down.

---

## Day 2 — Staff Account Model + Auth Routes

### ☑ Tasks
- [ ] Create `backend/models/hospital_user.py`:
  ```python
  class HospitalUser(BaseModel):
      _id: Optional[str]
      hospital_id: str
      name: str
      email: str
      password_hash: str
      role: str           # "super_admin" | "doctor" | "nurse" | "receptionist"
      permissions: list[str]  # ["manage_beds", "manage_transfers", "view_patients", ...]
      created_at: datetime
  ```
- [ ] Create `backend/database/hospital_users.py`:
  - `create_hospital_user(user_data)` — hash password with `bcrypt`, same pattern as patient auth
  - `get_hospital_user_by_email(email)`
  - `verify_password(plain, hashed)`
- [ ] Create `backend/routes/hospital_auth.py`:
  - `POST /hospital-auth/signup` — create staff account (super admin only)
  - `POST /hospital-auth/login` — returns JWT token
  - `GET /hospital-auth/me` — returns current staff profile
- [ ] **Test all 3 endpoints in Postman before touching frontend**

### 📁 Files to Create
- `backend/models/hospital_user.py`
- `backend/database/hospital_users.py`
- `backend/routes/hospital_auth.py`

### ✅ End of Day Goal
Can create a hospital staff account and log in via Postman. JWT returned successfully.

---

## Day 3 — Permissions Endpoint + Super Admin Dashboard

### ☑ Tasks
- [ ] Add to `backend/routes/hospital_auth.py`:
  - `POST /hospital-users/{id}/permissions` — super admin updates a staff member's permissions list
  - `GET /hospital-users/` — list all staff for a hospital (super admin only)
- [ ] Protect all admin routes with middleware: `current_user.role == "super_admin"`
- [ ] Create `frontend/src/pages/SuperAdminDashboard.jsx`:
  - Fetch and list all staff at the logged-in hospital
  - For each staff: checkboxes for all permissions:
    - `manage_beds` | `manage_transfers` | `view_patients` | `assign_doctors` | `manage_inventory` | `manage_billing`
  - On toggle → call `POST /hospital-users/{id}/permissions`
  - Show success toast on save

### 📁 Files to Create
- `frontend/src/pages/SuperAdminDashboard.jsx`

### 📁 Files to Modify
- `backend/routes/hospital_auth.py` ← add permissions + list endpoints

### ✅ End of Day Goal
Super admin can log in, see all staff, toggle permissions from UI. Changes persist in MongoDB.

---

## Day 4 — PermissionGate Component + E2E Permission Test

### ☑ Tasks
- [ ] Create `frontend/src/components/PermissionGate.jsx`:
  ```jsx
  // Usage: <PermissionGate requires="manage_transfers">...</PermissionGate>
  const PermissionGate = ({ requires, children }) => {
    const { currentUser } = useAuth();
    if (!currentUser?.permissions?.includes(requires)) return null;
    return children;
  };
  ```
- [ ] Wrap existing sensitive UI with `<PermissionGate>`:
  - `<TransferPanel />` → `requires="manage_transfers"`
  - `<BedController />` → `requires="manage_beds"`
  - Patient data view → `requires="view_patients"`
- [ ] Add "Create Staff Account" form to `SuperAdminDashboard.jsx` (name, email, password, role)
- [ ] **Full E2E permission test:**
  1. Create staff account via SuperAdminDashboard
  2. Uncheck `manage_transfers`
  3. Log in as that staff member
  4. Confirm transfer panel is hidden
  5. Re-enable → confirm it reappears

### 📁 Files to Create
- `frontend/src/components/PermissionGate.jsx`

### 📁 Files to Modify
- `frontend/src/components/TransferPanel.jsx` ← wrap with PermissionGate
- `frontend/src/components/BedController.jsx` ← wrap with PermissionGate
- `frontend/src/pages/SuperAdminDashboard.jsx` ← add create staff form

### ✅ End of Day Goal
PermissionGate working. Creating staff and restricting/granting permissions works end-to-end.

---

## Day 5 — Payment Backend + Checkout Component

### ☑ Tasks
- [ ] Create `backend/models/payment.py`:
  ```python
  class Payment(BaseModel):
      _id: Optional[str]
      appointment_id: str
      patient_id: str
      razorpay_order_id: str
      razorpay_payment_id: Optional[str]
      amount: int       # in paise (₹500 = 50000 paise)
      status: str       # "created" | "paid" | "failed" | "refunded"
      created_at: datetime
  ```
- [ ] Create `backend/routes/payments.py`:
  - `POST /payments/create-order` — calls Razorpay API, stores order in DB, returns `{ orderId, amount, currency }`
  - `POST /payments/verify` — verifies Razorpay HMAC SHA256 signature, marks appointment as paid
  - `GET /patients/{id}/payments` — payment history for a patient
- [ ] Create `frontend/src/components/PaymentCheckout.tsx`:
  - Load Razorpay `checkout.js` script dynamically
  - Open modal with `orderId`, `amount`, hospital name
  - On success → call `POST /payments/verify` → call `onSuccess()` prop
  - On failure → show error toast

> [!IMPORTANT]
> Follow [Razorpay's official docs](https://razorpay.com/docs/payment-gateway/web-integration/standard/) exactly for signature verification — do not implement from memory.

### 📁 Files to Create
- `backend/models/payment.py`
- `backend/database/payments.py`
- `backend/routes/payments.py`
- `frontend/src/components/PaymentCheckout.tsx`
- `frontend/src/services/payment.ts`

### ✅ End of Day Goal
Can create a Razorpay order via API and open the payment modal. Test with Razorpay test card `4111 1111 1111 1111`.

---

## Day 6 — Wire Booking → Payment → Confirm + Final Test

### ☑ Tasks
- [ ] **Coordinate with Person C** — wire payment into `BookAppointment.tsx`:
  - After slot selection → `createPaymentOrder(appointmentDraft)` from `payment.ts`
  - Render `<PaymentCheckout orderId={...} onSuccess={finalizeAppointment} />`
  - `finalizeAppointment` marks appointment as confirmed + paid
- [ ] Add "Payments" tab to `SuperAdminDashboard.jsx` showing payment history for the hospital
- [ ] Handle edge case: payment fails → appointment stays `pending`, user can retry
- [ ] Run final permissions walkthrough with a fresh staff account
- [ ] **Full flow test:** book → pay with test card → appointment shows **Paid & Confirmed** ✅

### 📁 Files to Modify
- `frontend/src/pages/BookAppointment.tsx` ← wire payment handoff (joint with Person C)
- `frontend/src/pages/SuperAdminDashboard.jsx` ← add payments tab

### ✅ End of Day Goal
Full flow works: book → pay → confirmed. Permission gating works for all staff roles. Ready for integration day.

---
---

# 🟢 PERSON B — Hospital Operations
> **Owns:** Medicine Inventory + Billing + Clinic Entity Type + Real Patient Medical History

---

## Day 1 — Clinic Type Field (PUSH FIRST) + Contracts

### ☑ Tasks
- [ ] **Do this BEFORE everything else — the whole team depends on it:**
  - Open `backend/models/hospital.py` → add: `type: str = "hospital"  # "hospital" | "clinic"`
  - Open `backend/scripts/seed_hospitals.py` → add `"type": "hospital"` to all existing entries
  - Add 2 new seed clinic entries with `"type": "clinic"`
  - **Commit and push this alone** with message: `"feat: add type field to hospital model (hospital | clinic)"`
  - **Message the team immediately** so they can pull before writing any code
- [ ] Agree with Person C on the medical history contract (see Contract 2 above)
- [ ] Write both contracts in the shared team note

### 📁 Files to Modify
- `backend/models/hospital.py` ← add `type` field
- `backend/scripts/seed_hospitals.py` ← add `type` to all entries + 2 clinic seeds

### ✅ End of Day Goal
`hospital.type` field pushed and live. Team has been notified. Medical history contract agreed and written.

---

## Day 2 — Medicine Inventory Backend + UI

### ☑ Tasks
- [ ] Create `backend/models/medicine.py`:
  ```python
  class Medicine(BaseModel):
      _id: Optional[str]
      hospital_id: str
      name: str
      generic_name: str
      quantity: int
      unit: str            # "tablets" | "vials" | "strips"
      expiry_date: date
      reorder_threshold: int
      price_per_unit: float
      category: str        # "antibiotic" | "painkiller" | "injection" | ...
  ```
- [ ] Create `backend/database/medicines.py`:
  - `add_medicine(medicine_data)`
  - `get_medicines_by_hospital(hospital_id)`
  - `update_stock(medicine_id, quantity_delta)` — used by dispense action
  - `get_low_stock(hospital_id)` — returns medicines below `reorder_threshold`
- [ ] Create `backend/routes/inventory.py`:
  - `GET /hospitals/{id}/inventory` — list all medicines
  - `POST /hospitals/{id}/inventory` — add medicine
  - `PUT /hospitals/{id}/inventory/{med_id}` — edit medicine
  - `DELETE /hospitals/{id}/inventory/{med_id}` — remove medicine
- [ ] Create `frontend/src/pages/InventoryManagement.jsx`:
  - Table: Name | Generic | Quantity | Expiry | Category | Actions
  - Rows highlighted red if `quantity <= reorder_threshold`
  - "Add Medicine" button → modal form
  - Edit and Delete per row

### 📁 Files to Create
- `backend/models/medicine.py`
- `backend/database/medicines.py`
- `backend/routes/inventory.py`
- `frontend/src/pages/InventoryManagement.jsx`

### ✅ End of Day Goal
Hospital staff can add, view, edit, and delete medicines. Low-stock items highlighted in red.

---

## Day 3 — Dispense Medicine + Billing Backend

### ☑ Tasks
- [ ] Add dispense endpoint to `backend/routes/inventory.py`:
  - `POST /hospitals/{id}/inventory/{med_id}/dispense`
  - Body: `{ patient_id, quantity, appointment_id }`
  - Action: decrement stock → log dispensed record → return updated stock
- [ ] Create `backend/models/bill.py`:
  ```python
  class BillItem(BaseModel):
      description: str    # "Paracetamol 500mg x 10" or "Consultation fee"
      quantity: int
      unit_price: float
      total: float

  class Bill(BaseModel):
      _id: Optional[str]
      hospital_id: str
      patient_id: str
      appointment_id: str
      items: list[BillItem]
      subtotal: float
      tax: float
      total: float
      status: str         # "draft" | "issued" | "paid"
      created_at: datetime
  ```
- [ ] Create `backend/database/billing.py` + `backend/routes/billing.py`:
  - `POST /billing/generate` — auto-creates bill from appointment (pulls dispensed medicines)
  - `GET /billing/{bill_id}` — get single bill
  - `GET /patients/{id}/bills` — all bills for a patient
  - `PUT /billing/{bill_id}/status` — mark as paid/issued

### 📁 Files to Create
- `backend/models/bill.py`
- `backend/database/billing.py`
- `backend/routes/billing.py`

### 📁 Files to Modify
- `backend/routes/inventory.py` ← add dispense endpoint

### ✅ End of Day Goal
Can dispense medicine (stock decrements). Can generate a bill including dispensed medicines + consultation fee.

---

## Day 4 — Billing Frontend + Medical Records Backend

### ☑ Tasks
- [ ] Create `frontend/src/pages/Billing.jsx`:
  - Search patient by name / ID
  - Show all dispensed medicines for the appointment (auto-fetched)
  - Add manual line items (consultation fee, procedure fees)
  - "Generate Bill" → creates bill via API
  - Bill summary with total
  - "Print" button — `window.print()` with clean print stylesheet
- [ ] Create `backend/routes/medical_records.py`:
  - `POST /patients/{id}/history` — staff adds a structured visit record:
    ```json
    {
      "date": "2026-07-29",
      "diagnosis": "Viral fever",
      "prescription": "Paracetamol 500mg twice daily for 5 days",
      "doctor_name": "Dr. Sharma",
      "hospital_name": "Apollo Hospital",
      "notes": "Follow up in 1 week"
    }
    ```
  - `GET /patients/{id}/history` — returns all visit records

### 📁 Files to Create
- `frontend/src/pages/Billing.jsx`
- `backend/routes/medical_records.py`

### ✅ End of Day Goal
Billing UI works. Medical records endpoint live and tested in Postman.

---

## Day 5 — Add Visit Record UI + Clinic Conditional Rendering

### ☑ Tasks
- [ ] Create `frontend/src/components/AddVisitRecord.jsx`:
  - Fields: Date, Diagnosis, Prescription (textarea), Doctor Name, Notes
  - Called from completed appointment → "Add Visit Record" button
  - Submits to `POST /patients/{id}/history`
  - On success → "Record saved" toast
- [ ] Open `frontend/src/pages/HospitalDashboard.jsx` (existing):
  - Read `hospital.type` from context/props
  - If `type === "clinic"`:
    - Hide `<BedController />`
    - Hide `<TransferPanel />`
    - Show only: Appointments, Patient Records, Inventory, Billing
  - Add nav links to `InventoryManagement` and `Billing` pages in sidebar/dashboard
- [ ] **Coordinate with Person C:** confirm `PatientHistory.tsx` renders your real endpoint data correctly

> [!WARNING]
> **Coordination Point:** `HospitalDashboard.jsx` exists from earlier work. You're adding nav links and clinic conditional rendering — flag this in your PR so nobody is surprised.

### 📁 Files to Create
- `frontend/src/components/AddVisitRecord.jsx`

### 📁 Files to Modify
- `frontend/src/pages/HospitalDashboard.jsx` ← clinic conditional rendering + inventory/billing nav links

### ✅ End of Day Goal
Staff can log a visit record from a completed appointment. Clinic login shows no bed/transfer UI.

---

## Day 6 — Full Flow Test + Polish

### ☑ Tasks
- [ ] **Full clinic workflow test:**
  1. Seed a clinic → log in as clinic admin
  2. Confirm no bed controller, no transfer panel
  3. Book an appointment (with Person C's booking flow)
  4. Dispense medicine → verify inventory decrements
  5. Generate bill → verify medicines appear as line items
  6. Add visit record → confirm it appears in `PatientHistory.tsx`
- [ ] Add **low stock alert banner** at top of `InventoryManagement.jsx`: `"⚠️ 3 medicines are low on stock"`
- [ ] Add search or pagination to inventory table
- [ ] Edge case: dispensing more than in stock → show error
- [ ] Add `@media print` CSS to `Billing.jsx` for clean print output

### 📁 Files to Modify
- `frontend/src/pages/InventoryManagement.jsx` ← low stock banner + search
- `frontend/src/pages/Billing.jsx` ← print styles

### ✅ End of Day Goal
Full hospital and clinic flows tested end-to-end. Ready for integration day.

---
---

# 🟠 PERSON C — Patient Experience
> **Owns:** Cover Page + Maps + Notifications + Medicine Reminders + Hospital Reviews

---

## Day 1 — WebSocket Targeting (PUSH SECOND) + Contracts

### ☑ Tasks
- [ ] **First priority — WebSocket tagging** (team depends on this):
  - Open `backend/realtime/connection_manager.py`
  - Refactor from plain list to dict keyed by identity:
    ```python
    # Before: active_connections: list[WebSocket]
    # After:
    active_connections: dict[str, list[WebSocket]]
    # key = patient_id OR hospital_id

    async def connect(websocket: WebSocket, identity: str): ...
    async def send_to(identity: str, message: dict):
        # sends only to connections with that identity key
    async def broadcast(message: dict):
        # sends to all — existing behavior unchanged
    ```
  - **Test existing bed/transfer broadcasts still work** (they use `broadcast()` → unaffected)
  - **Commit and push alone:** `"feat: add targeted WebSocket send by identity"`
  - **Message the team immediately**
- [ ] Agree with Person A on payment handoff contract (see Contract 1 above)
- [ ] Agree with Person B on medical history shape (see Contract 2 above)
- [ ] Write both contracts in the shared team note

### 📁 Files to Modify
- `backend/realtime/connection_manager.py` ← targeted send + identity keying

### ✅ End of Day Goal
WebSocket sends to a specific patient or hospital. Existing broadcasts unbroken. Both contracts agreed and written.

---

## Day 2 — Landing Page + App.tsx Route

### ☑ Tasks
- [ ] Create `frontend/src/pages/LandingPage.tsx` with these sections:
  1. **Hero** — MediChain logo, tagline ("Your health, connected"), animated subtitle
  2. **How It Works** — 3 cards: Search Hospital → Book Appointment → Get Care
  3. **Login Options** — two large buttons side by side:
     - 🧑‍⚕️ "I'm a Patient" → `/login`
     - 🏥 "I'm a Hospital / Clinic" → `/hospital-login`
  4. **Onboarding CTA** — "Want to list your hospital on MediChain?" + contact form (name, hospital name, phone, email) → `POST /leads` or console log
  5. **Footer** — links, copyright
- [ ] Update `frontend/src/App.tsx`:
  - Change `/` route from `<Navigate to="/dashboard" />` to `<LandingPage />`
  - Keep `/dashboard` for logged-in patients
  - **Flag this change in your PR**

### 📁 Files to Create
- `frontend/src/pages/LandingPage.tsx`

### 📁 Files to Modify
- `frontend/src/App.tsx` ← change `/` route (flag in PR)

### ✅ End of Day Goal
Landing page renders at `/`. Has patient login, hospital login, and contact form. Looks professional.

---

## Day 3 — Notification System (Helper + Bell)

### ☑ Tasks
- [ ] Create `frontend/src/hooks/useNotifications.ts`:
  ```typescript
  // One reusable function for all 3 alert types:
  fireAlert(type: "appointment" | "transfer" | "reminder", message: string)
  // → appends to notification list in state
  // → triggers a toast popup
  ```
- [ ] Create `frontend/src/components/NotificationBell.tsx`:
  - Bell icon in Navbar with unread count badge
  - Click → dropdown of last 10 notifications
  - Each item: icon (🏥 appointment / 🔁 transfer / 💊 reminder) + message + "X mins ago"
  - "Mark all as read" button clears badge
  - Subscribe to WebSocket events:
    - `appointment_confirmed` → `fireAlert("appointment", "Your appointment is confirmed!")`
    - `transfer_accepted` → `fireAlert("transfer", "Transfer request accepted")`
    - `transfer_declined` → `fireAlert("transfer", "Transfer request declined")`
- [ ] Add `<NotificationBell />` to `frontend/src/components/Navbar.tsx`

### 📁 Files to Create
- `frontend/src/hooks/useNotifications.ts`
- `frontend/src/components/NotificationBell.tsx`

### 📁 Files to Modify
- `frontend/src/components/Navbar.tsx` ← add NotificationBell

### ✅ End of Day Goal
Notification bell in navbar. Fires for appointment and transfer events. Unread badge works.

---

## Day 4 — Medicine Reminders Backend + UI

### ☑ Tasks
- [ ] Create `backend/models/reminder.py`:
  ```python
  class Reminder(BaseModel):
      _id: Optional[str]
      patient_id: str
      medicine_name: str
      dosage: str          # "500mg"
      times: list[str]     # ["08:00", "14:00", "21:00"] 24h format
      days: list[str]      # ["Mon","Tue","Wed"] or ["daily"]
      is_active: bool
      created_at: datetime
  ```
- [ ] Create `backend/routes/reminders.py`:
  - `POST /patients/{id}/reminders` — add reminder
  - `GET /patients/{id}/reminders` — list all reminders
  - `PUT /patients/{id}/reminders/{rem_id}` — edit
  - `DELETE /patients/{id}/reminders/{rem_id}` — delete
- [ ] Create `frontend/src/pages/MedicineReminders.tsx`:
  - List active reminders with edit/delete
  - "Add Reminder" form: medicine name, dosage, times (multi-time picker), days
  - Client-side `setInterval` every 30 seconds:
    ```typescript
    // Every 30s: check if any reminder time matches current HH:MM
    // If match → fireAlert("reminder", "Time to take: Paracetamol 500mg")
    ```
  - Fires using the same `fireAlert` from Day 3 — no separate logic needed

### 📁 Files to Create
- `backend/models/reminder.py`
- `backend/database/reminders.py`
- `backend/routes/reminders.py`
- `frontend/src/pages/MedicineReminders.tsx`
- `frontend/src/services/reminders.ts`

### ✅ End of Day Goal
Patient can add/edit/delete reminders. Toast fires automatically at scheduled time.

---

## Day 5 — Hospital Reviews + Directory Update

### ☑ Tasks
- [ ] Create `backend/models/review.py`:
  ```python
  class Review(BaseModel):
      _id: Optional[str]
      hospital_id: str
      patient_id: str
      appointment_id: str   # proves patient actually visited
      rating: int           # 1–5
      comment: str
      created_at: datetime
  ```
- [ ] Create `backend/routes/reviews.py`:
  - `POST /hospitals/{id}/reviews`:
    - Check `appointments` collection for a **completed** appointment with this `patient_id` + `hospital_id`
    - No completed appointment → `403 Forbidden`
    - Exists → save review
  - `GET /hospitals/{id}/reviews` → return all reviews + computed average rating
- [ ] Create `frontend/src/components/HospitalReviewForm.tsx`:
  - 5-star rating selector (clickable stars)
  - Comment textarea
  - Submit → `POST /hospitals/{id}/reviews`
  - Only visible when `appointment.status === "completed"`
- [ ] Update `frontend/src/pages/HospitalDirectory.tsx`:
  - Each card now shows: ⭐ avg rating + review count + 🛏 beds / ICU / ventilators
  - (Data already in `getHospitals()` response — just render more of it)
  - Hospital detail view → full review list below facility info

### 📁 Files to Create
- `backend/models/review.py`
- `backend/database/reviews.py`
- `backend/routes/reviews.py`
- `frontend/src/components/HospitalReviewForm.tsx`

### 📁 Files to Modify
- `frontend/src/pages/HospitalDirectory.tsx` ← ratings + bed counts on cards

### ✅ End of Day Goal
Reviews work (gated to completed appointments). Hospital directory shows beds + ratings.

---

## Day 6 — Hospital Map + Wire Both Contracts + Final E2E Test

### ☑ Tasks
- [ ] Install Leaflet: `npm install leaflet react-leaflet`
- [ ] Create `frontend/src/components/MapView.tsx`:
  - `navigator.geolocation.getCurrentPosition()` → user's location
  - Plot each hospital from `getHospitals()` as a Leaflet map pin
  - Sort hospitals by Haversine distance:
    ```typescript
    function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371; // km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    ```
  - Click a pin → side panel: hospital name, specialties, beds, rating
- [ ] Create `frontend/src/components/DirectionsButton.tsx`:
  ```tsx
  <a
    href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
    target="_blank"
    rel="noreferrer"
  >
    Get Directions 🗺️
  </a>
  // No API key needed — just a URL
  ```
- [ ] **Wire Person A's payment handoff** into `BookAppointment.tsx`:
  - After slot confirmed → `createPaymentOrder(appointmentDraft)` → render `<PaymentCheckout .../>`
- [ ] **Wire Person B's medical history** — confirm `PatientHistory.tsx` calls `getPatientHistory()` and renders real data
- [ ] **Full E2E test:** Landing → Login → Find hospital on map → Book → Pay → Notification → Visit → Review → Set reminder

### 📁 Files to Create
- `frontend/src/components/MapView.tsx`
- `frontend/src/components/DirectionsButton.tsx`

### 📁 Files to Modify
- `frontend/src/pages/BookAppointment.tsx` ← wire payment (joint with Person A)
- `frontend/src/pages/PatientHistory.tsx` ← confirm real data renders (joint with Person B)

### ✅ End of Day Goal
Full patient journey works: Landing → Login → Map → Book → Pay → Notification → Review → Reminders. Ready for integration day.

---
---

## 🔐 New Environment Variables

```env
# Person A — Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx

# Person B — no new keys needed
# Person C — no new keys needed (Leaflet and Google Maps directions link need no API key)
```

Update `backend/.env.example` with the key names (no real values) whenever you add a new variable.

---

## ✅ Definition of Done (Every Feature)

- [ ] Backend endpoint tested via FastAPI `/docs` or Postman
- [ ] Frontend renders correctly on mobile + desktop
- [ ] No TypeScript errors
- [ ] Auth / permission guard applied where needed
- [ ] Reviewed by at least one other team member before merge
- [ ] `.env.example` updated with any new key names

---

## 🚨 Critical Shared Rules

| Rule | Why |
|---|---|
| Person B pushes `hospital.type` **first on Day 1** | Person A and C both read from the hospital model |
| Person C pushes WebSocket targeting **second on Day 1** | Person A needs targeted notifications for payment confirmation |
| **Merge order on Day 7: B → A → C** | B has no cross-dependencies; safest merge order |
| Never merge all three branches at once | Integration bugs become impossible to isolate |
| If you touch a file you don't own → message the team first | Prevents silent merge conflicts |
| Contracts (payment handoff, medical history) must be written down on Day 1 | Prevents blocking during Days 5–6 |

---

## 🚦 Risk Flags

> [!WARNING]
> **Razorpay** requires a registered business for live keys. Stay in test mode throughout development. Budget extra time on Day 5 — the signature verification step has more moving parts than it looks.

> [!CAUTION]
> **Never merge all three branches simultaneously.** Merge one at a time, test after each. Day 7 is a full day for this reason — don't schedule new features thinking it'll be quick.

> [!NOTE]
> **Leaflet + OpenStreetMap** has zero billing and zero API key setup. If you want satellite imagery or richer POI data later, swapping to Google Maps is straightforward — but don't start with it, as it requires attaching a billing account even for the free tier.

> [!NOTE]
> **Background push notifications** (reminders when app is closed) require a Service Worker + Push API — meaningfully harder. Scope to in-app reminders first (`setInterval` while the tab is open), and flag background push as a stretch goal.

> [!TIP]
> **If time gets tight, prioritize in this order:** Cover Page (zero backend risk) → Clinic Type (one field) → Real Medical History (pure CRUD) → Billing/Inventory (familiar patterns) → Payment, Maps, Reviews, Reminders (external services — treat as stretch goals if needed).

> [!IMPORTANT]
> **Day 7 integration is non-negotiable.** It is the single highest-value session to not skip. Merge one branch at a time. Run the full end-to-end walkthrough. Fix whatever breaks before calling the project done.
