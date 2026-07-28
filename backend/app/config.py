from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    photo_storage_path: str = "/data/photos"
    max_photo_size_bytes: int = 15 * 1024 * 1024  # 15 MB, applies to the raw upload before compression
    photo_max_dimension: int = 1600  # long edge, px -- these are for reference, not archival originals
    photo_jpeg_quality: int = 82


settings = Settings()
