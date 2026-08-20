import os
import hmac
import hashlib
import json
import urllib.request
import urllib.error
import base64
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from database.payments import create_payment_order, get_payment_by_order_id, update_payment_status, get_payments_by_patient, get_payments_by_hospital
from routes.auth import current_patient
from routes.hospital_auth import get_current_staff
from database.mongodb import get_database
from bson import ObjectId

router = APIRouter(prefix="/payments", tags=["payments"])

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

class CreateOrderRequest(BaseModel):
    appointment_id: str
    hospital_id: str
    amount: int  # in paise

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/create-order")
def create_order(payload: CreateOrderRequest, authorization: str | None = Header(default=None)):
    # Use same header-based auth pattern as appointments.py to avoid 422 validation errors
    patient = current_patient(authorization)

    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(500, "Payment gateway is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env")

    auth_string = f"{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}"
    base64_auth = base64.b64encode(auth_string.encode()).decode()

    req_body = json.dumps({
        "amount": payload.amount,
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
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise HTTPException(502, f"Razorpay rejected the request: {body}")
    except urllib.error.URLError as e:
        raise HTTPException(502, f"Could not reach Razorpay: {e.reason}")

    order_id = rzp_res.get("id")
    if not order_id:
        raise HTTPException(502, "Razorpay returned an unexpected response.")

    payment_data = {
        "appointment_id": payload.appointment_id,
        "patient_id": str(patient["_id"]),
        "hospital_id": payload.hospital_id,
        "razorpay_order_id": order_id,
        "amount": payload.amount,
        "status": "created"
    }
    create_payment_order(payment_data)

    return {
        "orderId": order_id,
        "amount": payload.amount,
        "currency": "INR",
        "keyId": RAZORPAY_KEY_ID
    }


@router.post("/verify")
def verify_payment(payload: VerifyPaymentRequest):
    if not RAZORPAY_KEY_SECRET:
        raise HTTPException(500, "Payment gateway is not configured.")

    # Verify Razorpay HMAC-SHA256 signature
    msg = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        msg.encode(),
        hashlib.sha256
    ).hexdigest()

    if not secrets_compare(expected_signature, payload.razorpay_signature):
        raise HTTPException(400, "Invalid payment signature — payment could not be verified.")

    # Update payment record
    update_payment_status(payload.razorpay_order_id, "paid", payload.razorpay_payment_id)

    # Mark appointment as confirmed + paid
    payment = get_payment_by_order_id(payload.razorpay_order_id)
    if payment:
        db = get_database()
        try:
            appt_oid = ObjectId(payment["appointment_id"])
            db.appointments.update_one(
                {"_id": appt_oid},
                {"$set": {"status": "confirmed", "payment_status": "paid"}}
            )
        except Exception:
            pass  # appointment update failure should not block payment confirmation

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
