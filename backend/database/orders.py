from datetime import datetime, timezone
from bson import ObjectId
from pymongo import ReturnDocument
from database.mongodb import get_database

def serialize(doc):
    if not doc: return None
    doc["id"] = str(doc.pop("_id"))
    return doc

def create_order(order_data: dict) -> dict:
    db = get_database()
    order_data["created_at"] = datetime.now(timezone.utc)
    result = db.orders.insert_one(order_data)
    order_data["_id"] = result.inserted_id
    return serialize(order_data)

def get_order(order_id: str) -> dict | None:
    db = get_database()
    try:
        doc = db.orders.find_one({"_id": ObjectId(order_id)})
        return serialize(doc)
    except Exception:
        return None

def get_patient_orders(patient_id: str) -> list[dict]:
    db = get_database()
    cursor = db.orders.find({"patient_id": patient_id}).sort("created_at", -1)
    return [serialize(doc) for doc in cursor]

def get_hospital_orders(hospital_id: str) -> list[dict]:
    db = get_database()
    cursor = db.orders.find({"hospital_id": hospital_id}).sort("created_at", -1)
    return [serialize(doc) for doc in cursor]

def update_order(order_id: str, updates: dict) -> dict | None:
    db = get_database()
    try:
        doc = db.orders.find_one_and_update(
            {"_id": ObjectId(order_id)},
            {"$set": updates},
            return_document=ReturnDocument.AFTER
        )
        return serialize(doc)
    except Exception:
        return None
