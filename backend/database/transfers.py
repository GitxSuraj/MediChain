from bson import ObjectId
from database.mongodb import get_database


def get_transfers_collection():
    return get_database()["transfers"]


def get_patients_collection():
    return get_database()["patients"]


def create_transfer(data: dict) -> dict:
    collection = get_transfers_collection()
    result = collection.insert_one(data)
    data["_id"] = str(result.inserted_id)
    return data


def update_transfer_status(transfer_id: str, status: str) -> None:
    collection = get_transfers_collection()
    collection.update_one({"_id": ObjectId(transfer_id)}, {"$set": {"status": status}})


def get_patient_by_id(patient_id: str) -> dict | None:
    collection = get_patients_collection()
    patient = collection.find_one({"_id": ObjectId(patient_id)})
    if patient:
        patient["_id"] = str(patient["_id"])
    return patient
