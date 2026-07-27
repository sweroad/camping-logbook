from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.stats import StatsByMonthResponse, StatsSummary
from app.services import stats_service
from app.services.trip_service import validate_dates

router = APIRouter(prefix="/api/stats", tags=["stats"])


def _resolve_range(start_date: date | None, end_date: date | None) -> tuple[date, date]:
    default_start, default_end = stats_service.default_range()
    resolved_start = start_date or default_start
    resolved_end = end_date or default_end
    validate_dates(resolved_start, resolved_end)
    return resolved_start, resolved_end


@router.get("/summary", response_model=StatsSummary)
def get_summary(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_start, resolved_end = _resolve_range(start_date, end_date)
    return stats_service.compute_summary(db, resolved_start, resolved_end)


@router.get("/by_month", response_model=StatsByMonthResponse)
def get_by_month(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_start, resolved_end = _resolve_range(start_date, end_date)
    months = stats_service.compute_by_month(db, resolved_start, resolved_end)
    return StatsByMonthResponse(start_date=resolved_start, end_date=resolved_end, months=months)
