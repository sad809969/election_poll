import os
from pydantic_settings import BaseSettings

is_vercel = os.getenv("VERCEL") == "1" or os.getenv("VERCEL_ENV") is not None
db_default = "sqlite+aiosqlite:////tmp/pollwatch.db" if is_vercel else "sqlite+aiosqlite:///./pollwatch.db"
sync_db_default = "sqlite:////tmp/pollwatch.db" if is_vercel else "sqlite:///./pollwatch.db"
upload_default = "/tmp/uploads" if is_vercel else "./uploads"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Jigawa PDP PollWatch 2027"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "jigawa-pdp-pollwatch-2027-super-secret-key-key-987654321")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # SQLite storage path
    DATABASE_URL: str = os.getenv("DATABASE_URL", db_default)
    SYNC_DATABASE_URL: str = os.getenv("SYNC_DATABASE_URL", sync_db_default)
    
    # Media Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", upload_default)

    class Config:
        case_sensitive = True

settings = Settings()
