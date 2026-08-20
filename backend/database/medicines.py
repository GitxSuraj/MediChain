from bson import ObjectId
from pymongo import ReturnDocument
from database.mongodb import get_database

COLLECTION = "medicines"
DISPENSINGS = "medicine_dispensings"

def _id(value: str) -> ObjectId: return ObjectId(value)
def serialize(doc):
    doc = dict(doc); doc["id"] = str(doc.pop("_id")); return doc
def add_medicine(document):
    result = get_database()[COLLECTION].insert_one(document); document["_id"] = result.inserted_id; return serialize(document)
def get_medicines(hospital_id, search="", skip=0, limit=50):
    query = {"hospital_id": hospital_id}
    if search: query["$or"] = [{"name": {"$regex": search, "$options": "i"}}, {"generic_name": {"$regex": search, "$options": "i"}}]
    return [serialize(x) for x in get_database()[COLLECTION].find(query).sort("name", 1).skip(skip).limit(limit)]
def get_medicine(hospital_id, medicine_id):
    doc = get_database()[COLLECTION].find_one({"_id": _id(medicine_id), "hospital_id": hospital_id}); return serialize(doc) if doc else None
def update_medicine(hospital_id, medicine_id, updates):
    doc = get_database()[COLLECTION].find_one_and_update({"_id": _id(medicine_id), "hospital_id": hospital_id}, {"$set": updates}, return_document=ReturnDocument.AFTER); return serialize(doc) if doc else None
def delete_medicine(hospital_id, medicine_id):
    return get_database()[COLLECTION].delete_one({"_id": _id(medicine_id), "hospital_id": hospital_id}).deleted_count
def dispense(hospital_id, medicine_id, patient_id, quantity, appointment_id=None):
    db = get_database()
    medicine = db[COLLECTION].find_one_and_update({"_id": _id(medicine_id), "hospital_id": hospital_id, "quantity": {"$gte": quantity}}, {"$inc": {"quantity": -quantity}}, return_document=ReturnDocument.AFTER)
    if not medicine: return None
    event = {"hospital_id": hospital_id, "medicine_id": medicine_id, "patient_id": patient_id, "appointment_id": appointment_id, "quantity": quantity, "unit_price": medicine["price_per_unit"]}
    result = db[DISPENSINGS].insert_one(event); event["id"] = str(result.inserted_id)
    return {"medicine": serialize(medicine), "dispensing": event}
