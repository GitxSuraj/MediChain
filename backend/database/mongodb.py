import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database


ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
DEFAULT_MONGO_URI = "mongodb://localhost:27017"
DEFAULT_DATABASE_NAME = "hospital_network"

load_dotenv(dotenv_path=ENV_PATH)


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
    get_mongo_client().admin.command("ping")
    return {
        "status": "connected",
        "database": get_database_name(),
    }


def close_mongo_connection() -> None:
    get_mongo_client().close()
    get_mongo_client.cache_clear()


if __name__ == "__main__":
    result = ping_database()
    print(f"MongoDB {result['status']} to database '{result['database']}'")
