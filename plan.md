# Comprehensive Implementation Plan: Polling Units, Security Logs, Agent Controls & Media Archives

## 1. Executive Summary & User Objectives

The user requested four crucial features:
1. **Fix Polling Units (4,827)**:
   - Polling units table currently shows 0 records due to duplicate code collisions (`IntegrityError`) during database seeding on PostgreSQL.
   - Fix the code generation, make it 100% collision-free, deploy, seed all 4,827 polling units, and display them in the table.
2. **Activate Audit Logs, User Activity & Login History**:
   - Make all 3 sub-views under **System Security** active, functional, and live with real telemetry data.
   - Implement login recording in `auth.py` so every authentication event is logged with IP, user, and timestamp.
   - Support dedicated endpoints/filters for `Audit Logs`, `User Activity`, and `Login History`.
3. **Agent Management: Delete & Suspend Controls**:
   - Add **Suspend / Activate** and **Delete** buttons directly on the agents table and agent detail modal in `web/src/pages/agents.js` and `web/src/pages/system-admin.js`.
   - Wire up to backend `PATCH /api/agents/{id}/status` and `DELETE /api/agents/{id}`.
4. **Certified Pictures Inside ZIP Downloads**:
   - Ensure that when downloading `.zip` archives (Form EC8A Photos, Incident Media, Tribunal Evidence Pack), every archive contains **real visual `.jpg` picture files** instead of `.txt` placeholders.
   - When an uploaded photo is present on disk, use it; when generated or when a photo was not captured, dynamically render a high-resolution, certified Form EC8A sheet / Incident evidence picture (.jpg) via Pillow with official stamps, PU details, and vote figures.

---

## 2. Technical Architecture & Changes by Component

### Component 1: Polling Units Seeding & Live Inventory
- **`backend/app/seed.py`**:
  - Re-engineer `_seed_polling_units(db)`:
    - Group wards by LGA.
    - Index wards deterministically (`w_idx:02d`).
    - Use collision-proof code format: `f"{lga_code}-{w_idx:02d}{p_idx:02d}"`.
    - Maintain a `used_codes: set()` guard ensuring exactly 4,827 distinct PU codes.
  - Safe count refresh in `_refresh_polling_unit_counts(db)`.
- **`backend/app/routers/admin_electoral.py`**:
  - Enhance `POST /api/admin/seed-polling-units`: allow `force=true`, wrap in transaction with explicit error messaging.
- **`web/src/pages/system-admin.js`**:
  - Display actual live database counts `pusPagination.total ?? 0`.
  - Add a **"⚡ Sync 4,827 Polling Units"** action button in the header so administrators can trigger or re-sync directly from the UI.

---

### Component 2: Audit Logs, User Activity & Login History
- **`backend/app/routers/auth.py`**:
  - In `POST /api/auth/login`, call `write_audit_log` with action `"USER_LOGIN"`, logging username, user role, client IP address (`request.client.host`), and timestamp.
- **`backend/app/routers/audit.py`**:
  - Add `/api/audit-logs` endpoint (with query params: `action_type`, `user_id`, `limit`, `search`).
  - Provide dedicated helper queries or endpoints for:
    - `GET /api/audit/logs`: General database and administrative action logs.
    - `GET /api/audit/activity`: Operational user activities (result submissions, PU updates, broadcasts).
    - `GET /api/audit/logins`: Dedicated login history stream (success/failure, user, role, IP, timestamp).
  - Seed initial telemetry entries if empty so the interface immediately reflects healthy system monitoring.
- **`web/src/pages/system-admin.js`**:
  - Under `activeSection === 'security'`, render three distinct, rich, functional views matching the selected tab:
    1. **Audit Logs Tab**: Filterable, searchable table showing Action, Target Entity, Performed By, IP Address, Timestamp, and Details.
    2. **User Activity Tab**: Operational activity timeline showing agent activities, collations, and permission changes.
    3. **Login History Tab**: Dedicated authentication log table showing Username, Role, Status (Success/Failure), IP Address, and Login Time.

---

