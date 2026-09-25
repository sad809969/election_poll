import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # Register all models on Base.metadata
from app.main import app as fastapi_app
from app.database import Base, get_db
from app.seed import seed_database

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


@pytest.fixture(autouse=True)
def setup_db():
    """Ensure database tables exist and are seeded for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_database(db=db)
    db.close()
    yield


# Helper to get admin authorization headers
def get_admin_headers():
    res = client.post(
        "/api/auth/login",
        data={"username": "admin", "password": "admin1283"}
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


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
        data={"username": "fakeagent", "password": "wrongpassword"}
    )
    assert response.status_code in [400, 401]


def test_auth_login_valid_and_me():
    """Test login with seeded admin credentials and check /me endpoint."""
    response = client.post(
        "/api/auth/login",
        data={"username": "admin", "password": "admin1283"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["username"] == "admin"

    headers = {"Authorization": f"Bearer {data['access_token']}"}
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["username"] == "admin"


def test_electoral_hierarchy_endpoints():
    """Test fetching LGAs, Wards, and Polling Units."""
    # LGAs
    res_lgas = client.get("/api/electoral/lgas")
    assert res_lgas.status_code == 200
    lgas = res_lgas.json()
    assert len(lgas) == 27

    # Wards
    res_wards = client.get("/api/electoral/wards")
    assert res_wards.status_code == 200
    wards = res_wards.json()
    assert len(wards) > 0

    # Polling Units
    res_pus = client.get("/api/electoral/polling-units")
    assert res_pus.status_code == 200
    pus = res_pus.json()
    assert len(pus) > 0


def test_dashboard_stats_endpoint():
    """Test fetching Situation Room dashboard summary statistics."""
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "kpi" in data and "votes" in data
    assert data["kpi"]["polling_units"] > 0
    assert data["votes"]["pdp"] >= 0


def test_results_get_and_post():
    """Test results summary, breakdown, results list, and submit."""
    # 1. GET /api/results
    response = client.get("/api/results")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "party_vote_share" in data
    assert "lga_breakdown" in data
    assert "results" in data
    assert isinstance(data["results"], list)

    # 2. POST /api/results (Form EC8A entry from frontend)
    headers = get_admin_headers()
    pus_resp = client.get("/api/electoral/polling-units")
    first_pu_id = pus_resp.json()[0]["id"]

    post_resp = client.post(
        "/api/results",
        headers=headers,
        json={
            "polling_unit_id": first_pu_id,
            "pdp_votes": 350,
            "apc_votes": 210,
            "nnpp_votes": 45,
            "lp_votes": 10,
            "others_votes": 2,
            "rejected_votes": 5,
        }
    )
    assert post_resp.status_code == 200
    assert "Result" in post_resp.json()["message"]


def test_incidents_get_and_post():
    """Test fetching enriched incidents and posting a new incident."""
    # 1. GET /api/incidents
    get_resp = client.get("/api/incidents")
    assert get_resp.status_code == 200
    incidents = get_resp.json()
    assert isinstance(incidents, list)
    if len(incidents) > 0:
        inc = incidents[0]
        assert "incident_type" in inc
        assert "severity" in inc
        assert "polling_unit_name" in inc

    # 2. POST /api/incidents
    headers = get_admin_headers()
    pus_resp = client.get("/api/electoral/polling-units")
    first_pu_id = pus_resp.json()[0]["id"]

    post_resp = client.post(
        "/api/incidents",
        headers=headers,
        json={
            "polling_unit_id": first_pu_id,
            "incident_type": "BVAS Issues",
            "severity": "HIGH",
            "description": "Biometric device failing to scan voter thumbs.",
            "latitude": 11.75,
            "longitude": 9.35,
        }
    )
    assert post_resp.status_code == 201
    assert post_resp.json()["incident_type"] == "BVAS Issues"


def test_announcements_get_and_post():
    """Test announcements broadcast endpoints."""
    headers = get_admin_headers()

    # 1. POST /api/announcements
    post_resp = client.post(
        "/api/announcements",
        headers=headers,
        json={
            "title": "Mandatory Agent Briefing",
            "message": "All LGA coordinators must check in at 07:00 AM.",
            "urgency": "Emergency",
            "target_role": "LGA Coordinator",
            "sender_name": "State Chairman",
        }
    )
    assert post_resp.status_code == 201
    assert post_resp.json()["title"] == "Mandatory Agent Briefing"

    # 2. GET /api/announcements
    get_resp = client.get("/api/announcements")
    assert get_resp.status_code == 200
    announcements = get_resp.json()
    assert len(announcements) > 0
    assert any(a["title"] == "Mandatory Agent Briefing" for a in announcements)


def test_agents_and_audit():
    """Test agents list and audit logs endpoint."""
    headers = get_admin_headers()

    # Unauthenticated access to /api/agents must be rejected
    res_unauth = client.get("/api/agents")
    assert res_unauth.status_code in [401, 403]

    # Authenticated supervisor/admin access
    res_agents = client.get("/api/agents", headers=headers)
    assert res_agents.status_code == 200
    assert isinstance(res_agents.json(), list)

    # Audit logs
    res_audit = client.get("/api/audit", headers=headers)
    assert res_audit.status_code == 200
    assert isinstance(res_audit.json(), list)


def test_agent_lifecycle_and_bugfixes():
    """Test agent creation, status toggle (PATCH), and actual deletion (DELETE)."""
    headers = get_admin_headers()

    # 1. Create a temporary test agent
    create_res = client.post(
        "/api/agents",
        headers=headers,
        json={
            "full_name": "Test Lifecycle Agent",
            "username": "test_agent_lifecycle_99",
            "password": "agentpassword123",
            "phone_number": "08012349999",
            "role": "Polling Unit Agent",
        }
    )
    assert create_res.status_code == 201
    agent_data = create_res.json()
    agent_id = agent_data["id"]
    assert agent_data["is_active"] is True

    # 2. Toggle status to False (PATCH /api/agents/{id}/status?active=false)
    status_res = client.patch(
        f"/api/agents/{agent_id}/status?active=false",
        headers=headers,
    )
    assert status_res.status_code == 200
    assert status_res.json()["is_active"] is False

    # Verify status in GET /api/agents/{id}
    get_res = client.get(f"/api/agents/{agent_id}")
    assert get_res.status_code == 200
    assert get_res.json()["is_active"] is False

    # 3. Delete agent (DELETE /api/agents/{id})
    del_res = client.delete(f"/api/agents/{agent_id}", headers=headers)
    assert del_res.status_code == 200
    assert "deleted successfully" in del_res.json()["message"]

    # Verify agent is genuinely deleted from database
    get_after_del = client.get(f"/api/agents/{agent_id}")
    assert get_after_del.status_code == 404


def test_websocket_live_feed():
    """Test connecting to the live-feed WebSocket."""
    with client.websocket_connect("/ws/live-feed") as websocket:
        websocket.send_text("ping")
        data = websocket.receive_json()
        assert data["status"] == "acknowledged"
        assert data["received"] == "ping"


def test_overvoting_auto_flag_and_protection():
    """Test over-voting is auto-flagged and cannot be approved by admin."""
    headers = get_admin_headers()

    # 1. Fetch a PU to test with
    res_pu = client.get("/api/electoral/polling-units")
    assert res_pu.status_code == 200
    pus = res_pu.json()
    test_pu = pus[0]
    pu_id = test_pu["id"]
    registered = test_pu["registered_voters"]

    # 2. Submit over-voting: total cast = registered + 500
    res_submit = client.post(
        "/api/results/submit",
        headers=headers,
        json={
            "polling_unit_id": pu_id,
            "pdp_votes": registered + 200,
            "apc_votes": 200,
            "nnpp_votes": 50,
            "lp_votes": 30,
            "others_votes": 20,
            "rejected_votes": 0,
        }
    )
    assert res_submit.status_code == 200
    data = res_submit.json()
    assert data["is_overvoting"] is True
    assert data["verification_status"] == "FLAGGED"
    result_id = data["id"]

    # 3. Attempt to approve over-voted result should fail with 400
    res_approve = client.post(f"/api/results/approve/{result_id}", headers=headers)
    assert res_approve.status_code == 400
    assert "Over-voting detected" in res_approve.json()["detail"]

    # 4. Test manual flag endpoint
    res_flag = client.post(f"/api/results/flag/{result_id}?notes=Tribunal%20audit%20hold", headers=headers)
    assert res_flag.status_code == 200
    assert res_flag.json()["verification_status"] == "FLAGGED"


def test_election_activities():
    """Test recording and retrieving agent election activities."""
    headers = get_admin_headers()
    res_pu = client.get("/api/electoral/polling-units")
    pu_id = res_pu.json()[0]["id"]

    # 1. Record an activity
    post_res = client.post(
        "/api/activities",
        headers=headers,
        json={
            "polling_unit_id": pu_id,
            "activity_type": "Agent Check-in",
            "notes": "Agent on site, polling box sealed.",
        }
    )
    assert post_res.status_code == 201
    assert post_res.json()["activity_type"] == "Agent Check-in"

    # 2. Get activities
    get_res = client.get(f"/api/activities?polling_unit_id={pu_id}")
    assert get_res.status_code == 200
    activities = get_res.json()
    assert len(activities) > 0
    assert activities[0]["activity_type"] == "Agent Check-in"


def test_collation_drilldown_and_signoff():
    """Test LGA collation drill-down and EC8C sign-off endpoint."""
    headers = get_admin_headers()
    res_lgas = client.get("/api/electoral/lgas")
    assert res_lgas.status_code == 200
    lga_id = res_lgas.json()[0]["id"]

    # 1. Get LGA hierarchical drill-down
    res_drill = client.get(f"/api/collation/lga/{lga_id}")
    assert res_drill.status_code == 200
    data = res_drill.json()
    assert "lga" in data
    assert "wards" in data
    assert len(data["wards"]) > 0

    # 2. Sign-off LGA Collation (EC8C)
    res_sign = client.post(
        "/api/collation/signoff",
        headers=headers,
        json={
            "level": "LGA",
            "entity_id": lga_id,
            "notes": "EC8C signed off by Returning Officer",
            "status": "SIGNED",
        }
    )
    assert res_sign.status_code == 200
    sign_data = res_sign.json()
    assert sign_data["status"] == "SIGNED"
    assert sign_data["level"] == "LGA"

    # 3. Get all sign-offs
    res_list = client.get("/api/collation/signoffs")
    assert res_list.status_code == 200
    assert len(res_list.json()) > 0