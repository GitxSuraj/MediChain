from fastapi import APIRouter, HTTPException
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

from database.mongodb import MONGODB_UNAVAILABLE_MESSAGE
from database.reminders import (
    InvalidReminderIdError,
    ReminderNotFoundError,
    create_reminder,
    delete_reminder,
    list_reminders,
    update_reminder,
)
from models.reminder import ReminderCreate, ReminderResponse, ReminderUpdate

router = APIRouter(tags=["reminders"])


@router.post("/patients/{patient_id}/reminders", response_model=ReminderResponse)
def post_reminder(patient_id: str, payload: ReminderCreate):
    try:
        return create_reminder(patient_id, payload.model_dump())
    except ServerSelectionTimeoutError as exc:
        raise HTTPException(status_code=503, detail=MONGODB_UNAVAILABLE_MESSAGE) from exc
    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"MongoDB insert failed: {exc}") from exc


@router.get("/patients/{patient_id}/reminders", response_model=list[ReminderResponse])
def get_reminders(patient_id: str):
    try:
        return list_reminders(patient_id)
    except ServerSelectionTimeoutError as exc:
        raise HTTPException(status_code=503, detail=MONGODB_UNAVAILABLE_MESSAGE) from exc
    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"MongoDB query failed: {exc}") from exc


@router.put("/patients/{patient_id}/reminders/{rem_id}", response_model=ReminderResponse)
def put_reminder(patient_id: str, rem_id: str, payload: ReminderUpdate):
    try:
        return update_reminder(patient_id, rem_id, payload.model_dump())
    except InvalidReminderIdError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ReminderNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ServerSelectionTimeoutError as exc:
        raise HTTPException(status_code=503, detail=MONGODB_UNAVAILABLE_MESSAGE) from exc
    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"MongoDB update failed: {exc}") from exc


@router.delete("/patients/{patient_id}/reminders/{rem_id}")
def remove_reminder(patient_id: str, rem_id: str):
    try:
        delete_reminder(patient_id, rem_id)
    except InvalidReminderIdError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ReminderNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ServerSelectionTimeoutError as exc:
        raise HTTPException(status_code=503, detail=MONGODB_UNAVAILABLE_MESSAGE) from exc
    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"MongoDB delete failed: {exc}") from exc

    return {"status": "deleted", "id": rem_id}
