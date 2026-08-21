from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Header
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

from database.hospitals import (
    BedAvailabilityError,
    BED_CATEGORIES,
    HospitalNotFoundError,
    InvalidBedCategoryError,
    InvalidHospitalIdError,
    list_hospitals,
    update_bed_availability,
)
from database.mongodb import MONGODB_UNAVAILABLE_MESSAGE, get_database
from models.hospital import BedUpdateEvent, BedUpdateRequest, BedUpdateResponse, HospitalResponse
from realtime.connection_manager import manager
from routes.auth import current_hospital_user


router = APIRouter()


@router.get("/hospitals", response_model=list[HospitalResponse])
def get_hospitals(
    facility: Annotated[str | None, Query(min_length=1)] = None,
    city: Annotated[str | None, Query(min_length=1)] = None,
):
    try:
        return list_hospitals(facility=facility, city=city)
    except ServerSelectionTimeoutError as exc:
        raise HTTPException(status_code=503, detail=MONGODB_UNAVAILABLE_MESSAGE) from exc
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail=MONGODB_UNAVAILABLE_MESSAGE) from exc


@router.get("/hospitals/ratings")
def get_hospital_ratings(hospital_ids: str | None = None):
    """Return average ratings and review counts for a list of hospital IDs.

    Query param: hospital_ids — comma-separated list of hospital IDs.
    Returns: { hospital_id: { average_rating, review_count }, ... }
    """
    db = get_database()
    result: dict = {}
    if not hospital_ids:
        return result

    ids = [hid.strip() for hid in hospital_ids.split(",") if hid.strip()]
    for hid in ids:
        docs = list(db.reviews.find({"hospital_id": hid}))
        if docs:
            avg = round(sum(d.get("rating", 0) for d in docs) / len(docs), 1)
            result[hid] = {"average_rating": avg, "review_count": len(docs)}
        else:
            result[hid] = {"average_rating": 0, "review_count": 0}
    return result


@router.post("/beds/{hospital_id}/{category}", response_model=BedUpdateResponse)
async def update_hospital_beds(
    hospital_id: str,
    category: str,
    payload: BedUpdateRequest,
    authorization: str | None = Header(default=None),
):
    session = current_hospital_user(authorization)
    if session["hospital_id"] != hospital_id:
        raise HTTPException(status_code=403, detail="You can only manage your own hospital beds.")
    normalized_category = category.strip().lower()

    try:
        hospital = update_bed_availability(
            hospital_id=hospital_id,
            category=normalized_category,
            delta=payload.delta,
        )
    except InvalidHospitalIdError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except InvalidBedCategoryError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except BedAvailabilityError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except HospitalNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ServerSelectionTimeoutError as exc:
        raise HTTPException(status_code=503, detail=MONGODB_UNAVAILABLE_MESSAGE) from exc
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail=MONGODB_UNAVAILABLE_MESSAGE) from exc

    if normalized_category in BED_CATEGORIES:
        event = BedUpdateEvent(
            hospital_id=hospital["id"],
            category=normalized_category,
            new_available_count=hospital["beds"][normalized_category]["available"],
        )
        await manager.broadcast(event.model_dump())

    return {"hospital": hospital}
