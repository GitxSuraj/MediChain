from bson import ObjectId
from pymongo import ReturnDocument, DESCENDING
from database.mongodb import get_database

COLLECTION = "vitals"

def serialize(doc):
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc

def add_vital(document: dict) -> dict:
    db = get_database()
    result = db[COLLECTION].insert_one(document)
    document["_id"] = result.inserted_id
    return serialize(document)

def get_vitals(patient_id: str, vital_type: str = None, skip: int = 0, limit: int = 50) -> list:
    db = get_database()
    query = {"patient_id": patient_id}
    if vital_type:
        query["type"] = vital_type
    cursor = db[COLLECTION].find(query).sort("recorded_at", DESCENDING).skip(skip).limit(limit)
    return [serialize(doc) for doc in cursor]

def get_latest_vitals(patient_id: str) -> list:
    """Get the most recent reading for each vital type."""
    db = get_database()
    pipeline = [
        {"$match": {"patient_id": patient_id}},
        {"$sort": {"recorded_at": -1}},
        {"$group": {
            "_id": "$type",
            "doc": {"$first": "$$ROOT"}
        }},
        {"$replaceRoot": {"newRoot": "$doc"}}
    ]
    results = list(db[COLLECTION].aggregate(pipeline))
    return [serialize(doc) for doc in results]

def update_vital(patient_id: str, vital_id: str, updates: dict) -> dict | None:
    db = get_database()
    # Remove None values
    updates = {k: v for k, v in updates.items() if v is not None}
    if not updates:
        return None
    doc = db[COLLECTION].find_one_and_update(
        {"_id": ObjectId(vital_id), "patient_id": patient_id},
        {"$set": updates},
        return_document=ReturnDocument.AFTER
    )
    return serialize(doc) if doc else None

def delete_vital(patient_id: str, vital_id: str) -> bool:
    db = get_database()
    result = db[COLLECTION].delete_one({"_id": ObjectId(vital_id), "patient_id": patient_id})
    return result.deleted_count > 0
