import io
import uuid
from datetime import datetime, timezone
from pathlib import Path

import pillow_heif
from fastapi import HTTPException, UploadFile, status
from PIL import Image, ImageOps

from app.config import settings

pillow_heif.register_heif_opener()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}
CHUNK_SIZE = 1024 * 1024
OUTPUT_CONTENT_TYPE = "image/jpeg"


async def _read_upload(upload: UploadFile) -> bytes:
    raw = bytearray()
    while chunk := await upload.read(CHUNK_SIZE):
        raw.extend(chunk)
        if len(raw) > settings.max_photo_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail="Photo exceeds the maximum allowed size",
            )
    return bytes(raw)


def _compress(raw: bytes) -> bytes:
    try:
        image = Image.open(io.BytesIO(raw))
        image.load()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Could not read image data",
        ) from exc

    # Mobile photos carry orientation as EXIF metadata rather than rotated
    # pixels -- without this they'd upload sideways.
    image = ImageOps.exif_transpose(image) or image
    if image.mode != "RGB":
        image = image.convert("RGB")

    # These are a reference to jog your memory of the place, not the archival
    # copy -- the original stays in your phone's photo library.
    image.thumbnail((settings.photo_max_dimension, settings.photo_max_dimension), Image.LANCZOS)

    output = io.BytesIO()
    image.save(output, format="JPEG", quality=settings.photo_jpeg_quality, optimize=True)
    return output.getvalue()


async def save_photo_file(upload: UploadFile) -> tuple[str, int, str]:
    if upload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported image type",
        )

    raw = await _read_upload(upload)
    compressed = _compress(raw)

    now = datetime.now(timezone.utc)
    storage_root = Path(settings.photo_storage_path)
    directory = storage_root / f"{now:%Y}" / f"{now:%m}"
    directory.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4()}.jpg"
    destination = directory / filename
    destination.write_bytes(compressed)

    return str(destination.relative_to(storage_root)), len(compressed), OUTPUT_CONTENT_TYPE


def delete_photo_file(file_path: str) -> None:
    full_path = Path(settings.photo_storage_path) / file_path
    full_path.unlink(missing_ok=True)
