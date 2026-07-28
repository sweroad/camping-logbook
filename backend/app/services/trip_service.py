import uuid
from datetime import date

from fastapi import HTTPException, status

from app.models.trip import PriceInputMode, Trip
from app.schemas.trip import TripCreate, TripUpdate


def nights_between(start_date: date, end_date: date) -> int:
    return (end_date - start_date).days


def validate_dates(start_date: date, end_date: date) -> None:
    if end_date <= start_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="end_date must be after start_date",
        )


def normalize_price_total(
    price_total: float | None,
    price_per_night_input: float | None,
    price_input_mode: PriceInputMode,
    nights: int,
) -> float | None:
    if price_input_mode == PriceInputMode.per_night:
        if price_per_night_input is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="price_per_night_input is required when price_input_mode is 'per_night'",
            )
        return round(float(price_per_night_input) * nights, 2)
    if price_input_mode == PriceInputMode.total:
        if price_total is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="price_total is required when price_input_mode is 'total'",
            )
        return round(float(price_total), 2)
    return None


def build_trip(data: TripCreate, user_id: uuid.UUID) -> Trip:
    validate_dates(data.start_date, data.end_date)
    nights = nights_between(data.start_date, data.end_date)
    price_total = normalize_price_total(
        data.price_total, data.price_per_night_input, data.price_input_mode, nights
    )

    return Trip(
        user_id=user_id,
        campsite_id=data.campsite_id,
        location_name=data.location_name,
        place_area=data.place_area,
        plot_number=data.plot_number,
        country=data.country,
        stay_type=data.stay_type,
        latitude=data.latitude,
        longitude=data.longitude,
        start_date=data.start_date,
        end_date=data.end_date,
        price_total=price_total,
        price_per_night_input=data.price_per_night_input,
        price_input_mode=data.price_input_mode,
        currency=data.currency,
        star_rating=data.star_rating,
        notes=data.notes,
    )


def apply_update(trip: Trip, data: TripUpdate) -> Trip:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(trip, field, value)

    validate_dates(trip.start_date, trip.end_date)
    nights = nights_between(trip.start_date, trip.end_date)
    trip.price_total = normalize_price_total(
        trip.price_total, trip.price_per_night_input, trip.price_input_mode, nights
    )
    return trip
