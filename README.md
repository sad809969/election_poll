# JIGAWA PDP POLLWATCH
### Election Situation Room & Monitoring System 2027

Jigawa PDP PollWatch is a secure, real-time Election Situation Room and Monitoring System engineered for the Jigawa State PDP Governorship Campaign across all 27 Local Government Areas (LGAs), 287 Wards, and 4,827 Polling Units in Jigawa State.

---

## System Architecture & Features

### 1. FastAPI Backend (`/backend`)
- **High-Performance REST APIs**: FastAPI (Python 3.11+), SQLAlchemy ORM, WebSockets, and Pydantic v2.
- **Demo Electoral Data (development)**: Seeds all **27 Jigawa State LGAs** (Dutse, Hadejia, Gumel, Kazaure, Ringim, Birnin Kudu, Babura, Jahun, Guri, Kaugama, Kiyawa, etc.), Wards, Polling Units, and 9 Authorization Roles.
- **Real-Time Vote Aggregation Engine**: Instant calculation of party vote tallies (PDP, APC, NNPP, LP, Others) and LGA completion rates.

### 2. Unified Flutter Command Center & Situation Room (`/mobile`)
- **100% Flutter & Dart (Cross-Platform Web, Mobile, Desktop)**:
  - Replaced legacy JS/Next.js with an adaptive, responsive Flutter Web & Mobile Command Suite.
  - **Situation Room Dashboard**: Live Jigawa KPI metrics, popular vote tallies (PDP, APC, NNPP, LP, Others), 27 LGA collation overview, and real-time incident alert ticker.
  - **Form EC8A Proof Inspection & Verification**: Pan/zoom official result sheet photos, approve verified results, or flag discrepancies for field correction.
  - **LGA Collation Center**: Real-time aggregate returning monitoring across all 27 Jigawa LGAs.
  - **Incident Command & Triage**: Severity-based incident resolution, GPS coordinates, and evidence photo viewer.
  - **Polling Unit Directory**: Monitor accreditation, voting, and counting across all 4,827 Jigawa polling units.
  - **Agent Roster & Accreditation**: Enroll and manage accredited field agents and coordinators.
  - **Broadcast Dispatch**: Send high-priority Situation Room instructions to field agents.
  - **Security & Audit Trail**: Real-time event logging and telemetry endpoint switcher.

### 3. Field Agent Mode (`/mobile`)
- **Agent Exclusive Auth**: Locked login credentials tied to pre-assigned Polling Unit with automatic role-based routing.
- **Election Timeline Tracker**: Log Accreditation, Voting, and Counting milestones with system timestamps.
- **Incident Reporting**: Categorize incidents, attach photos, and tag GPS coordinates.
- **Result Submission**: Input party vote counts, validate voter totals, and photograph and upload the official Form EC8A result sheet.

---

## Result Integrity & Verification Workflow

Every polling unit result moves through a fixed, audited workflow:

| Status | Meaning |
|---|---|
| `PENDING_PHOTO` | Figures submitted, no Form EC8A photo uploaded yet |
| `PENDING_REVIEW` | EC8A photo uploaded, awaiting Situation Room review |
| `VERIFIED` | Approved by a Situation Room officer against the EC8A photo |
| `FLAGGED` | Over-voting detected (Electoral Act 2022, Section 51) or flagged by the Situation Room |

- **Jurisdiction**: polling unit agents can submit only for their assigned polling unit; ward and LGA coordinators only within their ward or LGA.
- **Evidence required**: a result cannot be verified without an uploaded EC8A photo. Uploads are validated by file signature (JPEG/PNG/WEBP) and stored under random names.
- **No silent overwrites**: a verified result is locked. It must be flagged by the Situation Room before a corrected figure can be submitted.
- **Audit trail**: every submission, photo upload, approval and flag is written to the audit log with the acting user.
- **Authenticated access**: all result, collation, announcement and activity data requires a signed-in user.

---

## Production Configuration

Set `ENVIRONMENT=production` for any real deployment. In production the backend:

- refuses to start unless `SECRET_KEY` is a random value of at least 32 characters;
- never creates demo accounts or generated demo results;
- creates the initial `admin` account only if `ADMIN_INITIAL_PASSWORD` is set (at least 12 characters) and no admin exists yet. Existing passwords are never overwritten.

See `backend/.env.example` for all settings. Use a PostgreSQL `DATABASE_URL` and persistent storage for `UPLOAD_DIR`: serverless `/tmp` storage is wiped between invocations.

In development (the default) the demo dataset and demo accounts (e.g. `admin` / `admin1283`, `agent` / `agent123`) are seeded for evaluation. Do not use development mode with real election data.

---

## Database Operational Modes

### Mode 1: Automatic SQLite (Default / Pre-seeded)
- In development, the backend seeds a demo dataset for all 27 Jigawa State LGAs and demo accounts on startup (`/tmp/pollwatch.db` on Vercel).

### Mode 2: Production PostgreSQL (Neon / Supabase / Vercel Postgres)
Set environment variables in Vercel / server config:
- `DATABASE_URL` = `postgresql://user:pass@host:5432/pollwatch`

---

## Quick Setup Instructions

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
*API Swagger Documentation: `http://localhost:8000/docs`*

Run the test suite with `PYTHONPATH=. pytest tests -q`.

### Running the Flutter Unified Application (Web & Mobile)
```bash
cd mobile
flutter pub get

# 1. Run as Web Application (in Chrome or Edge)
flutter run -d chrome

# 2. Build Web Production Bundle
flutter build web --release

# 3. Run on Android / iOS / Linux desktop
flutter run
```

*Serve locally on port 3000:*
```bash
cd mobile/build/web
python3 -m http.server 3000
```
*Unified Situation Room & Agent Portal: `http://localhost:3000`*

---

## Deployment (Vercel Host)
The repository includes pre-configured Vercel hosting manifests:
- `web/vercel.json` for Next.js Web Dashboard (Root Directory: `web`)
- `backend/vercel.json` & `backend/api/index.py` for FastAPI Serverless Functions (Root Directory: `backend`)

---
© 2027 Jigawa PDP PollWatch. All rights reserved.
