from datetime import date, datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


class MedicineCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    generic_name: str = Field(min_length=1, max_length=200)
    quantity: int = Field(ge=0)
    unit: str = Field(min_length=1, max_length=40)
    expiry_date: date
    reorder_threshold: int = Field(ge=0)
    price_per_unit: float = Field(ge=0)
    category: str = Field(min_length=1, max_length=100)


class Medicine(MedicineCreate):
    id: Optional[str] = None
    hospital_id: str


class DispenseRequest(BaseModel):
    patient_id: str
    quantity: int = Field(gt=0)
    appointment_id: str | None = None


def medicine_document(payload: MedicineCreate, hospital_id: str) -> dict:
    document = payload.model_dump()
    if document["expiry_date"] <= date.today():
        raise ValueError("Expiry date must be in the future.")
    # BSON supports datetimes but not ``datetime.date`` values.
    document["expiry_date"] = document["expiry_date"].isoformat()
    document.update({"hospital_id": hospital_id, "created_at": datetime.now(timezone.utc)})
    return document
