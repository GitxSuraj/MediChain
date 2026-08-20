import pytest
from fastapi import HTTPException

from routes.inventory import access


def test_inventory_rejects_another_hospitals_staff():
    with pytest.raises(HTTPException) as error:
        access("hospital-a", {"hospital_id": "hospital-b", "role": "super_admin"})

    assert error.value.status_code == 403


def test_inventory_requires_explicit_permission_for_non_admin():
    with pytest.raises(HTTPException) as error:
        access("hospital-a", {"hospital_id": "hospital-a", "role": "staff", "permissions": []})

    assert error.value.status_code == 403
