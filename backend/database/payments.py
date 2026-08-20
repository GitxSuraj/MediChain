from database.mongodb import get_database
from datetime import datetime, timezone
from bson import ObjectId

def create_payment_order(payment_data: dict) -> dict:
    db = get_database()
    payment_data["created_at"] = datetime.now(timezone.utc)
    result = db.payments.insert_one(payment_data)
    payment_data["_id"] = str(result.inserted_id)
    return payment_data

def get_payment_by_order_id(order_id: str) -> dict:
    db = get_database()
    return db.payments.find_one({"razorpay_order_id": order_id})

def update_payment_status(order_id: str, status: str, payment_id: str = None) -> None:
    db = get_database()
    updates = {"status": status}
    if payment_id:
        updates["razorpay_payment_id"] = payment_id
    db.payments.update_one({"razorpay_order_id": order_id}, {"$set": updates})

def get_payments_by_patient(patient_id: str) -> list:
    db = get_database()
    payments = list(db.payments.find({"patient_id": patient_id}))
    for p in payments:
        p["_id"] = str(p["_id"])
    return payments

def get_payments_by_hospital(hospital_id: str) -> list:
    db = get_database()
    payments = list(db.payments.find({"hospital_id": hospital_id}))
    for p in payments:
        p["_id"] = str(p["_id"])
    return payments
