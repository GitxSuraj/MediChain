from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from bson.errors import InvalidId
from database.medicines import add_medicine, delete_medicine, dispense, get_medicine, get_medicines, update_medicine
from database.mongodb import get_database
from models.medicine import DispenseRequest, MedicineCreate, medicine_document
from routes.hospital_auth import get_current_staff

router = APIRouter(prefix="/hospitals/{hospital_id}/inventory", tags=["inventory"])
def access(hospital_id, staff=Depends(get_current_staff)):
    if staff.get("hospital_id") != hospital_id: raise HTTPException(403, "You can only manage your own inventory.")
    if staff.get("role") != "super_admin" and "manage_inventory" not in staff.get("permissions", []):
        raise HTTPException(403, "Inventory permission is required.")
    return staff
def valid_hospital(hospital_id):
    from bson import ObjectId
    try: hospital = get_database().hospitals.find_one({"_id": ObjectId(hospital_id)})
    except Exception: raise HTTPException(400, "Invalid hospital ID.")
    if not hospital: raise HTTPException(404, "Hospital not found.")

@router.get("")
def list_inventory(hospital_id: str, search: str = Query(default="", max_length=100), page: int = Query(default=1, ge=1), limit: int = Query(default=50, ge=1, le=100), _=Depends(access)):
    valid_hospital(hospital_id); return get_medicines(hospital_id, search, (page - 1) * limit, limit)
@router.post("", status_code=201)
def create_inventory(hospital_id: str, payload: MedicineCreate, _=Depends(access)):
    valid_hospital(hospital_id)
    try: return add_medicine(medicine_document(payload, hospital_id))
    except ValueError as exc: raise HTTPException(422, str(exc)) from exc
@router.put("/{medicine_id}")
def edit_inventory(hospital_id: str, medicine_id: str, payload: MedicineCreate, _=Depends(access)):
    try: document = medicine_document(payload, hospital_id); document.pop("hospital_id"); document.pop("created_at")
    except ValueError as exc: raise HTTPException(422, str(exc)) from exc
    try: updated = update_medicine(hospital_id, medicine_id, document)
    except InvalidId as exc: raise HTTPException(400, "Invalid medicine ID.") from exc
    if not updated: raise HTTPException(404, "Medicine not found.")
    return updated
@router.delete("/{medicine_id}", status_code=204)
def remove_inventory(hospital_id: str, medicine_id: str, _=Depends(access)):
    try: deleted = delete_medicine(hospital_id, medicine_id)
    except InvalidId as exc: raise HTTPException(400, "Invalid medicine ID.") from exc
    if not deleted: raise HTTPException(404, "Medicine not found.")
@router.post("/{medicine_id}/dispense")
def dispense_medicine(hospital_id: str, medicine_id: str, payload: DispenseRequest, _=Depends(access)):
    db = get_database()
    try: patient = db.patients.find_one({"_id": __import__('bson').ObjectId(payload.patient_id)})
    except Exception as exc: raise HTTPException(400, "Invalid patient ID.") from exc
    if not patient: raise HTTPException(404, "Patient not found.")
    if payload.appointment_id:
        try: appointment = db.appointments.find_one({"_id": __import__('bson').ObjectId(payload.appointment_id), "hospitalId": hospital_id, "patient_id": patient["_id"]})
        except Exception as exc: raise HTTPException(400, "Invalid appointment ID.") from exc
        if not appointment: raise HTTPException(404, "Appointment not found for this patient and hospital.")
    try: result = dispense(hospital_id, medicine_id, payload.patient_id, payload.quantity, payload.appointment_id)
    except InvalidId as exc: raise HTTPException(400, "Invalid medicine ID.") from exc
    if not result: raise HTTPException(409, "Insufficient stock or medicine not found.")
    return result

@router.get("/public")
def public_inventory(hospital_id: str):
    """Patient-facing: list available medicines (no auth required)."""
    valid_hospital(hospital_id)
    medicines = get_medicines(hospital_id)
    # Return only fields patients need
    return [{"id": m["id"], "name": m["name"], "generic_name": m.get("generic_name", ""), "price_per_unit": m["price_per_unit"], "quantity": m["quantity"], "category": m.get("category", ""), "unit": m.get("unit", ""), "sku": m.get("sku", ""), "description": m.get("description", "")} for m in medicines if m["quantity"] > 0]
