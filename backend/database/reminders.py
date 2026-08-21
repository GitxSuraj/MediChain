from datetime import datetime, timezone
from bson import ObjectId
from database.mongodb import get_database


def _serialize(doc):
    return {
        "id": str(doc["_id"]),
        "patient_id": doc["patient_id"],
        "medicine_name": doc["medicine_name"],
        "dosage": doc["dosage"],
        "times": doc["times"],
        "days": doc["days"],
        "is_active": doc.get("is_active", True),
        "created_at": doc.get("created_at", "").isoformat() if isinstance(doc.get("created_at"), datetime) else doc.get("created_at", ""),
    }


def get_reminders(patient_id: str):
    db = get_database()
    docs = list(db.reminders.find({"patient_id": patient_id}))
    return [_serialize(d) for d in docs]


def create_reminder(patient_id: str, data: dict):
    db = get_database()
    data["patient_id"] = patient_id
    data["created_at"] = datetime.now(timezone.utc)
    result = db.reminders.insert_one(data)
    data["_id"] = result.inserted_id
    return _serialize(data)


def update_reminder(reminder_id: str, data: dict):
    db = get_database()
    db.reminders.update_one({"_id": ObjectId(reminder_id)}, {"$set": data})
    doc = db.reminders.find_one({"_id": ObjectId(reminder_id)})
    return _serialize(doc) if doc else None


def delete_reminder(reminder_id: str):
    db = get_database()
    db.reminders.delete_one({"_id": ObjectId(reminder_id)})
