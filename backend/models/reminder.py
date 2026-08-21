from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class Reminder(BaseModel):
    id: Optional[str] = None
    patient_id: str
    medicine_name: str
    dosage: str           # e.g. "500mg"
    times: list[str]      # 24h format e.g. ["08:00", "14:00", "21:00"]
    days: list[str]       # e.g. ["Mon","Tue"] or ["daily"]
    is_active: bool = True
    created_at: Optional[datetime] = None
