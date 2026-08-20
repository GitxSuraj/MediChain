import pytest
from fastapi import HTTPException
from pymongo.errors import ConfigurationError

from routes import hospitals
from database.mongodb import MONGODB_UNAVAILABLE_MESSAGE


def test_hospital_database_errors_do_not_expose_connection_details(monkeypatch):
    monkeypatch.setattr(
        hospitals,
        "list_hospitals",
        lambda **_: (_ for _ in ()).throw(ConfigurationError("internal DNS detail")),
    )

    with pytest.raises(HTTPException) as error:
        hospitals.get_hospitals()

    assert error.value.status_code == 503
    assert error.value.detail == MONGODB_UNAVAILABLE_MESSAGE
