import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database import init_db


# Core Routers
from app.routers import auth, results, incidents, agents, audit
from app.routers import dashboard

# Optional extra routers if those files exist in your routers/ folder:
from app.routers import electoral
try:
    from app.routers import communication
except ImportError:
    communication = None

try:
    from app.routers import ws
except ImportError:
    ws = None


# Optional seed function import
try:
    from app.seed import seed_database
except ImportError:
    seed_database = None
    


# Modern Lifespan Event Handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code executed on application startup
    init_db()
    if seed_database:
        seed_database()
    yield
    # Code executed on application shutdown (if needed)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Enable CORS for Next.js Frontend & Mobile App
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local frontend on any port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Uploads directory for Form EC8A Photos & Incident Media
upload_dir = getattr(settings, "UPLOAD_DIR", "uploads")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# Core Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(results.router, prefix=settings.API_V1_STR)
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(agents.router, prefix=settings.API_V1_STR)
app.include_router(electoral.router, prefix=settings.API_V1_STR)
if communication:
    app.include_router(communication.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)

if ws:
    app.include_router(ws.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": "1.0.0",
        "documentation": "/docs",
    }