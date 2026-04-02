from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(200))
    role = Column(String(20), default="patient")  # patient, donor, doctor, admin
    phone = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    donor_profile = relationship("Donor", back_populates="user", uselist=False)
    blood_requests = relationship("BloodRequest", back_populates="requester")
    appointments = relationship("Appointment", back_populates="user")


class BloodInventory(Base):
    __tablename__ = "blood_inventory"
    id = Column(Integer, primary_key=True, index=True)
    blood_group = Column(String(5), unique=True, index=True)  # A+, A-, B+, etc.
    units_available = Column(Integer, default=0)
    last_updated = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


class Donor(Base):
    __tablename__ = "donors"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    blood_group = Column(String(5))
    age = Column(Integer)
    weight = Column(Float)
    last_donation_date = Column(DateTime, nullable=True)
    is_available = Column(Boolean, default=True)
    medical_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="donor_profile")


class BloodRequest(Base):
    __tablename__ = "blood_requests"
    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"))
    blood_group = Column(String(5))
    units_needed = Column(Integer)
    urgency = Column(String(20), default="normal")  # normal, urgent, critical
    hospital_name = Column(String(200))
    patient_name = Column(String(100))
    status = Column(String(20), default="pending")  # pending, approved, rejected, fulfilled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    requester = relationship("User", back_populates="blood_requests")


class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    appointment_type = Column(String(30))  # donation, transfusion
    scheduled_date = Column(DateTime)
    status = Column(String(20), default="pending")  # pending, confirmed, completed, cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="appointments")
