import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

from database.leads import create_lead
from database.mongodb import MONGODB_UNAVAILABLE_MESSAGE

router = APIRouter(tags=["leads"])

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class LeadCreate(BaseModel):
    name: str = Field(min_length=1)
    hospital_name: str = Field(min_length=1)
    phone: str = Field(min_length=6)
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if not EMAIL_PATTERN.match(value):
            raise ValueError("Invalid email address.")
        return value


@router.post("/leads")
def post_lead(payload: LeadCreate):
    try:
        return create_lead(payload.model_dump())
    except ServerSelectionTimeoutError as exc:
        raise HTTPException(status_code=503, detail=MONGODB_UNAVAILABLE_MESSAGE) from exc
    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"MongoDB insert failed: {exc}") from exc
