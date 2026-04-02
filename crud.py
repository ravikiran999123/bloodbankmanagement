from sqlalchemy.orm import Session
from fastapi import HTTPException
import models, schemas, auth
from typing import Optional

BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]


def seed_inventory(db: Session):
    """Seed blood inventory with all blood groups if not present."""
    for bg in BLOOD_GROUPS:
        existing = db.query(models.BloodInventory).filter(models.BloodInventory.blood_group == bg).first()
        if not existing:
            db.add(models.BloodInventory(blood_group=bg, units_available=0))
    db.commit()


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    hashed = auth.hash_password(user.password)
    obj = models.User(name=user.name, email=user.email, hashed_password=hashed, role=user.role, phone=user.phone)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_inventory(db: Session):
    seed_inventory(db)
    return db.query(models.BloodInventory).all()


def update_inventory(db: Session, blood_group: str, units: int):
    inv = db.query(models.BloodInventory).filter(models.BloodInventory.blood_group == blood_group).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Blood group not found")
    inv.units_available = units
    db.commit()
    db.refresh(inv)
    return inv


def get_donors(db: Session, blood_group: Optional[str] = None):
    q = db.query(models.Donor)
    if blood_group:
        q = q.filter(models.Donor.blood_group == blood_group)
    return q.all()


def get_donor_by_user(db: Session, user_id: int):
    return db.query(models.Donor).filter(models.Donor.user_id == user_id).first()


def create_donor(db: Session, user_id: int, donor: schemas.DonorCreate):
    existing = get_donor_by_user(db, user_id)
    if existing:
        raise HTTPException(status_code=400, detail="Donor profile already exists")
    obj = models.Donor(user_id=user_id, **donor.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def create_blood_request(db: Session, user_id: int, req: schemas.BloodRequestCreate):
    obj = models.BloodRequest(requester_id=user_id, **req.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_all_blood_requests(db: Session):
    return db.query(models.BloodRequest).order_by(models.BloodRequest.created_at.desc()).all()


def get_user_blood_requests(db: Session, user_id: int):
    return db.query(models.BloodRequest).filter(models.BloodRequest.requester_id == user_id).all()


def update_request_status(db: Session, req_id: int, status: str):
    req = db.query(models.BloodRequest).filter(models.BloodRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = status
    db.commit()
    db.refresh(req)
    return req


def create_appointment(db: Session, user_id: int, appt: schemas.AppointmentCreate):
    # Check for conflicts within 1 hour
    from datetime import timedelta
    window_start = appt.scheduled_date - timedelta(hours=1)
    window_end = appt.scheduled_date + timedelta(hours=1)
    conflict = db.query(models.Appointment).filter(
        models.Appointment.scheduled_date.between(window_start, window_end),
        models.Appointment.status != "cancelled"
    ).count()
    if conflict >= 5:  # Max 5 slots per hour
        raise HTTPException(status_code=400, detail="This time slot is fully booked")
    obj = models.Appointment(user_id=user_id, **appt.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_all_appointments(db: Session):
    return db.query(models.Appointment).order_by(models.Appointment.scheduled_date).all()


def get_user_appointments(db: Session, user_id: int):
    return db.query(models.Appointment).filter(models.Appointment.user_id == user_id).all()


def update_appointment_status(db: Session, appt_id: int, status: str):
    appt = db.query(models.Appointment).filter(models.Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt.status = status
    db.commit()
    db.refresh(appt)
    return appt


def get_dashboard_stats(db: Session):
    inventory = get_inventory(db)
    return {
        "total_donors": db.query(models.Donor).count(),
        "total_requests": db.query(models.BloodRequest).count(),
        "pending_requests": db.query(models.BloodRequest).filter(models.BloodRequest.status == "pending").count(),
        "total_appointments": db.query(models.Appointment).count(),
        "inventory": [{"blood_group": i.blood_group, "units": i.units_available} for i in inventory],
    }
