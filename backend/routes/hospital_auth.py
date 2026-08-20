from fastapi import APIRouter, Header, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
import secrets
from datetime import datetime, timezone
from bson import ObjectId

from database.mongodb import get_database
from database.hospital_users import create_hospital_user, get_hospital_user_by_email, verify_password

router = APIRouter(prefix="/hospital-auth", tags=["hospital-auth"])

class StaffSignupRequest(BaseModel):
    hospital_id: str
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: str
    permissions: List[str]

class StaffLoginRequest(BaseModel):
    email: EmailStr
    password: str

def get_current_staff(authorization: str | None = Header(default=None)):
    token = (authorization or "").removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(401, "Staff sign-in is required.")
    db = get_database()
    session = db.sessions.find_one({"token": token})
    if not session:
        raise HTTPException(401, "Staff sign-in is required.")
    
    if session.get("role") == "hospital_staff":
        staff = db.hospital_staff.find_one({"_id": session.get("staff_id")})
        if not staff:
            raise HTTPException(401, "Staff account was not found.")
        return staff
    elif session.get("role") == "hospital":
        hospital = db.hospitals.find_one({"_id": ObjectId(session["hospital_id"])})
        return {
            "_id": session.get("hospital_id"),
            "hospital_id": session.get("hospital_id"),
            "name": hospital.get("name", "Hospital Admin") if hospital else "Hospital Admin",
            "email": "admin@hospital.com",
            "role": "super_admin",
            "permissions": [
                "manage_beds", "manage_transfers", "view_patients",
                "assign_doctors", "manage_inventory", "manage_billing"
            ]
        }
    raise HTTPException(401, "Staff sign-in is required.")

@router.post("/signup")
def signup(payload: StaffSignupRequest, admin: dict = Depends(get_current_staff)):
    if admin.get("role") != "super_admin":
        raise HTTPException(403, "Only super admin can create staff accounts.")
        
    if get_hospital_user_by_email(payload.email):
        raise HTTPException(409, "Account with this email already exists.")
    
    user_data = payload.model_dump()
    user_data["email"] = user_data["email"].lower()
    
    staff = create_hospital_user(user_data)
    staff["_id"] = str(staff["_id"])
    staff.pop("password_hash", None)
    staff.pop("password_salt", None)
    return staff

@router.post("/login")
def login(payload: StaffLoginRequest):
    staff = get_hospital_user_by_email(payload.email)
    if not staff or not verify_password(payload.password, staff["password_hash"], staff["password_salt"]):
        raise HTTPException(401, "Incorrect email or password.")
    
    token = secrets.token_urlsafe(32)
    get_database().sessions.insert_one({
        "token": token,
        "role": "hospital_staff",
        "staff_id": staff["_id"],
        "createdAt": datetime.now(timezone.utc)
    })
    
    staff["_id"] = str(staff["_id"])
    staff.pop("password_hash", None)
    staff.pop("password_salt", None)
    return {"user": staff, "token": token}

@router.get("/me")
def me(staff: dict = Depends(get_current_staff)):
    staff["_id"] = str(staff["_id"])
    staff.pop("password_hash", None)
    staff.pop("password_salt", None)
    return staff

class PermissionUpdateRequest(BaseModel):
    permissions: List[str]

@router.get("/staff")
def list_staff(staff: dict = Depends(get_current_staff)):
    if staff.get("role") != "super_admin":
        raise HTTPException(403, "Only super admin can view staff list.")
    
    db = get_database()
    staff_list = list(db.hospital_staff.find({"hospital_id": staff["hospital_id"]}))
    
    for s in staff_list:
        s["_id"] = str(s["_id"])
        s.pop("password_hash", None)
        s.pop("password_salt", None)
        
    return staff_list

@router.post("/{staff_id}/permissions")
def update_permissions(staff_id: str, payload: PermissionUpdateRequest, admin: dict = Depends(get_current_staff)):
    if admin.get("role") != "super_admin":
        raise HTTPException(403, "Only super admin can update permissions.")
        
    db = get_database()
    try:
        target_id = ObjectId(staff_id)
    except:
        raise HTTPException(400, "Invalid staff ID")
        
    target_staff = db.hospital_staff.find_one({"_id": target_id, "hospital_id": admin["hospital_id"]})
    if not target_staff:
        raise HTTPException(404, "Staff not found.")
        
    db.hospital_staff.update_one({"_id": target_id}, {"$set": {"permissions": payload.permissions}})
    return {"message": "Permissions updated successfully"}
