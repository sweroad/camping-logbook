import uuid
from datetime import datetime

from pydantic import BaseModel


class PhotoOut(BaseModel):
    id: uuid.UUID
    trip_id: uuid.UUID
    file_path: str
    original_filename: str | None
    content_type: str
    file_size_bytes: int | None
    uploaded_at: datetime

    model_config = {"from_attributes": True}
