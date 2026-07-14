import re
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from pymongo.collection import Collection
from pymongo.database import Database

from database.mongodb import get_database


HOSPITALS_COLLECTION = "hospitals"
BED_CATEGORIES = {"general", "icu", "oxygen", "emergency"}


class InvalidHospitalIdError(ValueError):
    """Raised when a hospital id is not a valid MongoDB ObjectId."""


class HospitalNotFoundError(LookupError):
    """Raised when a hospital document does not exist."""


class InvalidBedCategoryError(ValueError):
    """Raised when a hospital does not support a requested bed category."""


class BedAvailabilityError(ValueError):
    """Raised when a bed update would move availability outside valid bounds."""


def get_hospitals_collection(database: Database | None = None) -> Collection:
    db = database or get_database()
    return db[HOSPITALS_COLLECTION]


def build_hospital_filter(facility: str | None = None, city: str | None = None) -> dict[str, Any]:
    filters: dict[str, Any] = {}
    facility = facility.strip() if facility else None
    city = city.strip() if city else None

    if facility:
        filters["facilities"] = {"$regex": f"^{re.escape(facility)}$", "$options": "i"}

    if city:
        filters["city"] = {"$regex": f"^{re.escape(city)}$", "$options": "i"}

    return filters


def serialize_hospital(hospital: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(hospital["_id"]),
        "name": hospital["name"],
        "city": hospital["city"],
        "facilities": hospital.get("facilities", []),
        "beds": hospital.get("beds", {}),
    }


def list_hospitals(
    facility: str | None = None,
    city: str | None = None,
    database: Database | None = None,
) -> list[dict[str, Any]]:
    collection = get_hospitals_collection(database)
    query = build_hospital_filter(facility=facility, city=city)
    hospitals = collection.find(query).sort("name", 1)
    return [serialize_hospital(hospital) for hospital in hospitals]


def parse_hospital_id(hospital_id: str) -> ObjectId:
    try:
        return ObjectId(hospital_id)
    except InvalidId as exc:
        raise InvalidHospitalIdError("Invalid hospital_id. Expected a MongoDB ObjectId.") from exc


def update_bed_availability(
    hospital_id: str,
    category: str,
    delta: int,
    database: Database | None = None,
) -> dict[str, Any]:
    normalized_category = category.strip().lower()

    if normalized_category not in BED_CATEGORIES:
        raise InvalidBedCategoryError(
            f"Invalid bed category '{category}'. Expected one of: {', '.join(sorted(BED_CATEGORIES))}."
        )

    object_id = parse_hospital_id(hospital_id)
    collection = get_hospitals_collection(database)
    hospital = collection.find_one({"_id": object_id})

    if not hospital:
        raise HospitalNotFoundError("Hospital not found.")

    bed_info = hospital.get("beds", {}).get(normalized_category)

    if not bed_info:
        raise InvalidBedCategoryError(f"Hospital does not have '{normalized_category}' bed data.")

    current_available = bed_info["available"]
    total = bed_info["total"]
    new_available = current_available + delta

    if new_available < 0:
        raise BedAvailabilityError(f"{normalized_category} bed availability cannot go below 0.")

    if new_available > total:
        raise BedAvailabilityError(
            f"{normalized_category} bed availability cannot exceed total beds ({total})."
        )

    collection.update_one(
        {"_id": object_id},
        {"$set": {f"beds.{normalized_category}.available": new_available}},
    )

    hospital["beds"][normalized_category]["available"] = new_available
    return serialize_hospital(hospital)
