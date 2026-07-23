# JIGAWA PDP POLLWATCH
### Election Situation Room & Monitoring System 2027

Jigawa PDP PollWatch is a secure, real-time Election Situation Room and Monitoring System engineered for the Jigawa State PDP Governorship Campaign across all 27 Local Government Areas (LGAs), 287 Wards, and 4,827 Polling Units in Jigawa State.

---

## System Architecture & Features

### 1. FastAPI Backend (`/backend`)
- **High-Performance REST APIs**: FastAPI (Python 3.11+), SQLAlchemy ORM, WebSockets, and Pydantic v2.
- **Pre-Seeded Electoral Data**: Populated with all **27 Jigawa State LGAs** (Dutse, Hadejia, Gumel, Kazaure, Ringim, Birnin Kudu, Babura, Jahun, Guri, Kaugama, Kiyawa, etc.), Wards, Polling Units, and 9 Authorization Roles.
- **Real-Time Vote Aggregation Engine**: Instant calculation of party vote tallies (PDP, APC, NNPP, LP, Others) and LGA completion rates.

### 2. Next.js Command Center Dashboard (`/web`)
- **Situation Room Monitoring Dashboard (Dark Theme `#0F172A`)**: Interactive Jigawa State vector map, color-coded PU health pins (Normal, Attention, Critical, No Report), live report stream, hourly timeline graph, incident pie chart, LGA progress bars, and critical alert panel.
- **Admin & User Management Portal (Light Theme)**: User management table across all 9 roles, role distribution donut chart, system stats, and Excel agent import launcher.
- **Communication Center**: Broadcast channels, chat thread inspector, pinned guidelines, message templates, and delivery metrics.
- **Results Dashboard & Collation Engine**: Party vote share donut chart, 27 LGA collation table, recent PU results feed with EC8A sheet photo proof verification status, and PDF/Excel export center.

### 3. Flutter Polling Unit Agent Mobile App (`/mobile`)
- **Agent Exclusive Auth**: Locked login credentials tied to pre-assigned Polling Unit.
- **Offline Storage & Auto-Sync Queue**: Persistent Hive/SQLite offline queue for areas with poor internet connection.
- **Election Timeline Tracker**: Log Accreditation, Voting, and Counting milestones with system timestamps.
- **Incident Reporting**: Categorize incidents (Violence, BVAS Issues, Intimidation, etc.), select severity, attach photos, and tag GPS coordinates.
- **Result Submission**: Input party vote counts, validate voter totals, and upload official EC8A result sheet photo.

---

## Database Operational Modes

### Mode 1: Automatic SQLite (Default / Pre-seeded)
- Backend automatically seeds all 27 Jigawa State LGAs and default accounts on startup (`/tmp/pollwatch.db` on Vercel).

### Mode 2: Production PostgreSQL (Neon / Supabase / Vercel Postgres)
Set environment variables in Vercel / server config:
- `DATABASE_URL` = `postgresql+asyncpg://user:pass@host:5432/pollwatch`
- `SYNC_DATABASE_URL` = `postgresql://user:pass@host:5432/pollwatch`

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
