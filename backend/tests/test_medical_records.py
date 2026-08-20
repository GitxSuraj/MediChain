from datetime import date

from pydantic import ValidationError

from routes.medical_records import VisitRecord, serialize


def test_visit_record_requires_an_appointment_id():
    try:
        VisitRecord(date=date.today(), diagnosis="Diagnosis", doctor_name="Doctor", hospital_name="Hospital")
    except ValidationError as error:
        assert error.errors()[0]["loc"] == ("appointment_id",)
    else:
        raise AssertionError("Visit record accepted without an appointment ID")


def test_history_serialization_matches_the_public_contract():
    record = {
        "_id": "internal", "patient_id": "patient", "hospital_id": "hospital", "appointment_id": "appointment",
        "date": date(2026, 8, 20), "diagnosis": "Viral fever", "prescription": "Rest", "doctor_name": "Dr. Sharma", "hospital_name": "Apollo", "notes": "Follow up",
    }

    assert serialize(record) == {
        "date": "2026-08-20", "diagnosis": "Viral fever", "prescription": "Rest",
        "doctor_name": "Dr. Sharma", "hospital_name": "Apollo", "notes": "Follow up",
    }


def test_history_serialization_accepts_a_database_date_string():
    assert serialize({"date": "2026-08-20", "diagnosis": "D", "doctor_name": "Dr", "hospital_name": "H"})["date"] == "2026-08-20"
