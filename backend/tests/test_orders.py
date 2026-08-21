from models.order import OrderCreateRequest, OrderItem, OrderItemRequest, Order


def test_order_model():
    req = OrderCreateRequest(
        hospital_id="hosp_123",
        items=[OrderItemRequest(medicine_id="med_1", quantity=2)]
    )
    assert req.hospital_id == "hosp_123"
    assert len(req.items) == 1
    assert req.items[0].quantity == 2

    item = OrderItem(
        medicine_id="med_1",
        name="Paracetamol 650mg",
        sku="MED-PCM-650",
        quantity=2,
        unit_price=30.0,
        total=60.0
    )
    assert item.total == 60.0
    assert item.sku == "MED-PCM-650"
