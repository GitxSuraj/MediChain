from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Payment(BaseModel):
    id: Optional[str] = None
    appointment_id: str
    patient_id: str
    hospital_id: str
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    amount: int       # in paise (₹500 = 50000 paise)
    status: str       # "created" | "paid" | "failed" | "refunded"
    created_at: datetime = datetime.utcnow()
