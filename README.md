# MediChain 🏥⛓️
### Blockchain-Backed Inter-Hospital Emergency, Bed Tracking, & Inventory Network

MediChain is a real-time decentralized healthcare ecosystem designed to eliminate critical bottlenecks in emergency patient transfers, live hospital bed tracking, and inter-hospital data interoperability. By decoupling core features across a unified development contract, this platform provides an instant-update dashboard for patients and an autonomous emergency dispatch center for hospital administrators.

---

## 🏗️ System Architecture & Data Contract (Day 0)

To facilitate parallel development without file conflicts, all modules adhere strictly to the following MongoDB collections, WebSocket events, and REST endpoints.

### 🗃️ MongoDB Schema (pymongo Synchronous)
```json
// hospitals collection
{ 
  "_id": "ObjectId", 
  "name": "City Hospital", 
  "city": "Navi Mumbai", 
  "facilities": ["ICU", "Oxygen", "Trauma Center"], 
  "beds": { 
    "general": {"total": 50, "available": 12}, 
    "icu": {"total": 10, "available": 2}, 
    "oxygen": {"total": 20, "available": 5}, 
    "emergency": {"total": 15, "available": 3} 
  } 
}

// patients collection
{ 
  "_id": "ObjectId", 
  "name": "John Doe", 
  "mock_abha_id": "ABHA-1234-5678", 
  "blood_type": "O+", 
  "allergies": ["Penicillin"], 
  "history": ["Hypertension (2024)", "Appendectomy (2025)"] 
}

// appointments collection
{ 
  "_id": "ObjectId", 
  "patient_name": "John Doe", 
  "symptoms": "Persistent chest pain", 
  "preferred_datetime": "2026-07-12T10:30:00Z", 
  "hospital_id": "hosp_123", 
  "status": "pending" 
}

// transfers collection
{ 
  "_id": "ObjectId", 
  "patient_id": "pat_456", 
  "from_hospital_id": "hosp_123", 
  "to_hospital_id": "hosp_789", 
  "required_facility": "ICU", 
  "status": "pending", 
  "created_at": "2026-07-10T12:00:00Z" 
}

// users collection
{ 
  "_id": "ObjectId", 
  "role": "patient", 
  "hospital_id": null, 
  "display_name": "John Doe" 
}