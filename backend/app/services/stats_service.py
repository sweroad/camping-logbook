from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.trip import Trip


def default_range() -> tuple[date, date]:
    today = date.today()
    return date(today.year, 1, 1), date(today.year + 1, 1, 1)


def _trips_in_range(db: Session, start_date: date, end_date: date) -> list[Trip]:
    stmt = select(Trip).where(Trip.end_date > start_date, Trip.start_date < end_date)
    return list(db.scalars(stmt).all())


def compute_summary(db: Session, start_date: date, end_date: date) -> dict:
    trips = _trips_in_range(db, start_date, end_date)

    total_nights = sum(trip.nights for trip in trips)

    priced_trips = [trip for trip in trips if trip.price_total is not None]
    total_price = sum(float(trip.price_total) for trip in priced_trips) if priced_trips else None
    priced_nights = sum(trip.nights for trip in priced_trips)
    avg_price_per_night = round(total_price / priced_nights, 2) if priced_trips and priced_nights else None

    rated_trips = [trip for trip in trips if trip.star_rating is not None]
    avg_star_rating = (
        round(sum(trip.star_rating for trip in rated_trips) / len(rated_trips), 2) if rated_trips else None
    )

    return {
        "start_date": start_date,
        "end_date": end_date,
        "trip_count": len(trips),
        "total_nights": total_nights,
        "total_price": round(total_price, 2) if total_price is not None else None,
        "avg_price_per_night": avg_price_per_night,
        "avg_star_rating": avg_star_rating,
    }


def _next_month(day: date) -> date:
    if day.month == 12:
        return date(day.year + 1, 1, 1)
    return date(day.year, day.month + 1, 1)


def compute_by_month(db: Session, start_date: date, end_date: date) -> list[dict]:
    trips = _trips_in_range(db, start_date, end_date)

    buckets: dict[str, dict] = {}
    cursor = date(start_date.year, start_date.month, 1)
    while cursor < end_date:
        key = f"{cursor:%Y-%m}"
        buckets[key] = {"month": key, "trip_count": 0, "total_nights": 0, "total_price": None}
        cursor = _next_month(cursor)

    for trip in trips:
        bucket_date = max(trip.start_date, start_date)
        key = f"{bucket_date:%Y-%m}"
        bucket = buckets[key]
        bucket["trip_count"] += 1
        bucket["total_nights"] += trip.nights
        if trip.price_total is not None:
            bucket["total_price"] = (bucket["total_price"] or 0) + float(trip.price_total)

    for bucket in buckets.values():
        if bucket["total_price"] is not None:
            bucket["total_price"] = round(bucket["total_price"], 2)

    return [buckets[key] for key in sorted(buckets)]
