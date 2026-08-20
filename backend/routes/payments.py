import os
import hmac
import hashlib
import json
import urllib.request
import urllib.error
import base64
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from database.payments import create_payment_order, ensure_payment_indexes, get_open_payment_for_appointment, get_payment_by_order_id, get_payments_by_patient, get_payments_by_hospital
from routes.auth import current_patient
from routes.hospital_auth import get_current_staff
from database.mongodb import get_database
from bson import ObjectId

router = APIRouter(prefix="/payments", tags=["payments"])

def gateway_credentials() -> tuple[str, str]:
    key_id = os.getenv("RAZORPAY_KEY_ID", "")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
    if not key_id or not key_secret:
        raise HTTPException(503, "Payment gateway is not configured.")
    return key_id, key_secret

# The hospital document is authoritative when it defines consultation_fee_paise.
# Older hospitals retain the existing ₹500 consultation fee until configured.
DEFAULT_CONSULTATION_FEE_PAISE = 50_000


class CreateOrderRequest(BaseModel):
    appointment_id: str
    # Retained as optional fields so existing clients do not receive a schema error.
    # These values are deliberately ignored: price and facility come from the appointment.
    hospital_id: str | None = None
    amount: int | None = None

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/create-order")
def create_order(payload: CreateOrderRequest, authorization: str | None = Header(default=None)):
    # Use same header-based auth pattern as appointments.py to avoid 422 validation errors
    patient = current_patient(authorization)

    key_id, key_secret = gateway_credentials()
    db = get_database()
    try:
        appointment = db.appointments.find_one({"_id": ObjectId(payload.appointment_id), "patient_id": patient["_id"]})
    except Exception as exc:
        raise HTTPException(400, "Invalid appointment ID.") from exc
    if not appointment:
        raise HTTPException(404, "Appointment not found.")
    if appointment.get("status") not in ("Pending", "Confirmed"):
        raise HTTPException(409, "This appointment cannot be paid in its current state.")
    if appointment.get("payment_status") == "paid":
        raise HTTPException(409, "This appointment has already been paid.")
    try:
        hospital = db.hospitals.find_one({"_id": ObjectId(appointment["hospitalId"])})
    except Exception as exc:
        raise HTTPException(409, "The appointment has an invalid hospital.") from exc
    if not hospital:
        raise HTTPException(409, "The appointment hospital was not found.")
    amount = hospital.get("consultation_fee_paise", DEFAULT_CONSULTATION_FEE_PAISE)
    if not isinstance(amount, int) or not 0 < amount <= 10_000_000:
        raise HTTPException(503, "The hospital consultation fee is unavailable.")

    ensure_payment_indexes()
    existing = get_open_payment_for_appointment(payload.appointment_id, str(patient["_id"]))
    if existing:
        return {"orderId": existing["razorpay_order_id"], "amount": existing["amount"], "currency": "INR", "keyId": key_id}

    auth_string = f"{key_id}:{key_secret}"
    base64_auth = base64.b64encode(auth_string.encode()).decode()

    req_body = json.dumps({
        "amount": amount,
        "currency": "INR",
        "receipt": payload.appointment_id[:40]  # Razorpay receipt max 40 chars
    }).encode()

    req = urllib.request.Request(
        "https://api.razorpay.com/v1/orders",
        data=req_body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Basic {base64_auth}"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as response:
            rzp_res = json.loads(response.read().decode())
    except urllib.error.HTTPError as exc:
        raise HTTPException(502, "The payment gateway could not create an order.") from exc
    except urllib.error.URLError as exc:
        raise HTTPException(502, "The payment gateway is unavailable. Please try again.") from exc

    order_id = rzp_res.get("id")
    if not order_id:
        raise HTTPException(502, "Razorpay returned an unexpected response.")

    payment_data = {
        "appointment_id": payload.appointment_id,
        "patient_id": str(patient["_id"]),
        "hospital_id": appointment["hospitalId"],
        "razorpay_order_id": order_id,
        "amount": amount,
        "status": "created"
    }
    create_payment_order(payment_data)

    return {
        "orderId": order_id,
        "amount": amount,
        "currency": "INR",
        "keyId": key_id
    }


@router.post("/verify")
def verify_payment(payload: VerifyPaymentRequest, authorization: str | None = Header(default=None)):
    patient = current_patient(authorization)
    _, key_secret = gateway_credentials()
    payment = get_payment_by_order_id(payload.razorpay_order_id)
    if not payment or payment["patient_id"] != str(patient["_id"]):
        raise HTTPException(404, "Payment order not found.")

    # Verify Razorpay HMAC-SHA256 signature
    msg = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
    expected_signature = hmac.new(
        key_secret.encode(),
        msg.encode(),
        hashlib.sha256
    ).hexdigest()

    if not secrets_compare(expected_signature, payload.razorpay_signature):
        raise HTTPException(400, "Invalid payment signature — payment could not be verified.")

    if payment.get("status") == "paid":
        if payment.get("razorpay_payment_id") == payload.razorpay_payment_id:
            return {"status": "success"}
        raise HTTPException(409, "This payment order has already been verified.")
    if payment.get("status") != "created":
        raise HTTPException(409, "This payment order cannot be verified in its current state.")

    db = get_database()
    try:
        appointment_id = ObjectId(payment["appointment_id"])
    except Exception as exc:
        raise HTTPException(409, "The payment order has an invalid appointment.") from exc
    appointment_result = db.appointments.update_one(
        {
            "_id": appointment_id,
            "patient_id": patient["_id"],
            "hospitalId": payment["hospital_id"],
            "status": {"$in": ["Pending", "Confirmed"]},
            "payment_status": {"$ne": "paid"},
        },
        {"$set": {"status": "Confirmed", "payment_status": "paid"}},
    )
    if appointment_result.modified_count != 1:
        raise HTTPException(409, "This appointment cannot be marked as paid in its current state.")

    result = db.payments.update_one(
        {"_id": payment["_id"], "status": "created"},
        {"$set": {"status": "paid", "razorpay_payment_id": payload.razorpay_payment_id}},
    )
    if result.modified_count != 1:
        # A retry may have won the race. It is only a success for the same gateway payment.
        current = get_payment_by_order_id(payload.razorpay_order_id)
        if current and current.get("status") == "paid" and current.get("razorpay_payment_id") == payload.razorpay_payment_id:
            return {"status": "success"}
        raise HTTPException(409, "This payment order was updated concurrently. Please refresh and retry.")

    return {"status": "success"}


def secrets_compare(a: str, b: str) -> bool:
    """Constant-time comparison to prevent timing attacks."""
    import secrets
    return secrets.compare_digest(a, b)


@router.get("/patient")
def get_patient_payments(authorization: str | None = Header(default=None)):
    patient = current_patient(authorization)
    return get_payments_by_patient(str(patient["_id"]))


@router.get("/hospital")
def get_hospital_payments(authorization: str | None = Header(default=None)):
    staff = get_current_staff(authorization)
    return get_payments_by_hospital(staff["hospital_id"])
