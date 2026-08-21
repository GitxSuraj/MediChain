from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from bson import ObjectId
from database.mongodb import get_database
import database.reminders as reminders_db

router = APIRouter(prefix="/patients", tags=["reminders"])


class ReminderIn(BaseModel):
    medicine_name: str
    dosage: str
    times: list[str]
    days: list[str]
    is_active: bool = True


def _get_patient_from_token(authorization: str | None):
    db = get_database()
    token = (authorization or "").removeprefix("Bearer ").strip()
    session = db.sessions.find_one({"token": token})
    if not session or not session.get("patient_id"):
        raise HTTPException(401, "Patient sign-in is required.")
    return str(session["patient_id"])


@router.get("/{patient_id}/reminders")
def list_reminders(patient_id: str, authorization: str | None = Header(default=None)):
    pid = _get_patient_from_token(authorization)
    if pid != patient_id:
        raise HTTPException(403, "You can only view your own reminders.")
    return reminders_db.get_reminders(patient_id)


@router.post("/{patient_id}/reminders", status_code=201)
def add_reminder(patient_id: str, payload: ReminderIn, authorization: str | None = Header(default=None)):
    pid = _get_patient_from_token(authorization)
    if pid != patient_id:
        raise HTTPException(403, "You can only add reminders for yourself.")
    return reminders_db.create_reminder(patient_id, payload.model_dump())


@router.put("/{patient_id}/reminders/{reminder_id}")
def edit_reminder(
    patient_id: str,
    reminder_id: str,
    payload: ReminderIn,
    authorization: str | None = Header(default=None),
):
    pid = _get_patient_from_token(authorization)
    if pid != patient_id:
        raise HTTPException(403, "You can only edit your own reminders.")
    db = get_database()
    try:
        existing = db.reminders.find_one({"_id": ObjectId(reminder_id), "patient_id": patient_id})
    except Exception:
        raise HTTPException(400, "Invalid reminder ID.")
    if not existing:
        raise HTTPException(404, "Reminder not found.")
    updated = reminders_db.update_reminder(reminder_id, payload.model_dump())
    if not updated:
        raise HTTPException(500, "Failed to update reminder.")
    return updated


@router.delete("/{patient_id}/reminders/{reminder_id}", status_code=204)
def remove_reminder(
    patient_id: str,
    reminder_id: str,
    authorization: str | None = Header(default=None),
):
    pid = _get_patient_from_token(authorization)
    if pid != patient_id:
        raise HTTPException(403, "You can only delete your own reminders.")
    db = get_database()
    try:
        existing = db.reminders.find_one({"_id": ObjectId(reminder_id), "patient_id": patient_id})
    except Exception:
        raise HTTPException(400, "Invalid reminder ID.")
    if not existing:
        raise HTTPException(404, "Reminder not found.")
    reminders_db.delete_reminder(reminder_id)
