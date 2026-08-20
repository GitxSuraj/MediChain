from datetime import date, datetime, timezone
from typing import Optional
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


class PatientUploadRecord(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    type: str = Field(default="Prescription")  # "Prescription", "Lab Report", "Consultation", "Procedure"
    date: Optional[str] = None
    doctor_name: str = Field(default="Self-Uploaded / External", max_length=200)
    hospital_name: str = Field(default="Diagnostic Center / Clinic", max_length=200)
    diagnosis: str = Field(default="", max_length=1000)
    prescription: str = Field(default="", max_length=4000)
    notes: str = Field(default="", max_length=4000)
    file_data: Optional[str] = None  # Base64 string for file attachment
    file_name: Optional[str] = None


def serialize(doc):
    """Return serialized medical history record matching the agreed contract."""
    d = doc.get("date", "")
    date_str = d.isoformat() if isinstance(d, (date, datetime)) else str(d) if d else datetime.now(timezone.utc).date().isoformat()
    
    res = {
        "date": date_str,
        "diagnosis": doc.get("diagnosis", ""),
        "prescription": doc.get("prescription", ""),
        "doctor_name": doc.get("doctor_name", "Doctor"),
        "hospital_name": doc.get("hospital_name", "Hospital"),
        "notes": doc.get("notes", ""),
    }
    if "title" in doc:
        res["title"] = doc["title"]
    if "type" in doc:
        res["type"] = doc["type"]
    if "file_data" in doc:
        res["file_data"] = doc["file_data"]
    if "file_name" in doc:
        res["file_name"] = doc["file_name"]
    return res


@router.post("/{patient_id}/history", status_code=201)
def add_history(patient_id: str, payload: VisitRecord, staff=Depends(get_current_staff)):
    if staff.get("role") != "super_admin" and "view_patients" not in staff.get("permissions", []):
        raise HTTPException(403, "Patient-record permission is required.")
    db = get_database()
    try:
        patient = db.patients.find_one({"_id": ObjectId(patient_id)})
    except Exception as exc:
        raise HTTPException(400, "Invalid patient ID.") from exc
    if not patient:
        raise HTTPException(404, "Patient not found.")
    hospital = db.hospitals.find_one({"_id": ObjectId(staff["hospital_id"])})
    if not hospital:
        raise HTTPException(404, "Hospital not found.")
    try:
        appointment_id = ObjectId(payload.appointment_id)
    except Exception as exc:
        raise HTTPException(400, "Invalid appointment ID.") from exc
    appointment = db.appointments.find_one({
        "_id": appointment_id,
        "patient_id": patient["_id"],
        "hospitalId": staff["hospital_id"],
        "status": "Completed"
    })
    if not appointment:
        raise HTTPException(409, "Visit records require a completed appointment at your hospital.")
    if db[HISTORY_COLLECTION].find_one({"appointment_id": payload.appointment_id}) or db[LEGACY_HISTORY_COLLECTION].find_one({"appointment_id": payload.appointment_id}):
        raise HTTPException(409, "A visit record already exists for this appointment.")
    record = payload.model_dump()
    record["date"] = record["date"].isoformat()
    record.update({
        "patient_id": patient_id,
        "hospital_id": staff["hospital_id"],
        "hospital_name": hospital["name"],
        "doctor_name": appointment.get("doctorName", payload.doctor_name),
        "title": payload.diagnosis,
        "type": "Prescription" if payload.prescription else "Consultation",
        "created_at": datetime.now(timezone.utc)
    })
    result = db[HISTORY_COLLECTION].insert_one(record)
    record["_id"] = result.inserted_id
    return serialize(record)


@router.post("/{patient_id}/documents", status_code=201)
def upload_document(patient_id: str, payload: PatientUploadRecord, authorization: str | None = Header(default=None)):
    """Allow patient to upload their own prescriptions, test reports, and lab documents."""
    patient = current_patient(authorization)
    if str(patient["_id"]) != patient_id:
        raise HTTPException(403, "You can only upload documents to your own profile.")

    db = get_database()
    record_date = payload.date or datetime.now(timezone.utc).date().isoformat()

    doc = {
        "patient_id": patient_id,
        "title": payload.title,
        "type": payload.type,
        "date": record_date,
        "doctor_name": payload.doctor_name,
        "hospital_name": payload.hospital_name,
        "diagnosis": payload.diagnosis or payload.title,
        "prescription": payload.prescription,
        "notes": payload.notes,
        "file_data": payload.file_data,
        "file_name": payload.file_name,
        "uploaded_by_patient": True,
        "created_at": datetime.now(timezone.utc)
    }

    result = db[HISTORY_COLLECTION].insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize(doc)


@router.get("/{patient_id}/history")
def get_history(patient_id: str, authorization: str | None = Header(default=None)):
    db = get_database()
    token = (authorization or "").removeprefix("Bearer ").strip()
    session = db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(401, "Sign-in is required.")
    if session.get("patient_id") and str(session["patient_id"]) != patient_id:
        raise HTTPException(403, "You can only access your own history.")
    if session.get("role") == "hospital_staff":
        staff = db.hospital_staff.find_one({"_id": session.get("staff_id")})
        if not staff:
            raise HTTPException(401, "Staff account was not found.")
        query = {"patient_id": patient_id}
    elif session.get("role") == "hospital":
        query = {"patient_id": patient_id}
    elif session.get("patient_id"):
        query = {"patient_id": patient_id}
    else:
        raise HTTPException(403, "You cannot access this history.")
    records = list(db[HISTORY_COLLECTION].find(query)) + list(db[LEGACY_HISTORY_COLLECTION].find(query))
    return [serialize(x) for x in sorted(records, key=lambda record: record.get("date", ""), reverse=True)]
