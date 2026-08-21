from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field
from bson import ObjectId
from database.mongodb import get_database
import database.reviews as reviews_db

router = APIRouter(prefix="/hospitals", tags=["reviews"])


class ReviewIn(BaseModel):
    appointment_id: str
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=2000)


def _get_patient_from_token(authorization: str | None):
    db = get_database()
    token = (authorization or "").removeprefix("Bearer ").strip()
    session = db.sessions.find_one({"token": token})
    if not session or not session.get("patient_id"):
        raise HTTPException(401, "Patient sign-in is required.")
    return str(session["patient_id"])


@router.get("/{hospital_id}/reviews")
def get_reviews(hospital_id: str):
    return reviews_db.get_reviews(hospital_id)


@router.post("/{hospital_id}/reviews", status_code=201)
def submit_review(
    hospital_id: str,
    payload: ReviewIn,
    authorization: str | None = Header(default=None),
):
    patient_id = _get_patient_from_token(authorization)
    db = get_database()

    # Verify completed appointment exists
    try:
        apt = db.appointments.find_one({
            "_id": ObjectId(payload.appointment_id),
            "hospitalId": hospital_id,
            "status": "Completed",
        })
    except Exception:
        raise HTTPException(400, "Invalid appointment ID.")

    if not apt:
        raise HTTPException(403, "You can only review hospitals where you have a completed appointment.")

    # Prevent duplicate review for same appointment
    existing = db.reviews.find_one({"appointment_id": payload.appointment_id, "patient_id": patient_id})
    if existing:
        raise HTTPException(409, "You have already submitted a review for this appointment.")

    return reviews_db.create_review(
        hospital_id=hospital_id,
        patient_id=patient_id,
        appointment_id=payload.appointment_id,
        rating=payload.rating,
        comment=payload.comment,
    )
