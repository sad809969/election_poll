# Implementation Plan: Full-Stack Render Hosting (Frontend + Backend + PostgreSQL)

## 1. Executive Summary & User Objectives
The user requested:
> *"lets go on render also for the frontend tooo"*

Along with two screenshots from the Render dashboard showing:
1. **`pdp-pollwatch-db`**: Database created successfully (green checkmark).
2. **`pdp-pollwatch-backend`**: Exited with status 1 on initial startup.

The objectives of this phase:
1. **Diagnose and Resolve Backend Startup Failure**:
   - Add database connection wait/retry logic (`init_db` and `seed_database`) with exponential backoff so the FastAPI app gracefully waits for Render's newly provisioned PostgreSQL container to finish initial boot.
   - Ensure the start command (`sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"`) handles Render dynamic port binding.
2. **Add Next.js Frontend (`pdp-pollwatch-web`) to Render Blueprint (`render.yaml`)**:
   - Add the web frontend as a web service running Node.js 20.
   - Configure build command (`npm install && npm run build`) and start command (`npx next start -p $PORT`).
   - Automatically inject `NEXT_PUBLIC_API_URL: https://pdp-pollwatch-backend.onrender.com/api`.
3. **Synchronize & Re-Deploy**:
   - Push updates to `main` so clicking **Manual Sync** or **Deploy Latest Commit** on Render automatically deploys all three components together.

---

## 2. Technical Architecture & Blueprint Additions

### 2.1 Complete Render Infrastructure Blueprint (`render.yaml`)
1. **Database (`pdp-pollwatch-db`)**:
   - Engine: PostgreSQL (Already Created & Healthy)
2. **Backend Service (`pdp-pollwatch-backend`)**:
   - Runtime: Python 3.11
   - Root Directory: `backend`
   - Start Command: `sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"`
   - Connected to `pdp-pollwatch-db` via `DATABASE_URL`
   - Added database readiness retry loop (10 attempts, 5s delay)
3. **Frontend Service (`pdp-pollwatch-web`)**:
   - Runtime: Node.js 20
   - Root Directory: `web`
   - Build Command: `npm install && npm run build`
   - Start Command: `npx next start -p $PORT`
   - Public URL: `https://pdp-pollwatch-web.onrender.com`
   - Environment Variable: `NEXT_PUBLIC_API_URL=https://pdp-pollwatch-backend.onrender.com/api`

---

## 3. Implementation Steps

### Step 1: Database Connection Retry Resilience (`backend/app/database.py` & `seed.py`)
- In `backend/app/database.py`, update `init_db()` with a retry loop (10 retries, 5s delay) catching `OperationalError` while Render PostgreSQL completes boot.
- In `backend/app/seed.py`, wrap database session acquisition in connection retry.

### Step 2: Add Web Frontend to `render.yaml`
- Add `pdp-pollwatch-web` web service definition to `render.yaml`.
- Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_API_BASE_URL` to point to the backend service URL.
- In `web/package.json`, ensure `next start` respects dynamic `$PORT`.

### Step 3: Local Verification & Test
- Run `npm run build` in `web/` to confirm clean production compilation.
- Verify `backend/venv/bin/python` executes startup and seeding cleanly.

### Step 4: Commit, Push, and Deploy
- Commit and push to `origin main`.
- In Render Dashboard, click **Manual Sync** on the Blueprint to redeploy the backend and provision the frontend.

---

## 4. Verification Checklist
- [ ] Database retry loop prevents exit status 1 during initial PostgreSQL container boot.
- [ ] `render.yaml` includes all 3 services: Database, FastAPI Backend, and Next.js Frontend.
- [ ] Next.js build passes cleanly with zero errors.
- [ ] Render Blueprint sync deploys backend and frontend to live `.onrender.com` domains.


