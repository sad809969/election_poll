#!/usr/bin/env python3
"""
Comprehensive End-to-End Verification of all Mobile Endpoints:
1. Authentication (POST /api/auth/login)
2. Profile Enrichment (GET /api/auth/me)
3. Polling Unit Retrieval & Hierarchy (GET /api/electoral/polling-units/{id})
4. Multipart Photo & Media Upload (POST /api/upload)
5. EC8A Result Submission (POST /api/results/submit)
6. Over-voting Check & Tribunal Alert (POST /api/results/submit)
7. Field Incident Dispatch (POST /api/incidents)
8. Incident Feed (GET /api/incidents)
9. Timeline Milestone Tracking (POST /api/activities)
10. Timeline Retrieval (GET /api/activities)
11. Web Collation & Results Sync (GET /api/results)
"""

import sys
import io
import json
import requests

BASE_URL = "http://127.0.0.1:8000/api"
ROOT_URL = "http://127.0.0.1:8000"

def log_test(step_num, title, status, details=None):
    symbol = "✅" if status else "❌"
    print(f"{symbol} [STEP {step_num}] {title}")
    if details:
        print(f"   ↳ {details}")

def run_tests():
    print("=" * 70)
    print("STARTING MOBILE ENDPOINT VERIFICATION SUITE")
    print("=" * 70)

    # 1. Login
    login_payload = {"username": "agent", "password": "agent123"}
    resp = requests.post(f"{BASE_URL}/auth/login", data=login_payload)
    if resp.status_code != 200:
        log_test(1, "Agent Authentication", False, f"HTTP {resp.status_code}: {resp.text}")
        sys.exit(1)
    
    login_data = resp.json()
    token = login_data.get("access_token")
    pu_id = login_data.get("polling_unit_id") or 1
    headers = {"Authorization": f"Bearer {token}"}
    log_test(1, "Agent Authentication", True, f"Token received. User ID: {login_data.get('id')}, PU ID: {pu_id}")

    # 2. Get Profile
    resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    assert resp.status_code == 200, f"Failed auth/me: {resp.text}"
    me_data = resp.json()
    log_test(2, "Profile Enrichment", True, f"Full Name: '{me_data.get('full_name')}', Role: '{me_data.get('role')}'")

    # 3. Polling Unit Retrieval
    resp = requests.get(f"{BASE_URL}/electoral/polling-units/{pu_id}", headers=headers)
    assert resp.status_code == 200, f"Failed PU retrieval: {resp.text}"
    pu_data = resp.json()
    lga_name = pu_data.get("lga", {}).get("name") or pu_data.get("lga_name")
    ward_name = pu_data.get("ward", {}).get("name") or pu_data.get("ward_name")
    voters = pu_data.get("registered_voters")
    assert lga_name == "Dutse", f"Expected Dutse, got: {lga_name}"
    assert voters == 623, f"Expected 623 registered voters, got: {voters}"
    log_test(3, "Polling Unit & Hierarchy", True, f"PU: {pu_data['code']} - {pu_data['name']} | LGA: {lga_name} | Ward: {ward_name} | Voters: {voters}")

    # 4. Multipart Photo Upload (EC8A Sheet)
    tiny_jpeg = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' \",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9'
    files = {"file": ("ec8a_sheet.jpg", io.BytesIO(tiny_jpeg), "image/jpeg")}
    data = {"subfolder": "results"}
    resp = requests.post(f"{BASE_URL}/upload", headers=headers, files=files, data=data)
    assert resp.status_code == 201, f"Failed upload: {resp.text}"
    upload_res = resp.json()
    photo_url = upload_res["url"]
    log_test(4, "Multipart File Upload (EC8A Photo)", True, f"Saved URL: {photo_url}")

    # Verify download of uploaded file
    get_file_resp = requests.get(f"{ROOT_URL}{photo_url}")
    assert get_file_resp.status_code == 200, f"Cannot fetch uploaded file: {get_file_resp.status_code}"
    log_test(4.1, "Static File Serve Verification", True, f"HTTP 200 verified, content size: {len(get_file_resp.content)} bytes")

    # 5. Result Submission (Valid Form EC8A)
    result_payload = {
        "polling_unit_id": pu_id,
        "election_type": "GOVERNORSHIP",
        "pdp_votes": 280,
        "apc_votes": 195,
        "nnpp_votes": 45,
        "lp_votes": 12,
        "others_votes": 3,
        "rejected_votes": 5,
        "ec8a_photo_url": photo_url,
        "notes": "[GPS Geotag: 11.758300, 9.338100 | Accuracy: ±3.5m | Status: LOCKED]"
    }
    resp = requests.post(f"{BASE_URL}/results/submit", headers=headers, json=result_payload)
    assert resp.status_code == 200, f"Failed result submit: {resp.text}"
    res_data = resp.json()
    assert res_data.get("verification_status") == "VERIFIED", f"Expected VERIFIED, got: {res_data}"
    assert res_data.get("is_overvoting") is False, "Did not expect overvoting"
    log_test(5, "Form EC8A Result Submission", True, f"Status: {res_data['verification_status']}, Overvoting: {res_data['is_overvoting']}")

    # 6. Over-voting Detection Check
    overvoting_payload = {
        "polling_unit_id": pu_id,
        "election_type": "SENATORIAL",
        "pdp_votes": 400,
        "apc_votes": 300, # Total = 700 > 623 registered
        "nnpp_votes": 50,
        "lp_votes": 10,
        "others_votes": 0,
        "rejected_votes": 0,
        "ec8a_photo_url": photo_url,
        "notes": "Test overvoting scenario"
    }
    resp = requests.post(f"{BASE_URL}/results/submit", headers=headers, json=overvoting_payload)
    assert resp.status_code == 200, f"Failed overvoting check: {resp.text}"
    ov_data = resp.json()
    assert ov_data.get("is_overvoting") is True, f"Expected overvoting True, got: {ov_data}"
    assert ov_data.get("verification_status") == "FLAGGED", f"Expected FLAGGED, got: {ov_data}"
    log_test(6, "Over-voting Detection (Electoral Act 2022 Sec 51)", True, f"Status: {ov_data['verification_status']}, Overvoting: {ov_data['is_overvoting']}")

    # 7. Incident Dispatch with GPS
    files_inc = {"file": ("incident_evidence.jpg", io.BytesIO(tiny_jpeg), "image/jpeg")}
    inc_upload_resp = requests.post(f"{BASE_URL}/upload", headers=headers, files=files_inc, data={"subfolder": "incidents"})
    inc_media_url = inc_upload_resp.json()["url"]

    incident_payload = {
        "polling_unit_id": pu_id,
        "incident_type": "BVAS Technical Glitch",
        "severity": "HIGH",
        "description": "BVAS device fingerprint scanner unresponsive during accreditation.",
        "media_url": inc_media_url,
        "latitude": 11.7583,
        "longitude": 9.3381
    }
    resp = requests.post(f"{BASE_URL}/incidents", headers=headers, json=incident_payload)
    assert resp.status_code == 201, f"Failed incident creation: {resp.text}"
    inc_data = resp.json()
    assert inc_data.get("polling_unit_code") == "DUT-0101", f"Expected DUT-0101, got: {inc_data}"
    assert inc_data.get("lga_name") == "Dutse", f"Expected Dutse, got: {inc_data}"
    assert inc_data.get("reporter_name") == "Lead Polling Agent (Demo)", f"Expected reporter name, got: {inc_data}"
    log_test(7, "Incident Dispatch with GPS & Media", True, f"ID: {inc_data['id']} | PU: {inc_data['polling_unit_code']} ({inc_data['lga_name']}) | Reporter: {inc_data['reporter_name']}")

    # 8. Incident Feed
    resp = requests.get(f"{BASE_URL}/incidents?polling_unit_id={pu_id}", headers=headers)
    assert resp.status_code == 200, f"Failed incident feed: {resp.text}"
    incidents_list = resp.json()
    assert len(incidents_list) > 0, "No incidents returned"
    log_test(8, "Incident Feed Retrieval", True, f"Total PU Incidents: {len(incidents_list)}")

    # 9. Timeline Milestone Recording
    activity_payload = {
        "polling_unit_id": pu_id,
        "activity_type": "Accreditation Started",
        "notes": "Accreditation and voter verification underway with active BVAS units."
    }
    resp = requests.post(f"{BASE_URL}/activities", headers=headers, json=activity_payload)
    assert resp.status_code == 201, f"Failed activity record: {resp.text}"
    act_data = resp.json()
    log_test(9, "Timeline Milestone Recording", True, f"Milestone: '{act_data['activity_type']}' recorded at {act_data['created_at']}")

    # 10. Timeline Retrieval
    resp = requests.get(f"{BASE_URL}/activities?polling_unit_id={pu_id}", headers=headers)
    assert resp.status_code == 200, f"Failed activities retrieval: {resp.text}"
    act_list = resp.json()
    assert len(act_list) > 0, "No activities returned"
    log_test(10, "Timeline Milestones Sync", True, f"Total Polling Unit Milestones: {len(act_list)}")

    # 11. Results Aggregation & Web Collation Sync
    resp = requests.get(f"{BASE_URL}/results?election_type=GOVERNORSHIP", headers=headers)
    assert resp.status_code == 200, f"Failed results summary: {resp.text}"
    results_summary = resp.json()
    summary = results_summary.get("summary", {})
    pdp_votes = summary.get("pdp_votes")
    verified_ec8a = summary.get("verified_ec8a")
    log_test(11, "Live Web Dashboard Collation Sync", True, f"Collated PUs: {verified_ec8a} | PDP Votes: {pdp_votes} | Leading Margin: {summary.get('lead_margin')}")

    print("=" * 70)
    print("ALL 11 MOBILE ENDPOINT VERIFICATION TESTS PASSED SUCCESSFULLY! 🎯")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
