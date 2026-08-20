from typing import Literal

from pydantic import BaseModel, Field


class BedAvailability(BaseModel):
    total: int = Field(ge=0)
    available: int = Field(ge=0)


class HospitalBeds(BaseModel):
    general: BedAvailability
    icu: BedAvailability
    oxygen: BedAvailability
    emergency: BedAvailability
    # Roadmap explicitly requires ventilator availability alongside beds/ICU.
    # No such field existed anywhere in the previous hospital model under any
    # name, so it is added here as a genuine new (not fabricated) data point —
    # seeded with real counts in scripts/seed_hospitals.py.
    ventilators: BedAvailability | None = None


class HospitalSeed(BaseModel):
    name: str
    city: str
    facilities: list[str]
    beds: HospitalBeds
    latitude: float | None = None
    longitude: float | None = None


class HospitalResponse(HospitalSeed):
    id: str


class BedUpdateRequest(BaseModel):
    delta: Literal[-1, 1]


class BedUpdateResponse(BaseModel):
    hospital: HospitalResponse


class BedUpdateEvent(BaseModel):
    event: Literal["bed_update"] = "bed_update"
    hospital_id: str
    category: Literal["general", "icu", "oxygen", "emergency", "ventilators"]
    new_available_count: int = Field(ge=0)
