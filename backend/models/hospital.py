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


class HospitalSeed(BaseModel):
    name: str
    city: str
    facilities: list[str]
    beds: HospitalBeds


class HospitalResponse(HospitalSeed):
    id: str


class BedUpdateRequest(BaseModel):
    delta: Literal[-1, 1]


class BedUpdateResponse(BaseModel):
    hospital: HospitalResponse
