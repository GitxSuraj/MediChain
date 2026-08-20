import os
import json
import base64
import urllib.request
import hmac
import hashlib
from datetime import datetime, timezone
from fastapi import APIRouter, Header, HTTPException
from database.orders import create_order, get_order, get_patient_orders, get_hospital_orders, update_order
from database.medicines import get_medicine, update_medicine
from models.order import OrderCreateRequest, VerifyOrderPaymentRequest, OrderItem
from routes.auth import current_patient
from routes.hospital_auth import get_current_staff

router = APIRouter(prefix="/orders", tags=["orders"])

def gateway_credentials():
    key_id = os.getenv("RAZORPAY_KEY_ID", "")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
    if not key_id or not key_secret:
        raise HTTPException(503, "Payment gateway is not configured.")
    return key_id, key_secret

@router.post("")
def create_new_order(payload: OrderCreateRequest, authorization: str | None = Header(default=None)):
    patient = current_patient(authorization)
    patient_id = str(patient["_id"])

    items_data = []
    subtotal = 0.0

    for item_req in payload.items:
        med = get_medicine(payload.hospital_id, item_req.medicine_id)
        if not med:
            raise HTTPException(404, f"Medicine {item_req.medicine_id} not found in this hospital.")
        if med.get("quantity", 0) < item_req.quantity:
            raise HTTPException(400, f"Insufficient stock for {med.get('name')}.")

        unit_price = med.get("price_per_unit", 0)
        total_price = unit_price * item_req.quantity
        subtotal += total_price

        items_data.append(OrderItem(
            medicine_id=item_req.medicine_id,
            name=med.get("name"),
            generic_name=med.get("generic_name", ""),
            sku=med.get("sku", ""),
            quantity=item_req.quantity,
            unit_price=unit_price,
            total=total_price
        ))

    tax = round(subtotal * 0.18, 2)
    total = round(subtotal + tax, 2)

    # Create Razorpay order
    key_id, key_secret = gateway_credentials()
    total_paise = int(total * 100)

    order_data_req = json.dumps({"amount": total_paise, "currency": "INR"}).encode()
    req = urllib.request.Request("https://api.razorpay.com/v1/orders", data=order_data_req, headers={"Content-Type": "application/json"})
    credentials = base64.b64encode(f"{key_id}:{key_secret}".encode()).decode()
    req.add_header("Authorization", f"Basic {credentials}")

    try:
        response = urllib.request.urlopen(req)
        razorpay_order = json.loads(response.read())
        razorpay_order_id = razorpay_order.get("id")
    except Exception as e:
        raise HTTPException(500, f"Failed to create payment order: {str(e)}")

    order_doc = {
        "patient_id": patient_id,
        "hospital_id": payload.hospital_id,
        "items": [i.model_dump() for i in items_data],
        "subtotal": subtotal,
        "tax": tax,
        "total": total,
        "status": "pending",
        "razorpay_order_id": razorpay_order_id,
        "created_at": datetime.now(timezone.utc),
    }

    created = create_order(order_doc)

    return {
        "orderId": razorpay_order_id,
        "amount": total_paise,
        "currency": "INR",
        "order_id": created["id"],
        "razorpay_key_id": key_id
    }

@router.post("/{order_id}/verify-payment")
def verify_payment(order_id: str, payload: VerifyOrderPaymentRequest, authorization: str | None = Header(default=None)):
    patient = current_patient(authorization)
    patient_id = str(patient["_id"])

    order = get_order(order_id)
    if not order:
        raise HTTPException(404, "Order not found.")
    if order["patient_id"] != patient_id:
        raise HTTPException(403, "Not authorized to verify this order.")

    _, key_secret = gateway_credentials()

    # Verify HMAC SHA256 signature
    msg = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
    expected_sig = hmac.HMAC(
        key_secret.encode(),
        msg.encode(),
        hashlib.sha256
    ).hexdigest()

    if expected_sig != payload.razorpay_signature:
        raise HTTPException(400, "Invalid payment signature.")

    # Mark paid and decrement stock
    for item in order["items"]:
        med = get_medicine(order["hospital_id"], item["medicine_id"])
        if med:
            new_qty = max(0, med.get("quantity", 0) - item["quantity"])
            update_medicine(order["hospital_id"], item["medicine_id"], {"quantity": new_qty})

    updated_order = update_order(order_id, {
        "status": "paid",
        "razorpay_payment_id": payload.razorpay_payment_id
    })
    return updated_order

@router.get("/my")
def my_orders(authorization: str | None = Header(default=None)):
    patient = current_patient(authorization)
    return get_patient_orders(str(patient["_id"]))

@router.get("/hospitals/{hospital_id}")
def hospital_orders(hospital_id: str, authorization: str | None = Header(default=None)):
    staff = get_current_staff(authorization)
    if staff.get("hospital_id") != hospital_id:
        raise HTTPException(403, "Can only view orders for your hospital.")
    if staff.get("role") != "super_admin" and "manage_inventory" not in staff.get("permissions", []):
        raise HTTPException(403, "Inventory permission required.")
    return get_hospital_orders(hospital_id)

@router.put("/{order_id}/fulfill")
def fulfill_order(order_id: str, authorization: str | None = Header(default=None)):
    staff = get_current_staff(authorization)
    if staff.get("role") != "super_admin" and "manage_inventory" not in staff.get("permissions", []):
        raise HTTPException(403, "Inventory permission required.")

    order = get_order(order_id)
    if not order:
        raise HTTPException(404, "Order not found.")
    if order["status"] != "paid":
        raise HTTPException(409, "Only paid orders can be fulfilled.")
    if staff.get("hospital_id") != order["hospital_id"]:
        raise HTTPException(403, "Not authorized to fulfill this order.")

    return update_order(order_id, {"status": "fulfilled"})
