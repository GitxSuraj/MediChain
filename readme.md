# MediChain 🏥⛓️
### Blockchain-Backed Inter-Hospital Emergency, Bed Tracking, & Inventory Network

MediChain is a real-time decentralized healthcare ecosystem designed to eliminate critical bottlenecks in emergency patient transfers, live hospital bed tracking, and inter-hospital data interoperability. By decoupling core features across a unified development contract, this platform provides an instant-update dashboard for patients and an autonomous emergency dispatch center for hospital administrators.

---

# Hospital Network App — 7-Day Build Plan (3-Person Team)

Keeping **every feature** from the spec, but flagging where a simplified/fake version is fine so you don't burn days on things the demo doesn't need to be "real."

Ownership model: **Person A = Bed System (full stack)**, **Person B = Transfer System (full stack)**, **Person C = Patient-Facing Features (full stack)**. Each person can demo their own feature independently — this de-risks integration since you're rarely editing the same files.

---

## Day 0 (Half day, before the clock really starts) — Shared Contract

All three of you, together, in one sitting. Do NOT skip this — it's what lets you work in parallel without blocking each other.

1. **Finalize MongoDB collections** (see schema below)
2. **Finalize WebSocket event names + payload shapes** (see events below)
3. **Finalize REST endpoint list** (paths, methods, request/response JSON)
4. Set up one shared GitHub repo, agree on folder structure (`/backend`, `/frontend`)
5. Everyone installs: Python 3.11+, FastAPI, `pymongo`, Node.js, React (via Vite)

### MongoDB Collections (draft — adjust as needed)
```
hospitals: { _id, name, city, facilities: [str], beds: { general: {total, available}, icu: {...}, oxygen: {...}, emergency: {...} } }
patients: { _id, name, mock_abha_id, blood_type, allergies: [str], history: [str] }
appointments: { _id, patient_name, symptoms, preferred_datetime, hospital_id, status: "pending"|"confirmed"|"completed" }
transfers: { _id, patient_id, from_hospital_id, to_hospital_id, required_facility, status: "pending"|"accepted"|"declined", created_at }
users: { _id, role: "patient"|"admin", hospital_id (if admin), display_name }
```

### WebSocket Events
```
bed_update       { hospital_id, category, new_available_count }
transfer_request { transfer_id, from_hospital, to_hospital, patient_summary, required_facility }
transfer_response{ transfer_id, status: "accepted"|"declined" }
```

### REST Endpoints (starter list)
```
GET  /hospitals                      -> list all, with bed counts + facilities
GET  /hospitals?facility=&city=      -> filtered search
POST /beds/{hospital_id}/{category}  -> {delta: +1 or -1}, triggers bed_update broadcast
POST /appointments                   -> create booking
GET  /appointments/{patient_id}      -> booking history
POST /transfers                      -> create transfer, triggers transfer_request broadcast
POST /transfers/{id}/respond         -> {status}, triggers transfer_response broadcast
GET  /patients/{id}                  -> patient record (for record viewer)
POST /auth/mock-login                -> {role, hospital_id or patient_id}
```

Once this is agreed and written down somewhere all three can see (a shared doc, or just a `CONTRACT.md` in the repo), split off.

---

## Person A — Bed System (Full Stack) + Backend Foundation

You own project setup since your feature is simplest technically, freeing you to also lay the groundwork everyone else builds on.

