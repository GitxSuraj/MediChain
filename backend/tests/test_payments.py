import hashlib
import hmac
import json
from types import SimpleNamespace

import pytest
from bson import ObjectId
from fastapi import HTTPException

from routes import payments


class Collection:
    def __init__(self, documents=()):
        self.documents = [dict(document) for document in documents]

    def _matches(self, document, query):
        for key, expected in query.items():
            actual = document.get(key)
            if isinstance(expected, dict):
                if "$in" in expected and actual not in expected["$in"]:
                    return False
                if "$ne" in expected and actual == expected["$ne"]:
                    return False
            elif actual != expected:
                return False
        return True

    def find_one(self, query, sort=None):
        matches = [document for document in self.documents if self._matches(document, query)]
        if sort:
            key, direction = sort[0]
            matches.sort(key=lambda item: item.get(key), reverse=direction < 0)
        return matches[0] if matches else None

    def insert_one(self, document):
        document = dict(document)
        document.setdefault("_id", ObjectId())
        self.documents.append(document)
        return SimpleNamespace(inserted_id=document["_id"])

    def update_one(self, query, update):
        document = self.find_one(query)
        if not document:
            return SimpleNamespace(modified_count=0)
        document.update(update["$set"])
        return SimpleNamespace(modified_count=1)

    def create_index(self, *args, **kwargs):
        return kwargs.get("name", "index")


class Database:
    def __init__(self, patient, appointment, hospital, payment=None):
        self.appointments = Collection([appointment])
        self.hospitals = Collection([hospital])
        self.payments = Collection([payment] if payment else [])
        self.patients = Collection([patient])


@pytest.fixture
def payment_context(monkeypatch):
    patient_id = ObjectId()
    hospital_id = ObjectId()
    appointment_id = ObjectId()
    patient = {"_id": patient_id, "name": "Patient"}
    appointment = {"_id": appointment_id, "patient_id": patient_id, "hospitalId": str(hospital_id), "status": "Pending"}
    hospital = {"_id": hospital_id, "consultation_fee_paise": 75_000}
    db = Database(patient, appointment, hospital)
    monkeypatch.setattr(payments, "get_database", lambda: db)
    monkeypatch.setattr(payments, "current_patient", lambda _: patient)
    monkeypatch.setattr(payments, "gateway_credentials", lambda: ("rzp_test_public", "test-secret"))
    monkeypatch.setattr(payments, "ensure_payment_indexes", lambda: None)
    monkeypatch.setattr(payments, "create_payment_order", lambda document: db.payments.insert_one(document))
    monkeypatch.setattr(payments, "get_open_payment_for_appointment", lambda appointment_id, patient_id: db.payments.find_one({"appointment_id": appointment_id, "patient_id": patient_id, "status": "created"}))
    monkeypatch.setattr(payments, "get_payment_by_order_id", lambda order_id: db.payments.find_one({"razorpay_order_id": order_id}))
    return db, patient, appointment_id


def test_create_order_derives_amount_and_hospital_from_appointment(payment_context, monkeypatch):
    db, _, appointment_id = payment_context

    class Response:
        def read(self):
            return json.dumps({"id": "order_server_authoritative"}).encode()

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

    monkeypatch.setattr(payments.urllib.request, "urlopen", lambda request: Response())
    result = payments.create_order(
        payments.CreateOrderRequest(appointment_id=str(appointment_id), amount=1, hospital_id=str(ObjectId())),
        "Bearer patient-token",
    )

    assert result["amount"] == 75_000
    saved = db.payments.documents[0]
    assert saved["amount"] == 75_000
    assert saved["hospital_id"] == db.appointments.documents[0]["hospitalId"]


def test_invalid_signature_does_not_change_appointment_or_payment(payment_context):
    db, patient, appointment_id = payment_context
    db.payments.insert_one({
        "appointment_id": str(appointment_id), "patient_id": str(patient["_id"]),
        "hospital_id": db.appointments.documents[0]["hospitalId"], "razorpay_order_id": "order_1", "status": "created",
    })

    with pytest.raises(HTTPException) as error:
        payments.verify_payment(payments.VerifyPaymentRequest(razorpay_order_id="order_1", razorpay_payment_id="pay_1", razorpay_signature="bad"), "Bearer patient-token")

    assert error.value.status_code == 400
    assert db.payments.documents[0]["status"] == "created"
    assert db.appointments.documents[0].get("payment_status") is None


def test_valid_verification_is_idempotent_and_uses_appointment_status_convention(payment_context):
    db, patient, appointment_id = payment_context
    db.payments.insert_one({
        "appointment_id": str(appointment_id), "patient_id": str(patient["_id"]),
        "hospital_id": db.appointments.documents[0]["hospitalId"], "razorpay_order_id": "order_1", "status": "created",
    })
    signature = hmac.new(b"test-secret", b"order_1|pay_1", hashlib.sha256).hexdigest()
    request = payments.VerifyPaymentRequest(razorpay_order_id="order_1", razorpay_payment_id="pay_1", razorpay_signature=signature)

    assert payments.verify_payment(request, "Bearer patient-token") == {"status": "success"}
    assert db.payments.documents[0]["status"] == "paid"
    assert db.appointments.documents[0]["payment_status"] == "paid"
    assert db.appointments.documents[0]["status"] == "Confirmed"
    assert payments.verify_payment(request, "Bearer patient-token") == {"status": "success"}


def test_payment_order_is_not_visible_to_another_patient(payment_context, monkeypatch):
    db, patient, appointment_id = payment_context
    db.payments.insert_one({
        "appointment_id": str(appointment_id), "patient_id": str(patient["_id"]),
        "hospital_id": db.appointments.documents[0]["hospitalId"], "razorpay_order_id": "order_1", "status": "created",
    })
    other_patient = {"_id": ObjectId()}
    monkeypatch.setattr(payments, "current_patient", lambda _: other_patient)
    signature = hmac.new(b"test-secret", b"order_1|pay_1", hashlib.sha256).hexdigest()

    with pytest.raises(HTTPException) as error:
        payments.verify_payment(payments.VerifyPaymentRequest(razorpay_order_id="order_1", razorpay_payment_id="pay_1", razorpay_signature=signature), "Bearer other-token")

    assert error.value.status_code == 404
    assert db.payments.documents[0]["status"] == "created"
