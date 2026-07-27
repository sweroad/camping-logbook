import mimetypes
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.config import settings

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}
CHUNK_SIZE = 1024 * 1024


def _extension_for(content_type: str, filename: str | None) -> str:
    if filename:
        suffix = Path(filename).suffix
        if suffix:
            return suffix
    return mimetypes.guess_extension(content_type) or ""


async def save_photo_file(upload: UploadFile) -> tuple[str, int]:
    if upload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported image type",
        )

    now = datetime.now(timezone.utc)
    storage_root = Path(settings.photo_storage_path)
    directory = storage_root / f"{now:%Y}" / f"{now:%m}"
    directory.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4()}{_extension_for(upload.content_type, upload.filename)}"
    destination = directory / filename

    size = 0
    try:
        with destination.open("wb") as out_file:
            while chunk := await upload.read(CHUNK_SIZE):
                size += len(chunk)
                if size > settings.max_photo_size_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                        detail="Photo exceeds the maximum allowed size",
                    )
                out_file.write(chunk)
    except HTTPException:
        destination.unlink(missing_ok=True)
        raise

    return str(destination.relative_to(storage_root)), size


def delete_photo_file(file_path: str) -> None:
    full_path = Path(settings.photo_storage_path) / file_path
    full_path.unlink(missing_ok=True)
