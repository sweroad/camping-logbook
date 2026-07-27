import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.photo import Photo
from app.models.trip import Trip
from app.models.user import User
from app.schemas.photo import PhotoOut
from app.services import photo_service

router = APIRouter(prefix="/api", tags=["photos"])


def _get_trip_or_404(db: Session, trip_id: uuid.UUID) -> Trip:
    trip = db.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return trip


@router.post("/trips/{trip_id}/photos", response_model=PhotoOut, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    trip_id: uuid.UUID,
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_trip_or_404(db, trip_id)
    relative_path, size = await photo_service.save_photo_file(file)

    photo = Photo(
        trip_id=trip_id,
        file_path=relative_path,
        original_filename=file.filename,
        content_type=file.content_type,
        file_size_bytes=size,
        uploaded_by_user_id=current_user.id,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


@router.get("/trips/{trip_id}/photos", response_model=list[PhotoOut])
def list_photos(
    trip_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trip = _get_trip_or_404(db, trip_id)
    return trip.photos


@router.delete("/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_photo(
    photo_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    photo = db.get(Photo, photo_id)
    if photo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    photo_service.delete_photo_file(photo.file_path)
    db.delete(photo)
    db.commit()
