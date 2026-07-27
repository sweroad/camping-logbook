from datetime import date

from pydantic import BaseModel


class StatsSummary(BaseModel):
    start_date: date
    end_date: date
    trip_count: int
    total_nights: int
    total_price: float | None
    avg_price_per_night: float | None
    avg_star_rating: float | None


class MonthlyStat(BaseModel):
    month: str
    trip_count: int
    total_nights: int
    total_price: float | None


class StatsByMonthResponse(BaseModel):
    start_date: date
    end_date: date
    months: list[MonthlyStat]
