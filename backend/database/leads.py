from datetime import datetime, timezone
from typing import Any

from database.mongodb import get_database

LEADS_COLLECTION = "leads"


def get_leads_collection():
    return get_database()[LEADS_COLLECTION]


def create_lead(data: dict) -> dict[str, Any]:
    collection = get_leads_collection()
    document = {**data, "created_at": datetime.now(timezone.utc).isoformat()}
    result = collection.insert_one(document)
    return {"id": str(result.inserted_id), **data}
