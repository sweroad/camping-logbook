import csv
import io
from datetime import datetime, timedelta

from fastapi import HTTPException, UploadFile, status

CHUNK_SIZE = 1024 * 1024
MAX_ROUTE_CSV_SIZE_BYTES = 5 * 1024 * 1024
SEGMENT_GAP = timedelta(minutes=20)

TIMESTAMP_ALIASES = {"date", "time", "timestamp"}
LAT_ALIASES = {"latitude", "lat"}
LNG_ALIASES = {"longitude", "lng", "lon"}


async def _read_upload(upload: UploadFile) -> bytes:
    raw = bytearray()
    while chunk := await upload.read(CHUNK_SIZE):
        raw.extend(chunk)
        if len(raw) > MAX_ROUTE_CSV_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail="Route file exceeds the maximum allowed size",
            )
    return bytes(raw)


def _find_column(fieldnames: list[str], aliases: set[str]) -> str | None:
    lowered = {name.strip().lower(): name for name in fieldnames}
    for alias in aliases:
        if alias in lowered:
            return lowered[alias]
    return None


def _parse_timestamp(raw: str) -> datetime | None:
    # TeslaMate/Grafana CSV exports render the date column as an ISO-8601-ish
    # string (e.g. "2026-06-01T14:32:07.000Z" or "2026-06-01 14:32:07").
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        pass
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue
    return None


def parse_route_csv(raw: bytes) -> list[list[list[float]]]:
    text = raw.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "CSV has no header row")

    ts_col = _find_column(reader.fieldnames, TIMESTAMP_ALIASES)
    lat_col = _find_column(reader.fieldnames, LAT_ALIASES)
    lng_col = _find_column(reader.fieldnames, LNG_ALIASES)
    if not (ts_col and lat_col and lng_col):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "CSV must have a timestamp column (date/time/timestamp) and "
            "latitude/longitude columns (lat/latitude, lng/lon/longitude)",
        )

    points: list[tuple[datetime, float, float]] = []
    for row in reader:
        ts = _parse_timestamp((row.get(ts_col) or "").strip())
        if ts is None:
            continue
        try:
            lat = float(row.get(lat_col, ""))
            lng = float(row.get(lng_col, ""))
        except (TypeError, ValueError):
            continue
        if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
            continue
        points.append((ts, lat, lng))

    if not points:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "No valid GPS rows found in CSV")

    points.sort(key=lambda p: p[0])

    segments: list[list[list[float]]] = []
    current: list[list[float]] = []
    prev_ts: datetime | None = None
    for ts, lat, lng in points:
        if prev_ts is not None and (ts - prev_ts) > SEGMENT_GAP:
            segments.append(current)
            current = []
        current.append([lat, lng])
        prev_ts = ts
    segments.append(current)

    return segments


async def save_route(file: UploadFile) -> list[list[list[float]]]:
    raw = await _read_upload(file)
    if not raw:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Empty file")
    return parse_route_csv(raw)
