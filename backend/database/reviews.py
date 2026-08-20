from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from database.mongodb import get_database

REVIEWS_COLLECTION = "reviews"

# NOTE (Person C -> Person A/B coordination):
# There is no appointment-booking backend in this codebase yet (appointments
# currently live only as mocked data in frontend/src/services/appointment.ts).
# The security rule in the roadmap ("a patient may only review a hospital if
# they have a completed appointment there") is enforced here against an
# `appointments` collection with the minimal contract:
#   { _id, patient_id, hospital_id, status: "completed" }
# Until Person A/B ship a real appointment-booking backend that writes to
# this collection, review submission will correctly 403 for every patient,
# because no completed appointment can exist. This is the integration
# boundary, not a bug — see final report "remaining blockers".


class InvalidReviewIdError(ValueError):
    """Raised when a review id is not a valid MongoDB ObjectId."""


class NoCompletedAppointmentError(PermissionError):
    """Raised when the patient has no completed appointment at this hospital."""


class DuplicateReviewError(ValueError):
    """Raised when the patient already reviewed this appointment."""


def get_reviews_collection():
    return get_database()[REVIEWS_COLLECTION]


def get_appointments_collection():
    return get_database()["appointments"]


def serialize_review(review: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(review["_id"]),
        "hospital_id": review["hospital_id"],
        "patient_id": review["patient_id"],
        "appointment_id": review["appointment_id"],
        "rating": review["rating"],
        "comment": review.get("comment", ""),
        "created_at": review["created_at"],
    }


def parse_review_id(review_id: str) -> ObjectId:
    try:
        return ObjectId(review_id)
    except InvalidId as exc:
        raise InvalidReviewIdError("Invalid review id. Expected a MongoDB ObjectId.") from exc


def has_completed_appointment(patient_id: str, hospital_id: str, appointment_id: str) -> bool:
    appointments = get_appointments_collection()
    query: dict[str, Any] = {
        "patient_id": patient_id,
        "hospital_id": hospital_id,
        "status": "completed",
    }
    try:
        query["_id"] = ObjectId(appointment_id)
    except InvalidId:
        query["appointment_id"] = appointment_id

    return appointments.find_one(query) is not None


# SECURITY NOTE (Person C -> whole-team dependency, roadmap section 17):
# The roadmap requires deriving the reviewing patient's identity from an
# authenticated session (JWT) rather than trusting `patient_id` in the
# request body. That is not possible to do honestly right now: there is no
# backend authentication system anywhere in this codebase. Login
# (frontend/src/services/auth.ts) is entirely mocked in the frontend — it
# returns a fake `mock-jwt-<timestamp>` token with no server-side session,
# no verification endpoint, and no way for this backend to authenticate a
# request. Implementing real auth here would mean inventing a new
# authentication architecture, which the roadmap explicitly forbids
# ("do not rewrite the authentication system").
#
# `create_review` therefore still accepts `patient_id` from the request body
# as an interim measure, same as before. This is a known, documented gap —
# not a Person C bug — and must be replaced with `derive patient from
# JWT`/session as soon as a real backend auth system exists. See the final
# implementation report for full details.
def create_review(hospital_id: str, data: dict) -> dict[str, Any]:
    if not has_completed_appointment(data["patient_id"], hospital_id, data["appointment_id"]):
        raise NoCompletedAppointmentError(
            "A completed appointment at this hospital is required before submitting a review."
        )

    reviews = get_reviews_collection()
    if reviews.find_one(
        {
            "patient_id": data["patient_id"],
            "hospital_id": hospital_id,
            "appointment_id": data["appointment_id"],
        }
    ):
        raise DuplicateReviewError("This appointment has already been reviewed.")

    document = {
        **data,
        "hospital_id": hospital_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = reviews.insert_one(document)
    document["_id"] = result.inserted_id
    return serialize_review(document)


def list_reviews_for_hospital(hospital_id: str) -> dict[str, Any]:
    reviews = get_reviews_collection()
    docs = list(reviews.find({"hospital_id": hospital_id}).sort("created_at", -1))
    serialized = [serialize_review(r) for r in docs]

    review_count = len(serialized)
    average_rating = round(sum(r["rating"] for r in serialized) / review_count, 1) if review_count else 0.0

    return {
        "hospital_id": hospital_id,
        "average_rating": average_rating,
        "review_count": review_count,
        "reviews": serialized,
    }


def get_rating_summaries(hospital_ids: list[str]) -> dict[str, dict[str, Any]]:
    """Bulk average-rating/review-count lookup, used by the hospital directory."""
    reviews = get_reviews_collection()
    pipeline = [
        {"$match": {"hospital_id": {"$in": hospital_ids}}},
        {
            "$group": {
                "_id": "$hospital_id",
                "average_rating": {"$avg": "$rating"},
                "review_count": {"$sum": 1},
            }
        },
    ]
    results = {row["_id"]: row for row in reviews.aggregate(pipeline)}
    return {
        hid: {
            "average_rating": round(results[hid]["average_rating"], 1) if hid in results else 0.0,
            "review_count": results[hid]["review_count"] if hid in results else 0,
        }
        for hid in hospital_ids
    }
