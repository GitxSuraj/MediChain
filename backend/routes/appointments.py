from datetime import datetime, timezone
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from bson import ObjectId

from routes.auth import current_patient, current_hospital_user
from database.mongodb import get_database

router = APIRouter(prefix="/appointments", tags=["appointments"])

class AppointmentRequest(BaseModel):
    hospitalId: str
    hospitalName: str
    doctorId: str
    doctorName: str
    doctorSpecialty: str
    symptoms: str = Field(min_length=3, max_length=2000)
    date: str
    time: str

def serialize(item: dict) -> dict:
    item["id"] = str(item.pop("_id"))
    item.pop("patient_id", None)
    return item

@router.get("")
def list_appointments(authorization: str | None = Header(default=None)):
    patient = current_patient(authorization)
    return [serialize(a) for a in get_database().appointments.find({"patient_id": patient["_id"]}).sort("createdAt", -1)]

@router.post("")
def create_appointment(payload: AppointmentRequest, authorization: str | None = Header(default=None)):
    patient = current_patient(authorization)
    doc = payload.model_dump()
    doc.update({"patient_id": patient["_id"], "status": "Pending", "mode": "In-Person",
                "avatarInitials": "".join(p[0] for p in payload.doctorName.split()[:2]).upper(), "createdAt": datetime.now(timezone.utc)})
    result = get_database().appointments.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize(doc)

@router.patch("/{appointment_id}/cancel")
def cancel_appointment(appointment_id: str, authorization: str | None = Header(default=None)):
    patient = current_patient(authorization)
    try:
        oid = ObjectId(appointment_id)
    except Exception as exc:
        raise HTTPException(400, "Invalid appointment id.") from exc
    appointment = get_database().appointments.find_one({"_id": oid, "patient_id": patient["_id"]})
    if not appointment:
        raise HTTPException(404, "Appointment not found.")
    if appointment["status"] in ("Completed", "Cancelled"):
        raise HTTPException(409, "This appointment can no longer be cancelled.")
    get_database().appointments.update_one({"_id": oid}, {"$set": {"status": "Cancelled"}})
    appointment["status"] = "Cancelled"
    return serialize(appointment)


class AppointmentDecision(BaseModel):
    status: str

@router.get("/hospital/requests")
def hospital_requests(authorization: str | None = Header(default=None)):
    session = current_hospital_user(authorization)
    records = get_database().appointments.find({"hospitalId": session["hospital_id"]}).sort("createdAt", -1)
    return [serialize(record) for record in records]

@router.patch("/hospital/{appointment_id}/decision")
def decide_appointment(appointment_id: str, payload: AppointmentDecision, authorization: str | None = Header(default=None)):
    if payload.status not in ("Confirmed", "Cancelled"):
        raise HTTPException(400, "Status must be Confirmed or Cancelled.")
    session = current_hospital_user(authorization)
    try:
        oid = ObjectId(appointment_id)
    except Exception as exc:
        raise HTTPException(400, "Invalid appointment id.") from exc
    appointment = get_database().appointments.find_one({"_id": oid, "hospitalId": session["hospital_id"]})
    if not appointment:
        raise HTTPException(404, "Appointment request not found for this hospital.")
    if appointment["status"] != "Pending":
        raise HTTPException(409, "This appointment has already been processed.")
    get_database().appointments.update_one({"_id": oid}, {"$set": {"status": payload.status}})
    appointment["status"] = payload.status
    return serialize(appointment)
