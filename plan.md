# Implementation Plan: Super Admin Central Data & Media Export Vault

## 1. Executive Summary & Objective
The user requested a dedicated, unified hub inside **Super Admin** to download:
1. **Any set of data**: Election results by contest, field agent rosters, incident reports with GPS, polling unit directories, and system audit logs in CSV, Excel, or JSON formats.
2. **All pictures & media**: Batch ZIP archives of official Form EC8A Result Sheet photos, incident evidence images/videos, and a certified "Tribunal Legal Evidence Pack" (.ZIP) bundling all evidence for election tribunals.
3. **Interactive Media Inspector**: A visual photo browser allowing Super Admins to preview, search, filter, and inspect any uploaded ballot sheet or incident evidence photo before downloading.

---

## 2. Architecture & Implementation Breakdown

### Component 1: Backend Export & Media Engine (`backend/app/routers/exports.py`)
Create a dedicated `exports` router in FastAPI providing direct, streaming data and file downloads:

1. **Tabular Data Downloads**:
   - **`GET /api/exports/results.csv`**:
     - Exports comprehensive election results across all 4,827 Polling Units, 287 Wards, and 27 LGAs.
     - Supports optional query parameters: `election_type` (GOVERNORSHIP, SENATORIAL, etc.) and `lga_id`.
     - Fields: PU Code, PU Name, Ward, LGA, Registered Voters, PDP Votes, APC Votes, NNPP Votes, LP Votes, Others, Total Valid, Rejected, Total Cast, Over-voting Status, Verification Status, EC8A Photo Filename, Submission Timestamp.
   - **`GET /api/exports/agents.csv`**:
     - Complete roster of field agents, phone numbers, assigned polling unit, ward, LGA, check-in status, and role.
   - **`GET /api/exports/incidents.csv`**:
     - Full field incident register with Incident ID, Timestamp, Category, Severity, Description, Reported By, PU Code, Ward, LGA, Latitude, Longitude, and Media Filename.
   - **`GET /api/exports/polling-units.csv`**:
     - Master directory of all 4,827 Polling Units with registered voter quotas and coordinates.
   - **`GET /api/exports/audit-logs.csv`**:
     - Tamper-proof security audit log with timestamps, operator, action, IP, and details.
   - **`GET /api/exports/database-backup.json`**:
     - Complete JSON snapshot of all database tables for archival/backup.

2. **Media & Picture Downloads (Batch ZIP Archives)**:
   - **`GET /api/exports/ec8a-photos.zip`**:
     - Dynamically compiles all uploaded Form EC8A photo sheets from the uploads directory into a compressed `.zip` archive.
     - Files are organized inside the ZIP by `LGA / Ward / PU_Code_ElectionType.jpg`.
     - Supports optional `lga_id` parameter to download photos for a specific LGA.
   - **`GET /api/exports/incident-media.zip`**:
     - Compiles all incident evidence photos/videos into a single `.zip` file organized by severity and incident ID.
   - **`GET /api/exports/tribunal-evidence-pack.zip`**:
     - The ultimate legal package: bundles the certified Results CSV, all EC8A result photos, the Incident CSV, and Incident Photos into one court-ready legal archive.
   - **`GET /api/exports/media-list`**:
     - Returns a metadata list of all uploaded EC8A sheets and incident photos (thumbnail URL, filename, PU code, LGA, timestamp, file size) for the interactive frontend gallery.

3. **Router Registration (`backend/app/main.py`)**:
   - Mount `exports.router` under `/api/exports`.

---

### Component 2: Frontend Super Admin Data & Media Vault (`web/src/pages/system-admin.js`)

1. **Sidebar Navigation Integration**:
   - Add a prominent new navigation item in the Side A sidebar:
     - Icon: `FolderArchive` / `DownloadCloud`
     - Label: **"Data & Media Vault"**
     - Section Key: `activeSection === 'exports'`
   - Register in `ALL_SIDE_A_MODULES` as `side-a:exports`.

2. **Data & Media Vault Dashboard View**:
   - **Overview Metric Cards**:
     - 📸 **EC8A Photos in Vault** (count of verified result sheets).
     - 🚨 **Incident Media Files** (count of evidence photos).
     - 📊 **Result Records** (collated PU votes).
     - 💾 **Estimated Archive Size** & Database Status.
   
   - **Instant Bulk Download Cards**:
     - 📦 **Download All Form EC8A Photos (.ZIP)**: Complete archive of all result sheets.
     - ⚖️ **Download Tribunal Legal Evidence Pack (.ZIP)**: Certified results + photos + incidents.
     - 🚨 **Download Incident Evidence Media (.ZIP)**: All field evidence photos.
     - 📊 **Export Complete Results (.CSV / Excel)**: Granular PU level vote breakdown.
     - 👥 **Export Agents & Personnel Directory (.CSV)**: Complete phone roster.
     - 🛡️ **Export Immutable Audit Logs (.CSV)**: Security audit trail.
     - 🗄️ **Download System Database Snapshot (.JSON)**: Full database backup.

   - **Custom Filtered Export Bar**:
     - Filter by **Local Government Area (LGA)** (e.g. Dutse, Hadejia, Birnin Kudu, or All 27 LGAs).
     - Filter by **Election Contest** (Governorship, Senatorial, Presidential, etc.).
     - One-click button: *"Generate Filtered Export"*.

   - **Interactive Visual Photo & Evidence Inspector**:
     - A tabbed visual gallery:
       - Tab 1: **Form EC8A Result Sheets**
       - Tab 2: **Incident Evidence Photos**
     - Features:
       - Search by Polling Unit code, name, or LGA.
       - Photo cards displaying thumbnail, PU code, timestamp, and status badge.
       - Direct "Download Photo" button for individual files.
       - Click-to-zoom modal for inspecting signatures and INEC stamps in full resolution.

---

### Component 3: Side B Quick-Access Links (`web/src/pages/admin.js` & `web/src/pages/election-results.js`)
- Add a direct shortcut button **"Open Data & Media Vault"** in Side B User Management and Election Results pages, guiding Super Admins directly into the comprehensive export vault.

---

## 3. Visual & Aesthetic Standards (PDP Design System)
- Theme: Deep Midnight Slate (`#070D1E`), Dark Surface (`#0B132B`), Card Container (`#141E38`).
- Accent Colors: PDP Emerald Green (`#008751`, `#10B981`), Cobalt Blue (`#3B82F6`), Amber (`#F59E0B`), Ruby Red (`#EF4444`).
- Interactive States: Smooth hover transitions, loading spinners on ZIP generation, clear progress feedback.

---

## 4. Execution Steps
1. **Create Backend Exports Router (`backend/app/routers/exports.py`)**:
   - Implement CSV streaming for Results, Agents, Incidents, PUs, and Audit Logs.
   - Implement ZIP generation using Python's `zipfile` and `io.BytesIO`.
   - Implement media list endpoint.
2. **Register Router in `backend/app/main.py`**.
3. **Upgrade Super Admin Page (`web/src/pages/system-admin.js`)**:
   - Add sidebar navigation and `activeSection === 'exports'` interface.
   - Build metrics, bulk downloads, filtered exports, and the visual photo inspector.
4. **Test & Verify**:
   - Verify CSV exports return valid CSV data with correct headers.
   - Verify ZIP endpoints package media cleanly without errors.
   - Run linter / static checks on both frontend and backend.
5. **Commit & Push to GitHub**.
