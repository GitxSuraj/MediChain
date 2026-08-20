from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field

class OrderItemRequest(BaseModel):
    medicine_id: str
    quantity: int = Field(gt=0)

class OrderItem(BaseModel):
    medicine_id: str
    name: str
    generic_name: str = ""
    sku: str = ""
    quantity: int = Field(gt=0)
    unit_price: float = Field(ge=0)
    total: float = Field(ge=0)

class OrderCreateRequest(BaseModel):
    hospital_id: str
    items: list[OrderItemRequest] = Field(min_length=1)

class Order(BaseModel):
    id: str | None = None
    patient_id: str
    hospital_id: str
    items: list[OrderItem]
    subtotal: float = Field(ge=0)
    tax: float = Field(ge=0)
    total: float = Field(ge=0)
    status: Literal["pending", "paid", "fulfilled", "cancelled"] = "pending"
    razorpay_order_id: str | None = None
    razorpay_payment_id: str | None = None
    created_at: datetime | None = None

class VerifyOrderPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
