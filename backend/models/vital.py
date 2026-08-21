from datetime import datetime, timezone
from typing import Optional, Literal
from pydantic import BaseModel, Field

VITAL_TYPES = ["blood_sugar", "blood_pressure", "weight", "heart_rate", "temperature", "spo2"]
VitalType = Literal["blood_sugar", "blood_pressure", "weight", "heart_rate", "temperature", "spo2"]

class VitalCreate(BaseModel):
    type: VitalType
    value: dict  # Flexible: {"level": 95, "fasting": true} for blood_sugar, {"systolic": 120, "diastolic": 80} for BP, {"value": 72} for heart_rate etc.
    unit: str = Field(default="", max_length=20)  # "mg/dL", "mmHg", "kg", "bpm", "°F", "%"
    notes: str = Field(default="", max_length=500)
    recorded_at: Optional[str] = None  # ISO date string, defaults to now

class VitalUpdate(BaseModel):
    value: Optional[dict] = None
    unit: Optional[str] = None
    notes: Optional[str] = None
    recorded_at: Optional[str] = None

def vital_document(payload: VitalCreate, patient_id: str) -> dict:
    doc = payload.model_dump()
    doc["patient_id"] = patient_id
    doc["recorded_at"] = payload.recorded_at or datetime.now(timezone.utc).isoformat()
    doc["created_at"] = datetime.now(timezone.utc)
    return doc
