import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

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
    """Test that an authenticated user can fetch the LGAs list."""

    login_response = client.post(
        "/api/auth/login",
        data={
            "username": "admin",
            "password": "admin1283",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    response = client.get(
        "/api/electoral/lgas",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_dashboard_stats_endpoint():
    """Test that an authenticated user can fetch Situation Room dashboard statistics."""

    login_response = client.post(
        "/api/auth/login",
        data={
            "username": "admin",
            "password": "admin1283",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    response = client.get(
        "/api/dashboard",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert "kpi" in data
    assert "votes" in data


def test_results_endpoint():
    """Test that an authenticated user can fetch the EC8A Form Results feed."""

    login_response = client.post(
        "/api/auth/login",
        data={
            "username": "admin",
            "password": "admin1283",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    response = client.get(
        "/api/results",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert "summary" in data
    assert "party_vote_share" in data
    assert "lga_breakdown" in data



def test_incidents_endpoint():
    """Test that an authenticated user can fetch the incidents feed."""

    login_response = client.post(
        "/api/auth/login",
        data={
            "username": "admin",
            "password": "admin1283",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    response = client.get(
        "/api/incidents",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_agents_endpoint():
    """Test fetching registered agents list as an authenticated admin."""

    login_response = client.post(
        "/api/auth/login",
        data={
            "username": "admin",
            "password": "admin1283",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    response = client.get(
        "/api/agents",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_change_agent_status():
    """Test that an admin can change an agent's active status."""

    login_response = client.post(
        "/api/auth/login",
        data={
            "username": "admin",
            "password": "admin1283",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    agents_response = client.get(
        "/api/agents",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert agents_response.status_code == 200

    agents = agents_response.json()
    assert len(agents) > 0

    agent_id = agents[0]["id"]

    response = client.patch(
        f"/api/agents/{agent_id}/status",
        params={"active": False},
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200
    assert response.json()["is_active"] is False


def test_delete_agent():
    """Test that an admin cannot physically delete an agent with existing results."""

    login_response = client.post(
        "/api/auth/login",
        data={
            "username": "admin",
            "password": "admin1283",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    agents_response = client.get(
        "/api/agents",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert agents_response.status_code == 200

    agents = agents_response.json()
    assert len(agents) > 0

    agent_id = agents[0]["id"]

    delete_response = client.delete(
        f"/api/agents/{agent_id}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert delete_response.status_code == 200

    assert delete_response.json()["message"] == (
        "Agent has existing vote results and was deactivated instead of deleted."
    )

    # Confirm that the agent still exists but is inactive.
    get_response = client.get(
        f"/api/agents/{agent_id}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert get_response.status_code == 200
    assert get_response.json()["is_active"] is False
