import os
from typing import Optional

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

is_vercel = os.getenv("VERCEL") == "1" or os.getenv("VERCEL_ENV") is not None
db_default = "sqlite:////tmp/pollwatch.db" if is_vercel else "sqlite:///./pollwatch.db"

# Development-only signing key. Refused at startup when ENVIRONMENT=production.
DEV_SECRET_KEY = "jigawa-pdp-pollwatch-2027-secret-key-123456789"


class Settings(BaseSettings):
    PROJECT_NAME: str = "Jigawa PDP PollWatch 2027"

    API_V1_STR: str = "/api"

    # "development" (default) or "production". Production enforces real
    # secrets and never seeds demo accounts or demo results.
    ENVIRONMENT: str = "development"

    DEBUG: bool = True

    SECRET_KEY: str = DEV_SECRET_KEY

    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    DATABASE_URL: str = db_default

    UPLOAD_DIR: str = "/tmp/uploads" if is_vercel else "uploads"

    # Maximum size of an uploaded Form EC8A photo.
    MAX_UPLOAD_MB: int = 8

    # Seed demo accounts (admin/admin1283, agent/agent123, ...) and generated
    # LGAs, wards, polling units, results and incidents. Defaults to on in
    # development and off in production.
    SEED_DEMO_DATA: Optional[bool] = None

    # Password for the initial "admin" account in production. Used only when
    # no "admin" user exists yet; it never overwrites an existing password.
    ADMIN_INITIAL_PASSWORD: Optional[str] = None

    ALLOWED_ORIGINS: list[str] = [
        "*",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://jigawa-pdp-pollwatch.vercel.app",
        "https://jigawa-pdp-pollwatch-backend.vercel.app",
        "https://pdp-pollwatch-backend.onrender.com",
        "https://pdp-pollwatch-web.onrender.com",
        "https://jigawa-pdp-pollwatch.onrender.com",
        "https://pdp-pollwatch.onrender.com",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.strip().lower() == "production"

    @property
    def seed_demo_data(self) -> bool:
        if self.SEED_DEMO_DATA is None:
            return not self.is_production
        return self.SEED_DEMO_DATA

    @model_validator(mode="after")
    def check_production_settings(self):
        if not self.is_production:
            return self
        if self.SECRET_KEY == DEV_SECRET_KEY or len(self.SECRET_KEY) < 32:
            raise ValueError(
                "ENVIRONMENT=production requires SECRET_KEY to be set to a "
                "random value of at least 32 characters."
            )
        if self.SEED_DEMO_DATA:
            raise ValueError("SEED_DEMO_DATA cannot be enabled in production.")
        if self.ADMIN_INITIAL_PASSWORD is not None and len(self.ADMIN_INITIAL_PASSWORD) < 12:
            raise ValueError("ADMIN_INITIAL_PASSWORD must be at least 12 characters.")
        return self


settings = Settings()
