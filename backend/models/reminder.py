from typing import Literal

from pydantic import BaseModel, Field

Day = Literal["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


class ReminderBase(BaseModel):
    medicine_name: str = Field(min_length=1)
    dosage: str = Field(min_length=1)
    times: list[str] = Field(min_length=1)  # "HH:MM" 24h strings
    days: list[Day] = Field(min_length=1)
    is_active: bool = True


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    medicine_name: str | None = None
    dosage: str | None = None
    times: list[str] | None = None
    days: list[Day] | None = None
    is_active: bool | None = None


class ReminderResponse(ReminderBase):
    id: str
    patient_id: str
    created_at: str
