import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Jigawa PDP PollWatch 2027"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "jigawa-pdp-pollwatch-2027-super-secret-key-key-987654321")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # SQLite fallback for quick local execution, convertible to PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./pollwatch.db")
    SYNC_DATABASE_URL: str = os.getenv("SYNC_DATABASE_URL", "sqlite:///./pollwatch.db")
    
    # Media Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")

    class Config:
        case_sensitive = True

settings = Settings()
