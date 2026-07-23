import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "Jigawa PDP PollWatch" in data["system"]

def test_login_super_admin():
    response = client.post("/api/v1/auth/login", data={"username": "admin", "password": "password123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user_info"]["role"] == "Super Admin"

def test_get_lgas():
    response = client.get("/api/v1/electoral/lgas")
    assert response.status_code == 200
    lgas = response.json()
    assert len(lgas) == 27 # All 27 Jigawa LGAs
    lga_names = [l["name"] for l in lgas]
    assert "Dutse" in lga_names
    assert "Hadejia" in lga_names
    assert "Gumel" in lga_names

def test_result_summary():
    response = client.get("/api/v1/results/summary")
    assert response.status_code == 200
    summary = response.json()
    assert summary["total_polling_units"] == 4827
    assert summary["leading_party"] == "PDP"
