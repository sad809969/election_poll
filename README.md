# JIGAWA PDP POLLWATCH
### Election Situation Room & Monitoring System 2027

Jigawa PDP PollWatch is a secure, real-time Election Situation Room and Monitoring System engineered for the Jigawa State PDP Governorship Campaign across all 27 Local Government Areas (LGAs), 287 Wards, and 4,827 Polling Units in Jigawa State.

---

## System Architecture & Features

### 1. FastAPI Backend (`/backend`)
- **High-Performance REST APIs**: FastAPI (Python 3.11+), SQLAlchemy ORM, WebSockets, and Pydantic v2.
- **Demo Electoral Data (development)**: Seeds all **27 Jigawa State LGAs** (Dutse, Hadejia, Gumel, Kazaure, Ringim, Birnin Kudu, Babura, Jahun, Guri, Kaugama, Kiyawa, etc.), Wards, Polling Units, and 9 Authorization Roles.
- **Real-Time Vote Aggregation Engine**: Instant calculation of party vote tallies (PDP, APC, NNPP, LP, Others) and LGA completion rates.

### 2. Next.js Command Center Dashboard (`/web`)
- **Situation Room Monitoring Dashboard (Dark Theme `#0F172A`)**: Interactive Jigawa State vector map, color-coded PU health pins (Normal, Attention, Critical, No Report), live report stream, hourly timeline graph, incident pie chart, LGA progress bars, and critical alert panel.
- **Admin & User Management Portal (Light Theme)**: User management table across all 9 roles, role distribution donut chart, system stats, and Excel agent import launcher.
- **Communication Center**: Broadcast channels, chat thread inspector, pinned guidelines, message templates, and delivery metrics.
- **Results Dashboard & Collation Engine**: Party vote share donut chart, 27 LGA collation table, recent PU results feed with EC8A sheet photo proof verification status, and PDF/Excel export center.

### 3. Flutter Polling Unit Agent Mobile App (`/mobile`)
- **Agent Exclusive Auth**: Locked login credentials tied to pre-assigned Polling Unit.
- **Election Timeline Tracker**: Log Accreditation, Voting, and Counting milestones with system timestamps.
- **Incident Reporting**: Categorize incidents (Violence, BVAS Issues, Intimidation, etc.), select severity, attach photos, and tag GPS coordinates.
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

### Web Dashboard Setup
```bash
cd web
npm install
npm run dev
```
*Web Command Center: `http://localhost:3000`*

### Mobile App Setup
```bash
cd mobile
flutter pub get
flutter run
```

---

## Deployment (Vercel Host)
The repository includes pre-configured Vercel hosting manifests:
- `web/vercel.json` for Next.js Web Dashboard (Root Directory: `web`)
- `backend/vercel.json` & `backend/api/index.py` for FastAPI Serverless Functions (Root Directory: `backend`)

---
© 2027 Jigawa PDP PollWatch. All rights reserved.
