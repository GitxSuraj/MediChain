from datetime import date, timedelta

from models.medicine import MedicineCreate, medicine_document


def test_medicine_document_serializes_expiry_date_for_bson():
    payload = MedicineCreate(
        name="Medicine", generic_name="Generic", quantity=1, unit="tablet",
        expiry_date=date.today() + timedelta(days=1), reorder_threshold=1,
        price_per_unit=10, category="Test",
    )

    assert medicine_document(payload, "hospital")["expiry_date"] == payload.expiry_date.isoformat()
