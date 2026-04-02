from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "patient"
    phone: Optional[str] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    phone: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class BloodInventoryOut(BaseModel):
    id: int
    blood_group: str
    units_available: int
    last_updated: datetime

    class Config:
        from_attributes = True


class InventoryUpdate(BaseModel):
    units: int


class DonorCreate(BaseModel):
    blood_group: str
    age: int
    weight: float
    medical_notes: Optional[str] = None


class DonorOut(BaseModel):
    id: int
    user_id: int
    blood_group: str
    age: int
    weight: float
    is_available: bool
    last_donation_date: Optional[datetime]
    medical_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class BloodRequestCreate(BaseModel):
    blood_group: str
    units_needed: int
    urgency: str = "normal"
    hospital_name: str
    patient_name: str
    notes: Optional[str] = None


class BloodRequestOut(BaseModel):
    id: int
    requester_id: int
    blood_group: str
    units_needed: int
    urgency: str
    hospital_name: str
    patient_name: str
    status: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AppointmentCreate(BaseModel):
    appointment_type: str
    scheduled_date: datetime
    notes: Optional[str] = None


class AppointmentOut(BaseModel):
    id: int
    user_id: int
    appointment_type: str
    scheduled_date: datetime
    status: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
