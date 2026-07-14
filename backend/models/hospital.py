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
