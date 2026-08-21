from datetime import datetime, timezone
from bson import ObjectId
from database.mongodb import get_database


def _serialize(doc):
    return {
        "id": str(doc["_id"]),
        "hospital_id": doc["hospital_id"],
        "patient_id": doc["patient_id"],
        "appointment_id": doc.get("appointment_id", ""),
        "rating": doc["rating"],
        "comment": doc.get("comment", ""),
        "created_at": doc.get("created_at", "").isoformat() if isinstance(doc.get("created_at"), datetime) else doc.get("created_at", ""),
    }


def get_reviews(hospital_id: str):
    db = get_database()
    docs = list(db.reviews.find({"hospital_id": hospital_id}))
    reviews = [_serialize(d) for d in docs]
    avg = round(sum(r["rating"] for r in reviews) / len(reviews), 1) if reviews else 0.0
    return {"reviews": reviews, "average_rating": avg, "total": len(reviews)}


def create_review(hospital_id: str, patient_id: str, appointment_id: str, rating: int, comment: str):
    db = get_database()
    doc = {
        "hospital_id": hospital_id,
        "patient_id": patient_id,
        "appointment_id": appointment_id,
        "rating": rating,
        "comment": comment,
        "created_at": datetime.now(timezone.utc),
    }
    result = db.reviews.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)
