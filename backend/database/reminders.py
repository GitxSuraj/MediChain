from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from database.mongodb import get_database

REMINDERS_COLLECTION = "reminders"


class InvalidReminderIdError(ValueError):
    """Raised when a reminder id is not a valid MongoDB ObjectId."""


class ReminderNotFoundError(LookupError):
    """Raised when a reminder document does not exist for the given patient."""


# SECURITY NOTE: same dependency documented in database/reviews.py — there is
# no backend authentication system in this codebase yet (login is fully
# mocked on the frontend), so `patient_id` here is trusted from the URL path
# rather than derived from a verified session. Once real backend auth
# exists, every route in routes/reminders.py should authenticate the caller
# and reject requests where the authenticated identity does not match
# `patient_id`, rather than trusting the path parameter.
def get_reminders_collection():
    return get_database()[REMINDERS_COLLECTION]


def serialize_reminder(reminder: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(reminder["_id"]),
        "patient_id": reminder["patient_id"],
        "medicine_name": reminder["medicine_name"],
        "dosage": reminder["dosage"],
        "times": reminder.get("times", []),
        "days": reminder.get("days", []),
        "is_active": reminder.get("is_active", True),
        "created_at": reminder["created_at"],
    }


def parse_reminder_id(reminder_id: str) -> ObjectId:
    try:
        return ObjectId(reminder_id)
    except InvalidId as exc:
        raise InvalidReminderIdError("Invalid reminder id. Expected a MongoDB ObjectId.") from exc


def create_reminder(patient_id: str, data: dict) -> dict[str, Any]:
    collection = get_reminders_collection()
    document = {
        **data,
        "patient_id": patient_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = collection.insert_one(document)
    document["_id"] = result.inserted_id
    return serialize_reminder(document)


def list_reminders(patient_id: str) -> list[dict[str, Any]]:
    collection = get_reminders_collection()
    reminders = collection.find({"patient_id": patient_id}).sort("created_at", -1)
    return [serialize_reminder(r) for r in reminders]


def update_reminder(patient_id: str, reminder_id: str, updates: dict) -> dict[str, Any]:
    object_id = parse_reminder_id(reminder_id)
    collection = get_reminders_collection()

    existing = collection.find_one({"_id": object_id, "patient_id": patient_id})
    if not existing:
        raise ReminderNotFoundError("Reminder not found for this patient.")

    clean_updates = {k: v for k, v in updates.items() if v is not None}
    if clean_updates:
        collection.update_one({"_id": object_id}, {"$set": clean_updates})
        existing.update(clean_updates)

    return serialize_reminder(existing)


def delete_reminder(patient_id: str, reminder_id: str) -> None:
    object_id = parse_reminder_id(reminder_id)
    collection = get_reminders_collection()
    result = collection.delete_one({"_id": object_id, "patient_id": patient_id})
    if result.deleted_count == 0:
        raise ReminderNotFoundError("Reminder not found for this patient.")
