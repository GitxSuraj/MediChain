from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class HospitalUser(BaseModel):
    id: Optional[str] = None
    hospital_id: str
    name: str
    email: str
    password_hash: str
    role: str           # "super_admin" | "doctor" | "nurse" | "receptionist"
    permissions: List[str]  # ["manage_beds", "manage_transfers", "view_patients", ...]
    created_at: datetime = datetime.utcnow()
