from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    patient_id: str
    appointment_id: str
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=1000)


class ReviewResponse(BaseModel):
    id: str
    hospital_id: str
    patient_id: str
    appointment_id: str
    rating: int
    comment: str
    created_at: str


class HospitalRatingSummary(BaseModel):
    hospital_id: str
    average_rating: float
    review_count: int
    reviews: list[ReviewResponse]
