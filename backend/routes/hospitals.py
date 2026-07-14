from typing import Annotated

from fastapi import APIRouter, HTTPException, Query
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

from database.hospitals import list_hospitals
from database.mongodb import MONGODB_UNAVAILABLE_MESSAGE
from models.hospital import HospitalResponse


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