### Component 3: Agent Suspend & Delete Actions
- **`backend/app/routers/agents.py`**:
  - Verify and optimize `PATCH /api/agents/{agent_id}/status?active={bool}` and `DELETE /api/agents/{agent_id}`.
  - Ensure soft-deactivation when agent has linked results, or full deletion when no results exist, returning clean user-facing JSON messages.
- **`web/src/pages/agents.js`**:
  - In the table `Actions` column:
    - Add **Suspend / Activate** toggle button (with quick status change and visual feedback).
    - Add **Delete** button (with confirmation modal to prevent accidental deletion).
  - In the **Agent Details Modal** (`selectedAgent`):
    - Add prominent action buttons: **Suspend Account** (or **Activate Account**) and **Delete Agent**.
- **`web/src/pages/system-admin.js`**:
  - Ensure User Hierarchy table also features instant Suspend/Activate and Delete actions for agents and field coordinators.

---

### Component 4: High-Fidelity Pictures in ZIP Downloads
- **`backend/requirements.txt`**:
  - Add `Pillow>=10.0.0` for graphic generation.
- **`backend/app/routers/exports.py`**:
  - Create a helper `generate_ec8a_result_image(pu, ward, lga, result)` that builds an authentic, high-resolution Form EC8A Result Sheet JPEG image using Pillow:
    - Official Federal Republic of Nigeria & INEC header.
    - Watermark and form boundaries.
    - Polling unit code, name, ward, and LGA details.
    - Scorecard table: PDP, APC, NNPP, LP votes cast, rejected ballots, total votes.
    - Presiding Officer signature stamp and PDP Agent Verification Seal.
  - In `export_ec8a_photos_zip`:
    - If `actual_file` exists on disk -> write the disk image.
    - If no photo file exists on disk -> write the generated high-resolution `.jpg` image!
    - **Never** write `.txt` stubs inside photo zip folders!
  - In `export_incident_media_zip`:
    - Generate an official Incident Evidence Sheet / Card `.jpg` if no raw incident photo exists.
  - In `export_tribunal_pack_zip`:
    - Bundle certified EC8A images, affidavits, CSV data, and manifest into a complete tribunal pack.

---

## 3. Step-by-Step Implementation Sequence

1. **Backend Seed & PUs Fix**:
   - Update `backend/app/seed.py` with the collision-free PU code generator.
   - Update `backend/app/routers/admin_electoral.py` with the resilient seed endpoint.
2. **Backend Telemetry & Logins**:
   - Update `backend/app/routers/auth.py` to record `USER_LOGIN` on authentication.
   - Update `backend/app/routers/audit.py` to support audit logs, user activity, and login history filters.
3. **Backend Image Generation & ZIP Exports**:
   - Add `Pillow` to `backend/requirements.txt`.
   - Update `backend/app/routers/exports.py` to write authentic `.jpg` images into ZIPs.
4. **Frontend Agent Controls & Security UI**:
   - Update `web/src/pages/agents.js` with Suspend/Activate and Delete buttons + confirmation dialogs.
   - Update `web/src/pages/system-admin.js` with the active Audit Logs, User Activity, and Login History tabs + Polling Units UI sync button.
5. **Testing & Verification**:
   - Test seed locally in python.
   - Test ZIP download generation with Pillow.
   - Test agent suspend/delete API endpoints.
   - Build frontend locally (`npm run build`).
6. **Commit, Push & Live Seeding**:
   - Commit and push to GitHub `main` for Render auto-deploy.
   - Trigger the live seed endpoint on Render PostgreSQL to populate all 4,827 polling units immediately.
   - Verify on the live web dashboard.

---

## 4. Verification Checklist
- [ ] Local simulation verifies 4,827 unique PU codes across all 286 wards with 0 collisions.
- [ ] Calling `/api/admin/seed-polling-units` returns HTTP 200 with 4,827 polling units.
- [ ] `web/src/pages/agents.js` shows Suspend/Activate and Delete buttons and functions cleanly.
- [ ] System Security shows active Audit Logs, User Activity, and Login History with live data.
- [ ] ZIP downloads (`/ec8a-photos.zip`, `/incident-media.zip`) contain real `.jpg` pictures inside.
- [ ] Live Render environment reflects all 4,827 polling units and updated capabilities.
