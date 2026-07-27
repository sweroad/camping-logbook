from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.services.export_service import generate_export_workbook
from app.services.trip_service import validate_dates

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("/xlsx")
def export_xlsx(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if start_date is not None and end_date is not None:
        validate_dates(start_date, end_date)

    buffer = generate_export_workbook(db, start_date, end_date)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    filename = f"camping-logbook-export-{timestamp}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
