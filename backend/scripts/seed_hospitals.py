from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

from database.hospitals import get_hospitals_collection
from database.mongodb import MONGODB_UNAVAILABLE_MESSAGE
from database.mongodb import get_database
from routes.auth import _hash
import secrets
from models.hospital import HospitalSeed


SEED_HOSPITALS = [
    {
        "name": "CityCare General Hospital",
        "type": "hospital",
        "city": "Delhi",
        "facilities": ["Emergency", "ICU", "Oxygen", "Pharmacy"],
        "beds": {
            "general": {"total": 120, "available": 42},
            "icu": {"total": 24, "available": 6},
            "oxygen": {"total": 40, "available": 12},
            "emergency": {"total": 18, "available": 5},
        },
    },
    {
        "name": "Lotus Multispeciality Center",
        "type": "hospital",
        "city": "Mumbai",
        "facilities": ["Cardiology", "Emergency", "ICU", "Diagnostics"],
        "beds": {
            "general": {"total": 95, "available": 31},
            "icu": {"total": 18, "available": 4},
            "oxygen": {"total": 30, "available": 9},
            "emergency": {"total": 14, "available": 3},
        },
    },
    {
        "name": "Sunrise Trauma Institute",
        "type": "hospital",
        "city": "Bengaluru",
        "facilities": ["Trauma", "Emergency", "ICU", "Blood Bank"],
        "beds": {
            "general": {"total": 80, "available": 26},
            "icu": {"total": 20, "available": 7},
            "oxygen": {"total": 28, "available": 10},
            "emergency": {"total": 20, "available": 8},
        },
    },
    {
        "name": "Green Valley Women's Hospital",
        "type": "hospital",
        "city": "Pune",
        "facilities": ["Maternity", "Neonatal ICU", "Emergency", "Oxygen"],
        "beds": {
            "general": {"total": 70, "available": 22},
            "icu": {"total": 10, "available": 2},
            "oxygen": {"total": 24, "available": 11},
            "emergency": {"total": 8, "available": 2},
        },
    },
    {
        "name": "NorthStar Children's Medical",
        "type": "hospital",
        "city": "Chennai",
        "facilities": ["Pediatrics", "Emergency", "ICU", "Diagnostics"],
        "beds": {
            "general": {"total": 65, "available": 19},
            "icu": {"total": 12, "available": 3},
            "oxygen": {"total": 22, "available": 8},
            "emergency": {"total": 10, "available": 4},
        },
    },
    {
        "name": "CarePoint Family Clinic",
        "type": "clinic",
        "city": "Delhi",
        "facilities": ["General Practice", "Diagnostics", "Pharmacy"],
        "beds": {"general": {"total": 0, "available": 0}, "icu": {"total": 0, "available": 0}, "oxygen": {"total": 0, "available": 0}, "emergency": {"total": 0, "available": 0}},
    },
    {
        "name": "WellSpring Community Clinic",
        "type": "clinic",
        "city": "Bengaluru",
        "facilities": ["General Practice", "Vaccination", "Pharmacy"],
        "beds": {"general": {"total": 0, "available": 0}, "icu": {"total": 0, "available": 0}, "oxygen": {"total": 0, "available": 0}, "emergency": {"total": 0, "available": 0}},
    },
]


def seed_hospitals() -> int:
    collection = get_hospitals_collection()
    collection.create_index([("name", 1), ("city", 1)], unique=True)

    for hospital in SEED_HOSPITALS:
        validated_hospital = HospitalSeed(**hospital).model_dump()
        collection.update_one(
            {"name": validated_hospital["name"], "city": validated_hospital["city"]},
            {"$set": validated_hospital},
            upsert=True,
        )

        saved = collection.find_one({"name": validated_hospital["name"], "city": validated_hospital["city"]})
        salt = secrets.token_hex(16)
        get_database().hospital_users.update_one(
            {"hospital_id": str(saved["_id"])},
            {"$setOnInsert": {"hospital_id": str(saved["_id"]), "hospital_object_id": saved["_id"],
                               "password_salt": salt, "password_hash": _hash("Hospital@123", salt)}},
            upsert=True,
        )

    return len(SEED_HOSPITALS)


if __name__ == "__main__":
    try:
        count = seed_hospitals()
    except ServerSelectionTimeoutError as exc:
        print(MONGODB_UNAVAILABLE_MESSAGE)
        raise SystemExit(1) from exc
    except PyMongoError as exc:
        print(f"MongoDB seed failed: {exc}")
        raise SystemExit(1) from exc

    print(f"Seeded {count} hospitals.")
