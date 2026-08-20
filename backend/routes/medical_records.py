from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field
from bson import ObjectId
from database.mongodb import get_database
from routes.hospital_auth import get_current_staff
from routes.auth import current_patient

router = APIRouter(prefix="/patients", tags=["medical-records"])
HISTORY_COLLECTION = "medical_history"
LEGACY_HISTORY_COLLECTION = "medical_records"
class VisitRecord(BaseModel):
    appointment_id: str
    date: date
    diagnosis: str = Field(min_length=1, max_length=1000)
    prescription: str = Field(default="", max_length=4000)
    doctor_name: str = Field(min_length=1, max_length=200)
    hospital_name: str = Field(min_length=1, max_length=200)
    notes: str = Field(default="", max_length=4000)
def serialize(doc):
    """Return the agreed patient-history contract without internal ownership fields."""
    return {
        "date": doc["date"].isoformat() if isinstance(doc["date"], date) else doc["date"],
        "diagnosis": doc["diagnosis"],
        "prescription": doc.get("prescription", ""),
        "doctor_name": doc["doctor_name"],
        "hospital_name": doc["hospital_name"],
        "notes": doc.get("notes", ""),
    }
@router.post("/{patient_id}/history", status_code=201)
def add_history(patient_id: str, payload: VisitRecord, staff=Depends(get_current_staff)):
    db = get_database()
    try: patient = db.patients.find_one({"_id": ObjectId(patient_id)})
    except Exception as exc: raise HTTPException(400, "Invalid patient ID.") from exc
    if not patient: raise HTTPException(404, "Patient not found.")
    hospital = db.hospitals.find_one({"_id": ObjectId(staff["hospital_id"])})
    if not hospital: raise HTTPException(404, "Hospital not found.")
    try: appointment_id = ObjectId(payload.appointment_id)
    except Exception as exc: raise HTTPException(400, "Invalid appointment ID.") from exc
    appointment = db.appointments.find_one({"_id": appointment_id, "patient_id": patient["_id"], "hospitalId": staff["hospital_id"], "status": "Completed"})
    if not appointment: raise HTTPException(409, "Visit records require a completed appointment at your hospital.")
    if db[HISTORY_COLLECTION].find_one({"appointment_id": payload.appointment_id}) or db[LEGACY_HISTORY_COLLECTION].find_one({"appointment_id": payload.appointment_id}): raise HTTPException(409, "A visit record already exists for this appointment.")
    record = payload.model_dump()
    # BSON supports datetimes but not plain ``date`` objects.
    record["date"] = record["date"].isoformat()
    record.update({"patient_id": patient_id, "hospital_id": staff["hospital_id"], "hospital_name": hospital["name"], "doctor_name": appointment.get("doctorName", payload.doctor_name), "created_at": datetime.now(timezone.utc)})
    result = db[HISTORY_COLLECTION].insert_one(record); record["_id"] = result.inserted_id; return serialize(record)
@router.get("/{patient_id}/history")
def get_history(patient_id: str, authorization: str | None = Header(default=None)):
    db = get_database(); token = (authorization or "").removeprefix("Bearer ").strip(); session = db.sessions.find_one({"token": token})
    if not session: raise HTTPException(401, "Sign-in is required.")
    if session.get("patient_id") and str(session["patient_id"]) != patient_id: raise HTTPException(403, "You can only access your own history.")
    if session.get("role") == "hospital_staff":
        # Staff access is scoped to records created by their hospital.
        staff = db.hospital_staff.find_one({"_id": session["staff_id"]}); query = {"patient_id": patient_id, "hospital_id": staff["hospital_id"]}
    else: query = {"patient_id": patient_id}
    records = list(db[HISTORY_COLLECTION].find(query)) + list(db[LEGACY_HISTORY_COLLECTION].find(query))
    return [serialize(x) for x in sorted(records, key=lambda record: record["date"], reverse=True)]
