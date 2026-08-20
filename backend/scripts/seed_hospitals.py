from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

from database.hospitals import get_hospitals_collection
from database.mongodb import MONGODB_UNAVAILABLE_MESSAGE
from models.hospital import HospitalSeed


SEED_HOSPITALS = [
    {
        "name": "CityCare General Hospital",
        "city": "Delhi",
        "facilities": ["Emergency", "ICU", "Oxygen", "Pharmacy"],
        "beds": {
            "general": {"total": 120, "available": 42},
            "icu": {"total": 24, "available": 6},
            "oxygen": {"total": 40, "available": 12},
            "emergency": {"total": 18, "available": 5},
            "ventilators": {"total": 3, "available": 2},
        },
        "latitude": 28.6139,
        "longitude": 77.2090,
    },
    {
        "name": "Lotus Multispeciality Center",
        "city": "Mumbai",
        "facilities": ["Cardiology", "Emergency", "ICU", "Diagnostics"],
        "beds": {
            "general": {"total": 95, "available": 31},
            "icu": {"total": 18, "available": 4},
            "oxygen": {"total": 30, "available": 9},
            "emergency": {"total": 14, "available": 3},
            "ventilators": {"total": 2, "available": 1},
        },
        "latitude": 19.0760,
        "longitude": 72.8777,
    },
    {
        "name": "Sunrise Trauma Institute",
        "city": "Bengaluru",
        "facilities": ["Trauma", "Emergency", "ICU", "Blood Bank"],
        "beds": {
            "general": {"total": 80, "available": 26},
            "icu": {"total": 20, "available": 7},
            "oxygen": {"total": 28, "available": 10},
            "emergency": {"total": 20, "available": 8},
            "ventilators": {"total": 3, "available": 3},
        },
        "latitude": 12.9716,
        "longitude": 77.5946,
    },
    {
        "name": "Green Valley Women's Hospital",
        "city": "Pune",
        "facilities": ["Maternity", "Neonatal ICU", "Emergency", "Oxygen"],
        "beds": {
            "general": {"total": 70, "available": 22},
            "icu": {"total": 10, "available": 2},
            "oxygen": {"total": 24, "available": 11},
            "emergency": {"total": 8, "available": 2},
            "ventilators": {"total": 2, "available": 1},
        },
        "latitude": 18.5204,
        "longitude": 73.8567,
    },
    {
        "name": "NorthStar Children's Medical",
        "city": "Chennai",
        "facilities": ["Pediatrics", "Emergency", "ICU", "Diagnostics"],
        "beds": {
            "general": {"total": 65, "available": 19},
            "icu": {"total": 12, "available": 3},
            "oxygen": {"total": 22, "available": 8},
            "emergency": {"total": 10, "available": 4},
            "ventilators": {"total": 2, "available": 2},
        },
        "latitude": 13.0827,
        "longitude": 80.2707,
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
