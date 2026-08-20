import secrets
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from typing import Literal
from bson import ObjectId
from database.mongodb import get_database
from database.hospitals import serialize_hospital
from routes.hospital_auth import get_current_staff
from routes.auth import _hash


router = APIRouter(prefix="/manage/facilities", tags=["clinic_management"])


class FacilityCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    city: str = Field(min_length=1, max_length=100)
    type: Literal["hospital", "clinic"] = "hospital"
    facilities: list[str] = []
    beds: dict | None = None


ZERO_BEDS = {
    "general": {"total": 0, "available": 0},
    "icu": {"total": 0, "available": 0},
    "oxygen": {"total": 0, "available": 0},
    "emergency": {"total": 0, "available": 0},
}

DEFAULT_BEDS = {
    "general": {"total": 50, "available": 50},
    "icu": {"total": 10, "available": 10},
    "oxygen": {"total": 20, "available": 20},
    "emergency": {"total": 10, "available": 10},
}


@router.post("")
def create_facility(payload: FacilityCreate, authorization: str | None = Header(default=None)):
    staff = get_current_staff(authorization)
    if staff.get("role") != "super_admin":
        raise HTTPException(403, "Only super admins can create facilities.")

    db = get_database()

    # Check for duplicate
    if db.hospitals.find_one({"name": payload.name, "city": payload.city}):
        raise HTTPException(409, "A facility with this name and city already exists.")

    facility_data = {
        "name": payload.name,
        "city": payload.city,
        "type": payload.type,
        "facilities": payload.facilities,
    }

    if payload.type == "clinic":
        facility_data["beds"] = ZERO_BEDS
    else:
        facility_data["beds"] = payload.beds or DEFAULT_BEDS

    result = db.hospitals.insert_one(facility_data)
    hospital_id = str(result.inserted_id)

    # Auto-create hospital login credentials (same pattern as seed_hospitals.py)
    salt = secrets.token_hex(16)
    db.hospital_users.update_one(
        {"hospital_id": hospital_id},
        {"$setOnInsert": {
            "hospital_id": hospital_id,
            "hospital_object_id": result.inserted_id,
            "password_salt": salt,
            "password_hash": _hash("Hospital@123", salt),
        }},
        upsert=True,
    )

    facility_data["id"] = hospital_id
    return facility_data


@router.get("")
def list_facilities(authorization: str | None = Header(default=None)):
    staff = get_current_staff(authorization)
    if not staff:
        raise HTTPException(401, "Staff sign-in is required.")

    db = get_database()
    return [serialize_hospital(doc) for doc in db.hospitals.find().sort("name", 1)]


@router.put("/{hospital_id}")
def update_facility(hospital_id: str, updates: dict, authorization: str | None = Header(default=None)):
    staff = get_current_staff(authorization)
    if staff.get("role") != "super_admin":
        raise HTTPException(403, "Only super admins can update facilities.")

    db = get_database()

    # Don't allow changing immutable fields
    for key in ("_id", "id"):
        updates.pop(key, None)

    # If changing to clinic type, zero out beds
    if updates.get("type") == "clinic":
        updates["beds"] = ZERO_BEDS

    try:
        result = db.hospitals.find_one_and_update(
            {"_id": ObjectId(hospital_id)},
            {"$set": updates},
            return_document=True,
        )
    except Exception as exc:
        raise HTTPException(400, "Invalid hospital ID.") from exc

    if not result:
        raise HTTPException(404, "Facility not found.")

    return serialize_hospital(result)
