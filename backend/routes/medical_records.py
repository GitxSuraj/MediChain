from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field
from bson import ObjectId
from database.mongodb import get_database
from routes.hospital_auth import get_current_staff
from routes.auth import current_patient

router = APIRouter(prefix="/patients", tags=["medical-records"])
class VisitRecord(BaseModel):
    date: date
    diagnosis: str = Field(min_length=1, max_length=1000)
    prescription: str = Field(default="", max_length=4000)
    doctor_name: str = Field(min_length=1, max_length=200)
    hospital_name: str = Field(min_length=1, max_length=200)
    notes: str = Field(default="", max_length=4000)
def serialize(doc):
    doc = dict(doc); doc.pop("_id", None); doc["date"] = doc["date"].isoformat(); return doc
@router.post("/{patient_id}/history", status_code=201)
def add_history(patient_id: str, payload: VisitRecord, staff=Depends(get_current_staff)):
    db = get_database()
    try: patient = db.patients.find_one({"_id": ObjectId(patient_id)})
    except Exception as exc: raise HTTPException(400, "Invalid patient ID.") from exc
    if not patient: raise HTTPException(404, "Patient not found.")
    hospital = db.hospitals.find_one({"_id": ObjectId(staff["hospital_id"])})
    if not hospital or payload.hospital_name != hospital["name"]: raise HTTPException(403, "Visit record must name your hospital.")
    record = payload.model_dump(); record.update({"patient_id": patient_id, "hospital_id": staff["hospital_id"], "created_at": datetime.now(timezone.utc)}); result = db.medical_records.insert_one(record); record["_id"] = result.inserted_id; return serialize(record)
@router.get("/{patient_id}/history")
def get_history(patient_id: str, authorization: str | None = Header(default=None)):
    db = get_database(); token = (authorization or "").removeprefix("Bearer ").strip(); session = db.sessions.find_one({"token": token})
    if not session: raise HTTPException(401, "Sign-in is required.")
    if session.get("patient_id") and str(session["patient_id"]) != patient_id: raise HTTPException(403, "You can only access your own history.")
    if session.get("role") == "hospital_staff":
        # Staff access is scoped to records created by their hospital.
        staff = db.hospital_staff.find_one({"_id": session["staff_id"]}); query = {"patient_id": patient_id, "hospital_id": staff["hospital_id"]}
    else: query = {"patient_id": patient_id}
    return [serialize(x) for x in db.medical_records.find(query).sort("date", -1)]
