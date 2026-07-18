import hashlib
import os
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId

from database.mongodb import get_database

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    phone: str = ""
    bloodGroup: str = ""
    dateOfBirth: str = ""
    gender: str = "Other"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class HospitalLoginRequest(BaseModel):
    hospital_id: str
    password: str = Field(min_length=6, max_length=128)


def _hash(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()


def _public(patient: dict) -> dict:
    return {"id": str(patient["_id"]), "name": patient["name"], "email": patient["email"],
            "phone": patient.get("phone", ""), "bloodGroup": patient.get("bloodGroup", ""),
            "abhaNumber": patient.get("abhaNumber", ""), "dateOfBirth": patient.get("dateOfBirth", ""),
            "gender": patient.get("gender", "Other")}


def _profile(patient: dict) -> dict:
    result = _public(patient)
    result.update({"allergies": patient.get("allergies", []), "medicalConditions": patient.get("medicalConditions", []),
                   "emergencyContact": patient.get("emergencyContact", {"name": "", "relation": "", "phone": ""})})
    return result


def current_patient(authorization: str | None) -> dict:
    token = (authorization or "").removeprefix("Bearer ").strip()
    session = get_database().sessions.find_one({"token": token}) if token else None
    if not session:
        raise HTTPException(401, "Please sign in to continue.")
    patient = get_database().patients.find_one({"_id": session["patient_id"]})
    if not patient:
        raise HTTPException(401, "Patient account was not found.")
    return patient


def current_hospital_user(authorization: str | None) -> dict:
    token = (authorization or "").removeprefix("Bearer ").strip()
    session = get_database().sessions.find_one({"token": token, "role": "hospital"}) if token else None
    if not session:
        raise HTTPException(401, "Hospital sign-in is required.")
    return session


@router.post("/register")
def register(payload: RegisterRequest):
    db = get_database()
    if db.patients.find_one({"email": payload.email.lower()}):
        raise HTTPException(409, "An account with this email already exists.")
    salt = secrets.token_hex(16)
    patient = payload.model_dump(exclude={"password"})
    patient.update({"email": payload.email.lower(), "password_hash": _hash(payload.password, salt), "password_salt": salt,
                    "abhaNumber": f"MC-{secrets.token_hex(5).upper()}", "createdAt": datetime.now(timezone.utc),
                    "current_hospital": "Unassigned"})
    result = db.patients.insert_one(patient)
    patient["_id"] = result.inserted_id
    token = secrets.token_urlsafe(32)
    db.sessions.insert_one({"token": token, "patient_id": result.inserted_id, "createdAt": datetime.now(timezone.utc)})
    return {"user": _public(patient), "token": token}


@router.post("/login")
def login(payload: LoginRequest):
    patient = get_database().patients.find_one({"email": payload.email.lower()})
    if not patient or not secrets.compare_digest(_hash(payload.password, patient["password_salt"]), patient["password_hash"]):
        raise HTTPException(401, "Incorrect email or password.")
    token = secrets.token_urlsafe(32)
    get_database().sessions.insert_one({"token": token, "patient_id": patient["_id"], "createdAt": datetime.now(timezone.utc)})
    return {"user": _public(patient), "token": token}


@router.post("/hospital/login")
def hospital_login(payload: HospitalLoginRequest):
    db = get_database()
    account = db.hospital_users.find_one({"hospital_id": payload.hospital_id})
    # Backward-compatible bootstrap for databases seeded before hospital logins
    # were introduced. It only creates the documented demo account when the
    # caller supplies the documented demo password.
    if not account and payload.password == "Hospital@123":
        try:
            hospital_object_id = ObjectId(payload.hospital_id)
        except Exception as exc:
            raise HTTPException(400, "Invalid hospital selection.") from exc
        hospital = db.hospitals.find_one({"_id": hospital_object_id})
        if hospital:
            salt = secrets.token_hex(16)
            account = {"hospital_id": payload.hospital_id, "hospital_object_id": hospital_object_id,
                       "password_salt": salt, "password_hash": _hash(payload.password, salt)}
            db.hospital_users.update_one({"hospital_id": payload.hospital_id}, {"$setOnInsert": account}, upsert=True)
            account = db.hospital_users.find_one({"hospital_id": payload.hospital_id})
    if not account or not secrets.compare_digest(_hash(payload.password, account["password_salt"]), account["password_hash"]):
        raise HTTPException(401, "Incorrect hospital credentials.")
    hospital = db.hospitals.find_one({"_id": account["hospital_object_id"]})
    if not hospital:
        raise HTTPException(404, "Hospital account is not configured.")
    token = secrets.token_urlsafe(32)
    db.sessions.insert_one({"token": token, "role": "hospital", "hospital_id": payload.hospital_id, "createdAt": datetime.now(timezone.utc)})
    return {"token": token, "hospital": {"id": payload.hospital_id, "name": hospital["name"], "city": hospital["city"]}}


@router.get("/me")
def me(authorization: str | None = Header(default=None)):
    return _public(current_patient(authorization))


class ProfileUpdateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = ""
    bloodGroup: str = ""
    abhaNumber: str = ""
    dateOfBirth: str = ""
    gender: str = "Other"
    allergies: list[str] = []
    medicalConditions: list[str] = []
    emergencyContact: dict = {"name": "", "relation": "", "phone": ""}


@router.get("/profile")
def get_profile(authorization: str | None = Header(default=None)):
    return _profile(current_patient(authorization))


@router.put("/profile")
def update_profile(payload: ProfileUpdateRequest, authorization: str | None = Header(default=None)):
    patient = current_patient(authorization)
    db = get_database()
    duplicate = db.patients.find_one({"email": payload.email.lower(), "_id": {"$ne": patient["_id"]}})
    if duplicate:
        raise HTTPException(409, "Another patient account already uses this email.")
    updates = payload.model_dump()
    updates["email"] = updates["email"].lower()
    db.patients.update_one({"_id": patient["_id"]}, {"$set": updates})
    patient.update(updates)
    return _profile(patient)
