from typing import Annotated

from fastapi import APIRouter, HTTPException, Query
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

from database.hospitals import (
    BedAvailabilityError,
    HospitalNotFoundError,
    InvalidBedCategoryError,
    InvalidHospitalIdError,
    list_hospitals,
    update_bed_availability,
)
from database.mongodb import MONGODB_UNAVAILABLE_MESSAGE
from models.hospital import BedUpdateRequest, BedUpdateResponse, HospitalResponse


router = APIRouter()


@router.get("/hospitals", response_model=list[HospitalResponse])
def get_hospitals(
    facility: Annotated[str | None, Query(min_length=1)] = None,
    city: Annotated[str | None, Query(min_length=1)] = None,
):
    try:
        return list_hospitals(facility=facility, city=city)
    except ServerSelectionTimeoutError as exc:
        raise HTTPException(
            status_code=503,
            detail=MONGODB_UNAVAILABLE_MESSAGE,
        ) from exc
    except PyMongoError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"MongoDB query failed: {exc}",
        ) from exc


@router.post("/beds/{hospital_id}/{category}", response_model=BedUpdateResponse)
def update_hospital_beds(
    hospital_id: str,
    category: str,
    payload: BedUpdateRequest,
):
    try:
        hospital = update_bed_availability(
            hospital_id=hospital_id,
            category=category,
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
        raise HTTPException(
            status_code=503,
            detail=MONGODB_UNAVAILABLE_MESSAGE,
        ) from exc
    except PyMongoError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"MongoDB update failed: {exc}",
        ) from exc

    return {"hospital": hospital}
