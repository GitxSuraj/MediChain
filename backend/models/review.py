from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class Review(BaseModel):
    id: Optional[str] = None
    hospital_id: str
    patient_id: str
    appointment_id: str   # proves patient actually visited
    rating: int           # 1-5
    comment: str
    created_at: Optional[datetime] = None
