from fastapi import APIRouter, Header, HTTPException, Query
from typing import Optional
from routes.auth import current_patient
from database.mongodb import get_database
from models.vital import VitalCreate, VitalUpdate, vital_document
import database.vitals as vitals_db
from bson import ObjectId

router = APIRouter(prefix="/patients", tags=["vitals"])

def _authenticate(patient_id: str, authorization: str | None) -> dict:
    """Authenticate as patient or staff. Returns the patient dict."""
    token = (authorization or "").removeprefix("Bearer ").strip()
    db = get_database()
    session = db.sessions.find_one({"token": token}) if token else None
    if not session:
        raise HTTPException(401, "Sign-in is required.")
    
    # Patient access
    if session.get("patient_id"):
        if str(session["patient_id"]) != patient_id:
            raise HTTPException(403, "You can only access your own vitals.")
        return {"role": "patient", "patient_id": patient_id}
    
    # Staff access (read-only)
    if session.get("role") == "hospital_staff":
        staff = db.hospital_staff.find_one({"_id": session["staff_id"]})
        if not staff:
            raise HTTPException(401, "Staff account not found.")
        if staff.get("role") != "super_admin" and "view_patients" not in staff.get("permissions", []):
            raise HTTPException(403, "Patient-record permission required.")
        return {"role": "staff", "patient_id": patient_id, "staff": staff}
    
    # Hospital session access
    if session.get("role") == "hospital":
        return {"role": "hospital", "patient_id": patient_id}
    
    raise HTTPException(403, "Access denied.")

def _validate_vital_payload(payload: VitalCreate):
    v_type = payload.type
    val = payload.value
    if v_type == "blood_pressure":
        if "systolic" not in val or "diastolic" not in val:
            raise HTTPException(400, "Blood pressure requires 'systolic' and 'diastolic' in value.")
    elif v_type == "blood_sugar":
        if "level" not in val:
            raise HTTPException(400, "Blood sugar requires 'level' in value.")
    elif v_type in ["heart_rate", "temperature", "weight", "spo2"]:
        if "value" not in val:
            raise HTTPException(400, f"{v_type.replace('_', ' ').capitalize()} requires 'value' in value.")

@router.post("/{patient_id}/vitals")
def add_vital(patient_id: str, payload: VitalCreate, authorization: str = Header(default=None)):
    auth = _authenticate(patient_id, authorization)
    if auth["role"] != "patient":
        raise HTTPException(403, "Only patients can add their own vitals.")
    _validate_vital_payload(payload)
    doc = vital_document(payload, patient_id)
    return vitals_db.add_vital(doc)

@router.get("/{patient_id}/vitals")
def get_vitals(patient_id: str, type: Optional[str] = Query(None), skip: int = Query(0), limit: int = Query(50), authorization: str = Header(default=None)):
    _authenticate(patient_id, authorization)
    return vitals_db.get_vitals(patient_id, type, skip, limit)

@router.get("/{patient_id}/vitals/latest")
def get_latest_vitals(patient_id: str, authorization: str = Header(default=None)):
    _authenticate(patient_id, authorization)
    return vitals_db.get_latest_vitals(patient_id)

@router.put("/{patient_id}/vitals/{vital_id}")
def update_vital(patient_id: str, vital_id: str, payload: VitalUpdate, authorization: str = Header(default=None)):
    auth = _authenticate(patient_id, authorization)
    if auth["role"] != "patient":
        raise HTTPException(403, "Only patients can update their own vitals.")
    
    updates = payload.model_dump(exclude_unset=True)
    updated = vitals_db.update_vital(patient_id, vital_id, updates)
    if not updated:
        raise HTTPException(404, "Vital not found.")
    return updated

@router.delete("/{patient_id}/vitals/{vital_id}")
def delete_vital(patient_id: str, vital_id: str, authorization: str = Header(default=None)):
    auth = _authenticate(patient_id, authorization)
    if auth["role"] != "patient":
        raise HTTPException(403, "Only patients can delete their own vitals.")
    
    success = vitals_db.delete_vital(patient_id, vital_id)
    if not success:
        raise HTTPException(404, "Vital not found.")
    return {"message": "Vital deleted successfully."}
