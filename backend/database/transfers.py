from bson import ObjectId
from database.mongodb import get_database
from datetime import datetime, timezone


def get_transfers_collection():
    return get_database()["transfers"]


def get_patients_collection():
    return get_database()["patients"]


def create_transfer(data: dict) -> dict:
    data.setdefault("status", "pending")
    data.setdefault("createdAt", datetime.now(timezone.utc))
    collection = get_transfers_collection()
    result = collection.insert_one(data)
    data["_id"] = str(result.inserted_id)
    return data


def get_transfers(hospital_name: str | None = None) -> list[dict]:
    query = {"to_hospital": hospital_name} if hospital_name else {}
    records = list(get_transfers_collection().find(query).sort("createdAt", -1))
    for record in records:
        record["_id"] = str(record["_id"])
        record["transfer_id"] = record["_id"]
    return records


def get_transfer_by_id(transfer_id: str) -> dict | None:
    collection = get_transfers_collection()
    transfer = collection.find_one({"_id": ObjectId(transfer_id)})
    if transfer:
        transfer["_id"] = str(transfer["_id"])
    return transfer


def update_transfer_status(transfer_id: str, status: str) -> None:
    collection = get_transfers_collection()
    collection.update_one({"_id": ObjectId(transfer_id)}, {"$set": {"status": status}})


def get_patient_by_id(patient_id: str) -> dict | None:
    collection = get_patients_collection()
    patient = collection.find_one({"_id": ObjectId(patient_id)})
    if patient:
        patient["_id"] = str(patient["_id"])
    return patient


def get_all_patients() -> list[dict]:
    collection = get_patients_collection()
    patients = list(collection.find())
    for p in patients:
        p["_id"] = str(p["_id"])
        p.setdefault("current_hospital", "Unassigned")
    return patients


def update_patient_hospital(patient_id: str, hospital_name: str) -> None:
    collection = get_patients_collection()
    collection.update_one(
        {"_id": ObjectId(patient_id)},
        {"$set": {"current_hospital": hospital_name}},
    )
