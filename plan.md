# Implementation Plan: Render Backend Hosting & Managed PostgreSQL Deployment

## 1. Executive Summary & User Objectives
The user requested:
> *"lets host the backend on render now"*

The objective of this phase is to configure, verify, and document the automated production deployment of the **FastAPI Backend** and **Managed Persistent PostgreSQL Database** on **Render (`render.com`)** via the included Infrastructure-as-Code blueprint (`render.yaml`).

---

## 2. Technical Architecture & Render Blueprint Overview

### 2.1 Render Blueprint Architecture (`render.yaml`)
- **Web Service (`pdp-pollwatch-backend`)**:
  - Runtime: Python 3.11
  - Root Directory: `backend`
  - Build Command: `pip install --upgrade pip && pip install -r requirements.txt`
  - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - Health Check: `/docs` (returns HTTP 200)
  - Public URL: `https://pdp-pollwatch-backend.onrender.com`
- **Managed Persistent Database (`pdp-pollwatch-db`)**:
  - Engine: PostgreSQL 15/16
  - Database Name: `pollwatch`
  - User: `pollwatch_user`
  - `DATABASE_URL` automatically injected into the web service.

---

## 3. Implementation & Verification Steps

### Step 1: Automatic Database Provisioning & Seeding (`backend/app/seed.py`)
- Ensure `seed_database()` executed during application startup (`lifespan` in `app/main.py`) checks if `PollingUnit` count is 0 on the fresh Render PostgreSQL database.
- If empty, automatically populate:
  1. Super Admin account (`admin` / `PDP-ADMIN-2027`)
  2. Lead Polling Unit Agent (`agent` / `agent123`)
  3. Situation Room Coordinator accounts (`state_coord`, `lga_dutse`, etc.)
  4. All 27 authentic Jigawa LGAs
  5. All 285+ authentic INEC Wards
  6. All 4,827 official Polling Units with accurate registered voters
  7. Pure, live state: 0 mock results, 0 dummy incidents.

### Step 2: CORS & Service Host Configuration
- Update `backend/app/core/config.py`: Ensure `https://pdp-pollwatch-backend.onrender.com` and wildcard subdomains are in `ALLOWED_ORIGINS`.
- Update `mobile/lib/services/api_service.dart`: Ensure `https://pdp-pollwatch-backend.onrender.com` is present in server auto-detection candidates.
- Update `web/src/lib/api.js`: Support Render cloud URL as default remote backend when running outside localhost.

### Step 3: Local Validation & Pre-Deployment Check
- Verify `render.yaml` schema validity.
- Run a dry-run test simulating PostgreSQL connection string handling (`postgres://` -> `postgresql://`).
- Verify production build of web and Flutter analyze pass with 0 errors.

### Step 4: Step-by-Step Render 3-Click Deployment
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** &rarr; Select **Blueprint**.
3. Connect GitHub repository `sad809969/election_poll` on branch `main`.
4. Click **Apply**: Render automatically builds the Python FastAPI service and spins up the PostgreSQL database.

---

## 4. Verification Checklist
- [ ] `render.yaml` configured with web service, PostgreSQL database, and environment variables.
- [ ] Auto-seeding confirmed to populate all 27 LGAs, wards, and 4,827 Polling Units on fresh PostgreSQL.
- [ ] Mobile app candidate endpoints include Render backend URL.
- [ ] Web app CORS and API base URL compatible with Render.
- [ ] Git commit and push to GitHub `main` so Render Blueprint can immediately deploy.


