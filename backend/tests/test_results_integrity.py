"""
Result integrity rules: jurisdiction, EC8A photo evidence and the
verification workflow.
"""
import io

import pytest
from pydantic import ValidationError

from app.core.config import DEV_SECRET_KEY, Settings
from app.models import User
from app.core.security import get_password_hash
from app.seed import DEMO_ADMIN_PASSWORD, seed_database
from app.services.upload_service import upload_service

from tests.test_api import TestingSessionLocal, client, get_admin_headers

JPEG_BYTES = b"\xff\xd8\xff\xe0" + b"\x00" * 64


@pytest.fixture(autouse=True)
def upload_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(upload_service, "upload_dir", tmp_path)
    return tmp_path


def login(username, password):
    res = client.post("/api/auth/login", data={"username": username, "password": password})
    assert res.status_code == 200
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def submit(headers, pu_id, election_type, pdp=100, apc=80):
    return client.post(
        "/api/results/submit",
        headers=headers,
        json={
            "polling_unit_id": pu_id,
            "election_type": election_type,
            "pdp_votes": pdp,
            "apc_votes": apc,
            "rejected_votes": 2,
        },
    )


def upload_photo(headers, result_id, content=JPEG_BYTES, name="ec8a.jpg", ctype="image/jpeg"):
    return client.post(
        f"/api/results/{result_id}/ec8a-photo",
        headers=headers,
        files={"file": (name, io.BytesIO(content), ctype)},
    )


def agent_polling_unit_id():
    db = TestingSessionLocal()
    try:
        return db.query(User).filter(User.username == "agent").first().polling_unit_id
    finally:
        db.close()


def test_agent_cannot_submit_outside_assigned_polling_unit():
    agent = login("agent", "agent123")
    own_pu = agent_polling_unit_id()

    res = submit(agent, own_pu + 1, "STATE_ASSEMBLY")
    assert res.status_code == 403

    res = submit(agent, own_pu, "STATE_ASSEMBLY")
    assert res.status_code == 200


def test_client_supplied_photo_url_is_ignored_and_never_auto_verified():
    agent = login("agent", "agent123")
    res = client.post(
        "/api/results/submit",
        headers=agent,
        json={
            "polling_unit_id": agent_polling_unit_id(),
            "election_type": "PRESIDENTIAL",
            "pdp_votes": 10,
            "ec8a_photo_url": "uploads/fake.jpg",
        },
    )
    assert res.status_code == 200
    assert res.json()["verification_status"] == "PENDING_PHOTO"


def test_verification_workflow_requires_uploaded_photo(upload_dir):
    agent = login("agent", "agent123")
    admin = get_admin_headers()
    pu_id = agent_polling_unit_id()

    result_id = submit(agent, pu_id, "SENATORIAL").json()["id"]

    # No photo yet: approval refused.
    res = client.post(f"/api/results/approve/{result_id}", headers=admin)
    assert res.status_code == 400
    assert "EC8A" in res.json()["detail"]

    # Non-image content is rejected even with an image extension.
    res = upload_photo(agent, result_id, content=b"not an image")
    assert res.status_code == 400

    res = upload_photo(agent, result_id)
    assert res.status_code == 200
    data = res.json()
    assert data["verification_status"] == "PENDING_REVIEW"
    assert data["ec8a_photo_url"].startswith("/api/uploads/results/")

    stored = data["ec8a_photo_url"].removeprefix("/api/uploads/")
    assert (upload_dir / stored).read_bytes() == JPEG_BYTES

    res = client.post(f"/api/results/approve/{result_id}", headers=admin)
    assert res.status_code == 200
    assert res.json()["verification_status"] == "VERIFIED"

    # A verified result is locked until the Situation Room flags it.
    assert submit(agent, pu_id, "SENATORIAL", pdp=999).status_code == 409
    assert upload_photo(agent, result_id).status_code == 409

    client.post(f"/api/results/flag/{result_id}?notes=recount", headers=admin)
    res = submit(agent, pu_id, "SENATORIAL", pdp=101)
    assert res.status_code == 200
    assert res.json()["verification_status"] == "PENDING_REVIEW"


def test_agent_cannot_upload_photo_for_another_polling_unit():
    admin = get_admin_headers()
    agent = login("agent", "agent123")
    other_pu = agent_polling_unit_id() + 1

    result_id = submit(admin, other_pu, "PRESIDENTIAL").json()["id"]
    assert upload_photo(agent, result_id).status_code == 403


def test_seed_does_not_reset_changed_passwords():
    db = TestingSessionLocal()
    admin = db.query(User).filter(User.username == "admin").first()
    admin.hashed_password = get_password_hash("a-new-strong-password")
    db.commit()

    seed_database(db=db)
    db.close()

    res = client.post("/api/auth/login", data={"username": "admin", "password": DEMO_ADMIN_PASSWORD})
    assert res.status_code == 401
    login("admin", "a-new-strong-password")

    # Restore for the other tests.
    db = TestingSessionLocal()
    admin = db.query(User).filter(User.username == "admin").first()
    admin.hashed_password = get_password_hash(DEMO_ADMIN_PASSWORD)
    db.commit()
    db.close()


def test_production_rejects_default_secret_key():
    with pytest.raises(ValidationError):
        Settings(ENVIRONMENT="production", SECRET_KEY=DEV_SECRET_KEY)

    with pytest.raises(ValidationError):
        Settings(ENVIRONMENT="production", SECRET_KEY="x" * 40, SEED_DEMO_DATA=True)

    prod = Settings(ENVIRONMENT="production", SECRET_KEY="x" * 40)
    assert prod.seed_demo_data is False
    assert Settings(ENVIRONMENT="development").seed_demo_data is True


def test_admin_has_no_master_password():
    for password in ("admin", "admin1283", "PDP-ADMIN-2027x"):
        res = client.post("/api/auth/login", data={"username": "admin", "password": password})
        assert res.status_code == 401


def test_admin_and_export_endpoints_require_admin():
    assert client.get("/api/exports/database-backup.json").status_code == 401
    assert client.get("/api/admin/lgas").status_code == 401

    agent = login("agent", "agent123")
    assert client.get("/api/exports/agents.csv", headers=agent).status_code == 403
    assert client.post("/api/admin/lgas", headers=agent, json={"name": "X", "code": "X"}).status_code == 403

    admin = get_admin_headers()
    assert client.get("/api/admin/lgas", headers=admin).status_code == 200
    assert client.get("/api/exports/stats", headers=admin).status_code == 200
