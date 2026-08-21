from models.vital import VitalCreate, VitalUpdate, vital_document


def test_vital_document_creation():
    payload = VitalCreate(
        type="blood_pressure",
        value={"systolic": 120, "diastolic": 80},
        unit="mmHg",
        notes="Morning check"
    )
    doc = vital_document(payload, "patient_123")
    assert doc["patient_id"] == "patient_123"
    assert doc["type"] == "blood_pressure"
    assert doc["value"]["systolic"] == 120
    assert doc["value"]["diastolic"] == 80
    assert doc["unit"] == "mmHg"
    assert "created_at" in doc
    assert "recorded_at" in doc


def test_blood_sugar_vital():
    payload = VitalCreate(
        type="blood_sugar",
        value={"level": 95, "fasting": True},
        unit="mg/dL"
    )
    doc = vital_document(payload, "patient_456")
    assert doc["type"] == "blood_sugar"
    assert doc["value"]["level"] == 95
    assert doc["value"]["fasting"] is True
