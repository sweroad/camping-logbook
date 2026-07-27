import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.trip import Trip
from app.models.user import User
from app.schemas.trip import TripCreate, TripListResponse, TripOut, TripUpdate
from app.services import photo_service, trip_service

router = APIRouter(prefix="/api/trips", tags=["trips"])


def _get_trip_or_404(db: Session, trip_id: uuid.UUID) -> Trip:
    trip = db.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return trip


@router.get("", response_model=TripListResponse)
def list_trips(
    start_date: date | None = None,
    end_date: date | None = None,
    q: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Trip)
    if start_date is not None:
        stmt = stmt.where(Trip.end_date > start_date)
    if end_date is not None:
        stmt = stmt.where(Trip.start_date < end_date)
    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(
            or_(
                Trip.location_name.ilike(pattern),
                Trip.place_area.ilike(pattern),
                Trip.notes.ilike(pattern),
            )
        )

    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    items = db.scalars(stmt.order_by(Trip.start_date.desc()).limit(limit).offset(offset)).all()
    return TripListResponse(items=items, total=total or 0)


@router.post("", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def create_trip(
    payload: TripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trip = trip_service.build_trip(payload, user_id=current_user.id)
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.get("/{trip_id}", response_model=TripOut)
def get_trip(
    trip_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_trip_or_404(db, trip_id)


@router.patch("/{trip_id}", response_model=TripOut)
def update_trip(
    trip_id: uuid.UUID,
    payload: TripUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trip = _get_trip_or_404(db, trip_id)
    trip = trip_service.apply_update(trip, payload)
    db.commit()
    db.refresh(trip)
    return trip


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    trip_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trip = _get_trip_or_404(db, trip_id)
    for photo in trip.photos:
        photo_service.delete_photo_file(photo.file_path)
    db.delete(trip)
    db.commit()
