from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.session import get_db
from app.models.allowed_cars import AllowedCar
from app.models.detections import Detection
from app.models.users import User
from app.routers.deps import get_current_user
from app.schemas.allowed_car_schema import AllowedCarCreate, AllowedCarResponse
from app.schemas.detections_schema import Detection as DetectionSchema

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])

 
# Detection history

@router.get("/detections", response_model=list[DetectionSchema])
def list_detections(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    plate: Optional[str] = Query(None, description="Filter by plate text (partial match)"),
    is_allowed: Optional[bool] = Query(None, description="Filter by access status"),
    db: Session = Depends(get_db),
):
    q = db.query(Detection)
    if plate:
        q = q.filter(Detection.plate_text.ilike(f"%{plate}%"))
    if is_allowed is not None:
        q = q.filter(Detection.is_allowed == is_allowed)
    return q.order_by(Detection.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/detections/{detection_id}", response_model=DetectionSchema)
def get_detection(detection_id: int, db: Session = Depends(get_db)):
    row = db.query(Detection).filter(Detection.id == detection_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Detection not found.")
    return row


# Whitelist (allowed_cars) CRUD — requires auth

@router.get("/whitelist", response_model=list[AllowedCarResponse])
def list_whitelist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(AllowedCar)
        .filter(AllowedCar.owner_id == current_user.id)
        .order_by(AllowedCar.created_at.desc())
        .all()
    )


@router.post("/whitelist", response_model=AllowedCarResponse, status_code=status.HTTP_201_CREATED)
def add_to_whitelist(
    payload: AllowedCarCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plate = payload.license_plate.upper().replace(" ", "")
    existing = db.query(AllowedCar).filter(AllowedCar.license_plate == plate).first()
    if existing:
        raise HTTPException(status_code=409, detail="Plate already on whitelist.")

    entry = AllowedCar(license_plate=plate, owner_id=current_user.id)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/whitelist/{plate_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_whitelist(
    plate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(AllowedCar).filter(AllowedCar.id == plate_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Whitelist entry not found.")
    if entry.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your whitelist entry.")
    db.delete(entry)
    db.commit()
