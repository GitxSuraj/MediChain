from bson import ObjectId

from routes.appointments import serialize


def test_appointment_serialization_converts_patient_object_id_without_mutating_document():
    appointment_id = ObjectId()
    patient_id = ObjectId()
    document = {"_id": appointment_id, "patient_id": patient_id, "status": "Pending"}

    result = serialize(document)

    assert result == {"id": str(appointment_id), "patient_id": str(patient_id), "status": "Pending"}
    assert document["_id"] == appointment_id
    assert document["patient_id"] == patient_id
