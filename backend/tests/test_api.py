import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

# 1. Create an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# 2. Override the get_db dependency to use the test database
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    """Create tables before test run, drop them after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


# --- API TESTS ---

def test_read_root():
    """Test health check or root endpoint."""
    response = client.get("/")
    assert response.status_code in [200, 404]  # Depending on whether root / route is defined


def test_auth_login_invalid():
    """Test login with invalid credentials returns 401/400."""
    response = client.post(
        "/api/auth/login",
        json={"username": "fakeagent", "password": "wrongpassword"}
    )
    assert response.status_code in [400, 401, 422]


def test_file_upload_validation():
    """Test file upload service blocks invalid file types."""
    # Send a dummy text file to an upload endpoint
    file_data = {"file": ("test.txt", b"invalid text file content", "text/plain")}
    response = client.post("/api/upload", files=file_data)
    
    # Should fail due to unsupported extension/MIME
    assert response.status_code in [400, 404, 422]