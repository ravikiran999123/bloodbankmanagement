from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn

from database import engine, get_db
import models, schemas, crud, auth, notifications

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Blood Bank Management System", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return auth.get_current_user(token, db)


def require_role(*roles):
    def dep(user=Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=403, detail=f"Requires role: {roles}")
        return user
    return dep


# ── Auth ──────────────────────────────────────────────────────
@app.post("/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db, user)


@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth.create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/auth/me", response_model=schemas.UserOut)
def me(user=Depends(get_current_user)):
    return user


# ── Blood Inventory ───────────────────────────────────────────
@app.get("/inventory", response_model=List[schemas.BloodInventoryOut])
def get_inventory(db: Session = Depends(get_db)):
    return crud.get_inventory(db)


@app.put("/inventory/{blood_group}", response_model=schemas.BloodInventoryOut)
def update_inventory(blood_group: str, update: schemas.InventoryUpdate, db: Session = Depends(get_db), admin=Depends(require_role("admin"))):
    return crud.update_inventory(db, blood_group, update.units)


# ── Donors ────────────────────────────────────────────────────
@app.get("/donors", response_model=List[schemas.DonorOut])
def list_donors(blood_group: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_donors(db, blood_group)


@app.post("/donors", response_model=schemas.DonorOut)
def register_donor(donor: schemas.DonorCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return crud.create_donor(db, user.id, donor)


@app.get("/donors/me", response_model=schemas.DonorOut)
def my_donor_profile(db: Session = Depends(get_db), user=Depends(get_current_user)):
    donor = crud.get_donor_by_user(db, user.id)
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")
    return donor


# ── Blood Requests ────────────────────────────────────────────
@app.post("/requests", response_model=schemas.BloodRequestOut)
def create_request(req: schemas.BloodRequestCreate, bg: BackgroundTasks, db: Session = Depends(get_db), user=Depends(get_current_user)):
    blood_req = crud.create_blood_request(db, user.id, req)
    bg.add_task(notifications.notify_blood_request, blood_req, user)
    return blood_req


@app.get("/requests", response_model=List[schemas.BloodRequestOut])
def list_requests(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role in ("admin", "doctor"):
        return crud.get_all_blood_requests(db)
    return crud.get_user_blood_requests(db, user.id)


@app.put("/requests/{req_id}/approve")
def approve_request(req_id: int, db: Session = Depends(get_db), doctor=Depends(require_role("doctor", "admin"))):
    return crud.update_request_status(db, req_id, "approved")


@app.put("/requests/{req_id}/reject")
def reject_request(req_id: int, db: Session = Depends(get_db), doctor=Depends(require_role("doctor", "admin"))):
    return crud.update_request_status(db, req_id, "rejected")


# ── Appointments ───────────────────────────────────────────────
@app.post("/appointments", response_model=schemas.AppointmentOut)
def book_appointment(appt: schemas.AppointmentCreate, bg: BackgroundTasks, db: Session = Depends(get_db), user=Depends(get_current_user)):
    appointment = crud.create_appointment(db, user.id, appt)
    bg.add_task(notifications.send_appointment_confirmation, appointment, user)
    return appointment


@app.get("/appointments", response_model=List[schemas.AppointmentOut])
def list_appointments(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role in ("admin", "doctor"):
        return crud.get_all_appointments(db)
    return crud.get_user_appointments(db, user.id)


@app.put("/appointments/{appt_id}/confirm")
def confirm_appointment(appt_id: int, db: Session = Depends(get_db), doctor=Depends(require_role("doctor", "admin"))):
    return crud.update_appointment_status(db, appt_id, "confirmed")


@app.put("/appointments/{appt_id}/cancel")
def cancel_appointment(appt_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return crud.update_appointment_status(db, appt_id, "cancelled")


# ── Dashboard (Admin) ──────────────────────────────────────────
@app.get("/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db), admin=Depends(require_role("admin"))):
    return crud.get_dashboard_stats(db)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
