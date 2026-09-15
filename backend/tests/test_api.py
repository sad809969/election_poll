import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models  # Register all models on Base.metadata
from app.main import app as fastapi_app
from app.database import Base, get_db



from sqlalchemy.pool import StaticPool

# 1. Create an in-memory SQLite database with StaticPool for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# 2. Override the get_db dependency to use the test database
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


fastapi_app.dependency_overrides[get_db] = override_get_db
Base.metadata.create_all(bind=engine)
client = TestClient(fastapi_app)



from app.seed import seed_database

@pytest.fixture(autouse=True)
def setup_db():
    """Ensure database tables exist and are seeded for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_database(db=db)
    db.close()
    yield




# --- API TESTS ---

def test_read_root():
    """Test health check root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data.get("status") == "online"


def test_auth_login_invalid():
    """Test login with invalid credentials returns 401/400."""
    response = client.post(
        "/api/auth/login",
        json={"username": "fakeagent", "password": "wrongpassword"}
    )
    assert response.status_code in [400, 401, 422]


def test_electoral_lgas_endpoint():
    """Test fetching LGAs list."""
    response = client.get("/api/electoral/lgas")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_dashboard_stats_endpoint():
    """Test fetching Situation Room dashboard summary statistics."""
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "kpi" in data and "votes" in data


def test_results_endpoint():
    """Test fetching EC8A Form Results feed."""
    response = client.get("/api/results")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict) or isinstance(data, list)



def test_incidents_endpoint():
    """Test fetching incidents feed."""
    response = client.get("/api/incidents")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_agents_endpoint():
    """Test fetching registered agents list."""
    response = client.get("/api/agents")
    assert response.status_code == 200
    assert isinstance(response.json(), list)