from fastapi import APIRouter, HTTPException
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

from database.mongodb import MONGODB_UNAVAILABLE_MESSAGE
from database.reviews import (
    DuplicateReviewError,
    NoCompletedAppointmentError,
    create_review,
    get_rating_summaries,
    list_reviews_for_hospital,
)
from models.review import HospitalRatingSummary, ReviewCreate, ReviewResponse

router = APIRouter(tags=["reviews"])


@router.post("/hospitals/{hospital_id}/reviews", response_model=ReviewResponse)
def post_review(hospital_id: str, payload: ReviewCreate):
    try:
        return create_review(hospital_id, payload.model_dump())
    except NoCompletedAppointmentError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except DuplicateReviewError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except ServerSelectionTimeoutError as exc:
        raise HTTPException(status_code=503, detail=MONGODB_UNAVAILABLE_MESSAGE) from exc
    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"MongoDB insert failed: {exc}") from exc


@router.get("/hospitals/{hospital_id}/reviews", response_model=HospitalRatingSummary)
def get_reviews(hospital_id: str):
    try:
        return list_reviews_for_hospital(hospital_id)
    except ServerSelectionTimeoutError as exc:
        raise HTTPException(status_code=503, detail=MONGODB_UNAVAILABLE_MESSAGE) from exc
    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"MongoDB query failed: {exc}") from exc


@router.get("/hospitals/ratings")
def get_bulk_ratings(hospital_ids: str):
    """GET /hospitals/ratings?hospital_ids=id1,id2,id3 -> {id: {average_rating, review_count}}."""
    ids = [h.strip() for h in hospital_ids.split(",") if h.strip()]
    try:
        return get_rating_summaries(ids)
    except ServerSelectionTimeoutError as exc:
        raise HTTPException(status_code=503, detail=MONGODB_UNAVAILABLE_MESSAGE) from exc
    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"MongoDB query failed: {exc}") from exc
