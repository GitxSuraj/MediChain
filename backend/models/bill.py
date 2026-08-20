from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


class BillItem(BaseModel):
    description: str = Field(min_length=1)
    quantity: int = Field(gt=0)
    unit_price: float = Field(ge=0)
    total: float = Field(ge=0)


class Bill(BaseModel):
    id: str | None = None
    hospital_id: str
    patient_id: str
    appointment_id: str
    items: list[BillItem]
    subtotal: float = Field(ge=0)
    tax: float = Field(ge=0)
    total: float = Field(ge=0)
    status: Literal["draft", "issued", "paid"] = "issued"
    created_at: datetime


class BillGenerateRequest(BaseModel):
    appointment_id: str
    manual_items: list[BillItem] = []
    tax_rate: float = Field(default=0, ge=0, le=100)


class BillStatusRequest(BaseModel):
    status: Literal["draft", "issued", "paid"]
