import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError


ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
DEFAULT_MONGO_URI = "mongodb://localhost:27017"
DEFAULT_DATABASE_NAME = "medichain"
MONGODB_UNAVAILABLE_MESSAGE = (
    "MongoDB connection requires a running MongoDB instance. "
    "Check MONGO_URI and start MongoDB before retrying."
)

load_dotenv(dotenv_path=ENV_PATH)


class MongoDBConnectionError(ConnectionError):
    """Raised when the configured MongoDB instance cannot be reached."""


def get_mongo_uri() -> str:
    return os.getenv("MONGO_URI", DEFAULT_MONGO_URI)


def get_database_name() -> str:
    return os.getenv("DATABASE_NAME", DEFAULT_DATABASE_NAME)


@lru_cache
def get_mongo_client() -> MongoClient:
    return MongoClient(get_mongo_uri(), serverSelectionTimeoutMS=5000)


def get_database() -> Database:
    return get_mongo_client()[get_database_name()]


def ping_database() -> dict:
    try:
        get_mongo_client().admin.command("ping")
    except ServerSelectionTimeoutError as exc:
        raise MongoDBConnectionError(MONGODB_UNAVAILABLE_MESSAGE) from exc
    except PyMongoError as exc:
        raise MongoDBConnectionError(f"MongoDB ping failed: {exc}") from exc

    return {
        "status": "connected",
        "database": get_database_name(),
    }


def close_mongo_connection() -> None:
    get_mongo_client().close()
    get_mongo_client.cache_clear()


if __name__ == "__main__":
    try:
        result = ping_database()
    except MongoDBConnectionError as exc:
        print(exc)
        raise SystemExit(1) from exc

    print(f"MongoDB {result['status']} to database '{result['database']}'")
