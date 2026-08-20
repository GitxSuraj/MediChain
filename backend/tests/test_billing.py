from types import SimpleNamespace

import pytest
from bson import ObjectId
from fastapi import HTTPException

from models.bill import BillGenerateRequest
from routes import billing


class Collection:
    def __init__(self, documents):
        self.documents = documents

    def find_one(self, query):
        for document in self.documents:
            if all(document.get(key) == value for key, value in query.items()):
                return document
        return None


def test_bill_generation_rejects_duplicate_appointment(monkeypatch):
    appointment_id = ObjectId()
    db = SimpleNamespace(
        appointments=Collection([{"_id": appointment_id, "hospitalId": "hospital", "patient_id": ObjectId()}]),
        bills=Collection([{"appointment_id": str(appointment_id), "hospital_id": "hospital"}]),
    )
    monkeypatch.setattr(billing, "get_database", lambda: db)

    with pytest.raises(HTTPException) as error:
        billing.generate_bill(BillGenerateRequest(appointment_id=str(appointment_id)), {"hospital_id": "hospital", "role": "super_admin"})

    assert error.value.status_code == 409


def test_hospital_staff_can_read_its_hospital_bill(monkeypatch):
    bill_id = ObjectId()
    staff_id = ObjectId()
    db = SimpleNamespace(
        bills=Collection([{"_id": bill_id, "hospital_id": "hospital", "patient_id": str(ObjectId())}]),
        sessions=Collection([{"token": "staff-token", "role": "hospital_staff", "staff_id": staff_id}]),
        hospital_staff=Collection([{"_id": staff_id, "hospital_id": "hospital"}]),
    )
    monkeypatch.setattr(billing, "get_database", lambda: db)

    result = billing.get_bill(str(bill_id), "Bearer staff-token")

    assert result["id"] == str(bill_id)


def test_billing_requires_explicit_permission_for_non_admin():
    with pytest.raises(HTTPException) as error:
        billing.require_billing_access({"role": "staff", "permissions": []})

    assert error.value.status_code == 403
