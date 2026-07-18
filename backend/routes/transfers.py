from fastapi import APIRouter, HTTPException, Query, Header
from bson import ObjectId
from models.transfer import (
    TransferRequest,
    TransferResponseRequest,
    TransferEvent,
    TransferResponseEvent,
)
from database.transfers import (
    create_transfer,
    get_transfer_by_id,
    update_transfer_status,
    get_patient_by_id,
    get_all_patients,
    update_patient_hospital,
    get_transfers,
)
from realtime.connection_manager import manager
from routes.auth import current_hospital_user

router = APIRouter()


@router.post("/transfers")
async def post_transfer(transfer: TransferRequest):
    data = transfer.model_dump()
    saved = create_transfer(data)

    event = TransferEvent(
        transfer_id=saved["_id"],
        patient_id=saved["patient_id"],
        patient_name=saved["patient_name"],
        from_hospital=saved["from_hospital"],
        to_hospital=saved["to_hospital"],
        required_facility=saved["required_facility"],
    )
    await manager.broadcast(event.model_dump())
    return saved


@router.post("/transfers/{transfer_id}/respond")
async def respond_transfer(transfer_id: str, payload: TransferResponseRequest, authorization: str | None = Header(default=None)):
    transfer = get_transfer_by_id(transfer_id)
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    session = current_hospital_user(authorization)
    from database.hospitals import get_hospitals_collection
    hospital = get_hospitals_collection().find_one({"_id": ObjectId(session["hospital_id"])})
    if not hospital or transfer["to_hospital"] != hospital["name"]:
        raise HTTPException(status_code=403, detail="You can only respond to transfers sent to your hospital.")

    update_transfer_status(transfer_id, payload.status)

    if payload.status == "accepted":
        update_patient_hospital(transfer["patient_id"], transfer["to_hospital"])

    event = TransferResponseEvent(transfer_id=transfer_id, status=payload.status)
    await manager.broadcast(event.model_dump())
    return {"status": "success"}


@router.get("/patients")
async def list_patients():
    return get_all_patients()


@router.get("/transfers")
async def list_transfers(hospital: str | None = Query(default=None)):
    return get_transfers(hospital)


@router.get("/patients/{patient_id}")
async def get_patient(patient_id: str):
    patient = get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
