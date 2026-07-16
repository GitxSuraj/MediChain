from fastapi import APIRouter, HTTPException
from models.transfer import (
    TransferRequest,
    TransferResponseRequest,
    TransferEvent,
    TransferResponseEvent,
)
from database.transfers import create_transfer, update_transfer_status, get_patient_by_id
from realtime.connection_manager import manager

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
async def respond_transfer(transfer_id: str, payload: TransferResponseRequest):
    update_transfer_status(transfer_id, payload.status)
    event = TransferResponseEvent(transfer_id=transfer_id, status=payload.status)
    await manager.broadcast(event.model_dump())
    return {"status": "success"}


@router.get("/patients/{patient_id}")
async def get_patient(patient_id: str):
    patient = get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
