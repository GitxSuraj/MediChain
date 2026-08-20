from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from fastapi import APIRouter, Depends, HTTPException, Header
from bson import ObjectId
from models.bill import BillGenerateRequest, BillStatusRequest
from database.mongodb import get_database
from routes.hospital_auth import get_current_staff
from routes.auth import current_patient

router = APIRouter(prefix="/billing", tags=["billing"])
patient_bills_router = APIRouter(prefix="/patients", tags=["billing"])
MONEY = Decimal("0.01")
def serialize(doc):
    doc = dict(doc); doc["id"] = str(doc.pop("_id")); return doc
def money(value): return Decimal(str(value)).quantize(MONEY, rounding=ROUND_HALF_UP)

@router.post("/generate", status_code=201)
def generate_bill(payload: BillGenerateRequest, staff=Depends(get_current_staff)):
    db = get_database()
    try: appointment = db.appointments.find_one({"_id": ObjectId(payload.appointment_id), "hospitalId": staff["hospital_id"]})
    except Exception as exc: raise HTTPException(400, "Invalid appointment ID.") from exc
    if not appointment: raise HTTPException(404, "Appointment not found for your hospital.")
    events = list(db.medicine_dispensings.find({"hospital_id": staff["hospital_id"], "appointment_id": payload.appointment_id}))
    items = [{"description": f"Medicine: {db.medicines.find_one({'_id': ObjectId(e['medicine_id'])}).get('name', 'Medicine')}", "quantity": e["quantity"], "unit_price": float(money(e["unit_price"])), "total": float(money(e["quantity"]) * money(e["unit_price"]))} for e in events]
    items += [item.model_dump() | {"total": float(money(item.quantity) * money(item.unit_price))} for item in payload.manual_items]
    subtotal = sum((money(item["total"]) for item in items), Decimal("0")); tax = (subtotal * money(payload.tax_rate) / Decimal("100")).quantize(MONEY, rounding=ROUND_HALF_UP)
    bill = {"hospital_id": staff["hospital_id"], "patient_id": str(appointment["patient_id"]), "appointment_id": payload.appointment_id, "items": items, "subtotal": float(subtotal), "tax": float(tax), "total": float(subtotal + tax), "status": "issued", "created_at": datetime.now(timezone.utc)}
    result = db.bills.insert_one(bill); bill["_id"] = result.inserted_id; return serialize(bill)

@router.get("/{bill_id}")
def get_bill(bill_id: str, authorization: str | None = Header(default=None)):
    try: bill = get_database().bills.find_one({"_id": ObjectId(bill_id)})
    except Exception as exc: raise HTTPException(400, "Invalid bill ID.") from exc
    if not bill: raise HTTPException(404, "Bill not found.")
    token = (authorization or "").removeprefix("Bearer ").strip(); session = get_database().sessions.find_one({"token": token})
    if not session or (session.get("hospital_id") != bill["hospital_id"] and session.get("patient_id") != ObjectId(bill["patient_id"])): raise HTTPException(403, "You cannot access this bill.")
    return serialize(bill)

@router.put("/{bill_id}/status")
def update_status(bill_id: str, payload: BillStatusRequest, staff=Depends(get_current_staff)):
    try: bill = get_database().bills.find_one_and_update({"_id": ObjectId(bill_id), "hospital_id": staff["hospital_id"]}, {"$set": {"status": payload.status}}, return_document=__import__('pymongo').ReturnDocument.AFTER)
    except Exception as exc: raise HTTPException(400, "Invalid bill ID.") from exc
    if not bill: raise HTTPException(404, "Bill not found.")
    return serialize(bill)

@patient_bills_router.get("/{patient_id}/bills")
def patient_bills(patient_id: str, patient=Depends(lambda authorization=Header(default=None): current_patient(authorization))):
    if str(patient["_id"]) != patient_id: raise HTTPException(403, "You can only access your own bills.")
    return [serialize(x) for x in get_database().bills.find({"patient_id": patient_id}).sort("created_at", -1)]
