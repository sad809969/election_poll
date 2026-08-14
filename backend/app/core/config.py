import os
from pydantic_settings import BaseSettings, SettingsConfigDict

is_vercel = os.getenv("VERCEL") == "1" or os.getenv("VERCEL_ENV") is not None
db_default = "sqlite:////tmp/pollwatch.db" if is_vercel else "sqlite:///./pollwatch.db"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Jigawa PDP PollWatch 2027"

    API_V1_STR: str = "/api"

    DEBUG: bool = True

    SECRET_KEY: str = os.getenv("SECRET_KEY", "jigawa-pdp-pollwatch-2027-secret-key-123456789")

    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    DATABASE_URL: str = os.getenv("DATABASE_URL", db_default)

    UPLOAD_DIR: str = "/tmp/uploads" if is_vercel else "uploads"

    ALLOWED_ORIGINS: list[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()