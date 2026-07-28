import enum
import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, SmallInteger, String, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.photo import Photo


class PriceInputMode(str, enum.Enum):
    total = "total"
    per_night = "per_night"
    none = "none"


class StayType(str, enum.Enum):
    camping = "camping"
    stallplats = "stallplats"
    fricamping = "fricamping"


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    campsite_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campsites.id"), nullable=True
    )

    location_name: Mapped[str] = mapped_column(String(200), nullable=False)
    place_area: Mapped[str | None] = mapped_column(String(200), nullable=True)
    plot_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    stay_type: Mapped[StayType | None] = mapped_column(SAEnum(StayType, name="stay_type"), nullable=True)

    latitude: Mapped[float | None] = mapped_column(nullable=True)
    longitude: Mapped[float | None] = mapped_column(nullable=True)

    start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    end_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    price_total: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    price_per_night_input: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    price_input_mode: Mapped[PriceInputMode] = mapped_column(
        SAEnum(PriceInputMode, name="price_input_mode"), nullable=False, default=PriceInputMode.none
    )
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="SEK")

    star_rating: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    photos: Mapped[list["Photo"]] = relationship(
        back_populates="trip", cascade="all, delete-orphan", order_by="Photo.uploaded_at"
    )

    @property
    def nights(self) -> int:
        return (self.end_date - self.start_date).days
