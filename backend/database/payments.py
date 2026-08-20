from database.mongodb import get_database
from datetime import datetime, timezone
from bson import ObjectId

def create_payment_order(payment_data: dict) -> dict:
    db = get_database()
    payment_data["created_at"] = datetime.now(timezone.utc)
    result = db.payments.insert_one(payment_data)
    payment_data["_id"] = str(result.inserted_id)
    return payment_data


def ensure_payment_indexes() -> None:
    """Create only the indexes needed for payment ownership and idempotency."""
    payments = get_database().payments
    payments.create_index("razorpay_order_id", unique=True, name="payment_order_id_unique")
    payments.create_index(
        "razorpay_payment_id",
        unique=True,
        sparse=True,
        name="payment_id_unique",
    )
    payments.create_index("appointment_id", name="payment_appointment_id")
    payments.create_index(
        [("patient_id", 1), ("created_at", -1)],
        name="payment_patient_created_at",
    )

def get_payment_by_order_id(order_id: str) -> dict:
    db = get_database()
    return db.payments.find_one({"razorpay_order_id": order_id})


def get_open_payment_for_appointment(appointment_id: str, patient_id: str) -> dict:
    return get_database().payments.find_one(
        {"appointment_id": appointment_id, "patient_id": patient_id, "status": "created"},
        sort=[("created_at", -1)],
    )

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
