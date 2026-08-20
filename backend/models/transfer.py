from typing import Literal
from pydantic import BaseModel


class TransferRequest(BaseModel):
    patient_id: str
    patient_name: str
    from_hospital: str
    to_hospital: str
    required_facility: str


class TransferResponseRequest(BaseModel):
    status: Literal["accepted", "declined"]


class TransferEvent(BaseModel):
    event: Literal["transfer_request"] = "transfer_request"
    transfer_id: str
    patient_id: str
    patient_name: str
    from_hospital: str
    to_hospital: str
    required_facility: str


class TransferResponseEvent(BaseModel):
    event: Literal["transfer_response"] = "transfer_response"
    transfer_id: str
    status: str
