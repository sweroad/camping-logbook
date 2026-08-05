import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, model_validator

from app.models.trip import PriceInputMode, StayType
from app.schemas.photo import PhotoOut


class TripBase(BaseModel):
    location_name: str = Field(min_length=1, max_length=200)
    place_area: str | None = Field(default=None, max_length=200)
    plot_number: str | None = Field(default=None, max_length=50)
    country: str | None = Field(default=None, max_length=100)
    stay_type: StayType | None = None

    latitude: float | None = None
    longitude: float | None = None

    start_date: date
    end_date: date

    price_total: float | None = None
    price_per_night_input: float | None = None
    price_input_mode: PriceInputMode = PriceInputMode.none
    currency: str = Field(default="SEK", max_length=3)

    star_rating: int | None = Field(default=None, ge=1, le=5)
    notes: str | None = None

    campsite_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def _check_dates_and_price(self):
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        if self.price_input_mode == PriceInputMode.total and self.price_total is None:
            raise ValueError("price_total is required when price_input_mode is 'total'")
        if self.price_input_mode == PriceInputMode.per_night and self.price_per_night_input is None:
            raise ValueError("price_per_night_input is required when price_input_mode is 'per_night'")
        return self


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    location_name: str | None = Field(default=None, min_length=1, max_length=200)
    place_area: str | None = Field(default=None, max_length=200)
    plot_number: str | None = Field(default=None, max_length=50)
    country: str | None = Field(default=None, max_length=100)
    stay_type: StayType | None = None

    latitude: float | None = None
    longitude: float | None = None

    start_date: date | None = None
    end_date: date | None = None

    price_total: float | None = None
    price_per_night_input: float | None = None
    price_input_mode: PriceInputMode | None = None
    currency: str | None = Field(default=None, max_length=3)

    star_rating: int | None = Field(default=None, ge=1, le=5)
    notes: str | None = None

    campsite_id: uuid.UUID | None = None


class TripOut(TripBase):
    id: uuid.UUID
    user_id: uuid.UUID
    nights: int
    created_at: datetime
    updated_at: datetime
    photos: list[PhotoOut] = []
    route_points: list[list[list[float]]] | None = None

    model_config = {"from_attributes": True}


class TripListResponse(BaseModel):
    items: list[TripOut]
    total: int
