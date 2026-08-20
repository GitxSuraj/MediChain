import hashlib
import secrets
from datetime import datetime, timezone
from database.mongodb import get_database

def _hash(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()

def verify_password(plain: str, hashed: str, salt: str) -> bool:
    return secrets.compare_digest(_hash(plain, salt), hashed)

def create_hospital_user(user_data: dict) -> dict:
    db = get_database()
    salt = secrets.token_hex(16)
    password = user_data.pop("password")
    user_data["password_salt"] = salt
    user_data["password_hash"] = _hash(password, salt)
    user_data["created_at"] = datetime.now(timezone.utc)
    
    result = db.hospital_staff.insert_one(user_data)
    user_data["_id"] = str(result.inserted_id)
    return user_data

def get_hospital_user_by_email(email: str) -> dict:
    db = get_database()
    return db.hospital_staff.find_one({"email": email.lower()})
