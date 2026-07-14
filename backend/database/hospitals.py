import re
from typing import Any

from pymongo.collection import Collection
from pymongo.database import Database

from database.mongodb import get_database


HOSPITALS_COLLECTION = "hospitals"


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