**Day 1**
- FastAPI project skeleton, MongoDB connection (use `pymongo`, synchronous — don't fight async driver issues this week)
- Seed the `hospitals` collection with 4–5 fake hospitals, varied facilities/cities/bed counts
- Build `GET /hospitals` and `GET /hospitals?facility=&city=`
- Basic WebSocket connection manager (a class that tracks connected clients and can broadcast to all) — this is shared infra, so build it clean; B will plug into it too

**Day 2**
- `POST /beds/{hospital_id}/{category}` — increments/decrements, updates Mongo, broadcasts `bed_update`
- Mock auth endpoint (`POST /auth/mock-login` — dropdown just returns a role + id, no real session/token needed)
- Test broadcast with a throwaway HTML page + raw WebSocket JS (`new WebSocket(...)`) before any React exists

**Day 3**
- React: Admin Bed Controller UI — buttons per category, calls your POST endpoint
- React: Patient-side Global Hospital Dashboard — grid/list of hospitals, subscribes to `bed_update` via WebSocket, updates live without refresh
- This is your "wow moment" — get it rock solid before moving on

**Day 4**
- Advanced Search & Filter UI (facility checkboxes, city dropdown) wired to your filtered GET endpoint
- Polish hospital cards (name, city, facility tags, live bed counts per category)
- Buffer time to help B or C if their WebSocket integration has issues (you built the manager, you'll debug it fastest)

**Day 5**
- Help wire the Secure Patient Record Viewer's data fetch (GET /patients/{id}) since it depends on your Mongo setup
- Start integration: does bed update really propagate to multiple open browser tabs? Test with 2–3 tabs open simultaneously
- Fix bugs surfaced during integration

**Day 6**
- Full integration day (see below) — support both B and C
- Add loading states / empty states so nothing looks broken if data is slow

**Day 7**
- Demo rehearsal, bug triage, cut anything flaky

---

## Person B — Transfer System (Full Stack)

The technically hardest flow (multi-step: request → notify → accept/decline → unlock records), so plan for this taking longer than it looks.

**Day 1**
- Design `transfers` collection interactions on paper: what happens at each state transition
- Seed 2–3 admin "hospitals" you'll test transfers between
- Start `POST /transfers` (create transfer doc, status "pending")

**Day 2**
- Wire `POST /transfers` to broadcast `transfer_request` via A's WebSocket manager
- Build `POST /transfers/{id}/respond` — updates status, broadcasts `transfer_response`
- Test purely via API calls (Postman/curl) + a raw WebSocket listener page — don't wait for UI to validate backend logic

**Day 3**
- React: Emergency Transfer Trigger UI (admin selects patient, types/selects required facility, hits send)
- React: Incoming Transfer notification center — listens for `transfer_request`, shows a live list with Accept/Decline buttons

**Day 4**
- Wire Accept/Decline buttons to `POST /transfers/{id}/respond`
- On Accept: fetch and display the Secure Patient Record Viewer (allergies, history, blood type) — pull from `patients` collection (coordinate with A on schema/endpoint)
- Handle the "other side" update: when B's hospital accepts, the *requesting* hospital's admin screen should also update (via `transfer_response` broadcast) to show accepted/declined status

**Day 5**
- Edge cases: what if two hospitals respond to the same request? What if declined — does requester see it clearly and can re-send to a different hospital?
- Polish notification UI — this is your second "wow moment" (Admin 2 gets instant alert), make sure it's visually obvious, not just a console log

**Day 6**
- Full integration day — test the complete flow with A and C: two browser windows open as two different admins, trigger a transfer live
- Fix any race conditions (e.g., what if bed count and transfer both update in the same second)

**Day 7**
- Demo rehearsal — this flow has the most steps, so rehearse it slowly at least 3–4 times so nothing fumbles live

---

## Person C — Patient-Facing Features (Full Stack)

Most CRUD-heavy, least real-time-dependent — good fit if this teammate is less comfortable with WebSockets, since most of this can be built and tested against mock data early.

**Day 1**
- React project setup (if not shared with A), routing (patient view vs admin view, chosen via mock login dropdown)
- Mock login dropdown UI: "Log in as Patient A", "Log in as Admin Hospital 1", "Log in as Admin Hospital 2" — calls A's `/auth/mock-login`, stores role in React state/context (no real session needed)

**Day 2**
- Basic Patient Profile page: static layout first (Name, Mock ABHA/ID fields), against fake JSON
- Appointment booking form: Patient Name, Symptoms, Preferred Date/Time — build the form and local validation first, backend wiring next

**Day 3**
- Wire booking form to `POST /appointments`
- Build appointment status tracking view (Pending/Confirmed/Completed) — pulling from `GET /appointments/{patient_id}`
- Since "Confirmed"/"Completed" transitions aren't specified as admin-triggered anywhere in the spec, **fake it**: a simple admin dropdown or even a manual DB edit is fine — don't build a whole appointment-management UI unless time allows

**Day 4**
- Patient medical history & prescriptions view — pull from `patients` collection, display as a simple list/timeline
- Hospital Facilities Directory view — this can reuse A's hospital list data, just displayed differently (a directory/detail page per hospital instead of the dashboard grid)

**Day 5**
- Polish patient profile + history views
- Cross-check: does the patient dashboard (built by A) and your profile/booking pages share a consistent nav/layout? Align styling
- Buffer day — this track has the least tech risk, so use slack time to help A or B with UI polish on their screens

**Day 6**
- Full integration day — walk through the entire patient journey: log in as Patient A → view dashboard → filter hospitals → book appointment → check status → view profile/history
- Fix any broken links between pages

**Day 7**
- Demo rehearsal, polish, help with final bug fixes anywhere

---

## Feature-by-Feature: Full vs. Simplified/Fake Version

Since you want everything present but are okay with simpler versions, here's the cut line for each:

| Feature | Full version | Acceptable simplified/fake version |
|---|---|---|
| Auth | Real sessions/JWT | Dropdown sets a variable in React state — **use this** |
| EHR records | FHIR/HL7 structured | Flat JSON fields (allergies, history, blood type) — **use this** |
| Geolocation | GPS/maps API | Text dropdown for city — **use this** |
| Appointment status changes | Admin workflow to confirm/complete | Manually set in DB, or a simple button with no real logic behind it |
| Facilities directory | Rich per-hospital detail page | Reuse the hospital dashboard data, just re-displayed |
| Patient history | Populated from real visit records | Hardcoded/seeded fake history entries per patient |
| Transfer patient selection | Search real patient DB | Dropdown of the 3–4 seeded fake patients |
| Payments | N/A | Excluded entirely, as scoped |

None of these cuts remove a feature from the demo — they just remove backend complexity that a judge won't be able to tell is faked in a 5-minute walkthrough.

---

## Day 6 Integration Checklist (all three together)

Run through both wow flows end-to-end, multiple times, with fresh eyes:
1. Open patient dashboard in one browser + admin dashboard in another → decrement ICU beds on admin → confirm patient screen updates without refresh
2. Open Admin 1 and Admin 2 in separate browsers → Admin 1 triggers transfer → Admin 2 sees live notification → Admin 2 accepts → Admin 2's screen shows patient record
3. Full patient journey: login → search/filter → book appointment → check status → view profile
4. Reload every page once — make sure nothing crashes on refresh (a very common last-minute demo killer)

## Day 7 — Demo Day
- No new features. Bug fixes and rehearsal only.
- Assign one person as "narrator" for the demo, one as "operator" clicking through, so it doesn't look chaotic
- Have a backup plan if WiFi/WebSocket connection is flaky at the venue (e.g., a recorded backup video of the flow working)

  "_id": "ObjectId", 
  "role": "patient", 
  "hospital_id": null, 
  "display_name": "John Doe" 
}
