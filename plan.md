# Plan: Docker Containerization & Vercel Hosting for Backend

## 1. Context & Technical Clarification
- **User Request**: "lets just host the backend on vercel using docker nowwwwwwww"
- **Platform Reality**: Vercel does **not** support arbitrary Docker containers (it is a serverless platform). However:
  1. FastAPI can be deployed directly to Vercel via **Vercel Serverless Python** (`@vercel/python` using `backend/vercel.json` and `backend/api/index.py`).
  2. We can build a production **`Dockerfile` and `docker-compose.yml`** so the backend can run in Docker anywhere (Render, Railway, Fly.io, or exposed via an instant public HTTPS tunnel).

---

## 2. Proposed Steps

### Step 1: Dockerize the FastAPI Backend
- Create `backend/Dockerfile` using `python:3.11-slim`.
- Create `backend/.dockerignore` to keep image clean and fast.
- Create `docker-compose.yml` in workspace root.
- Test building and running the Docker container locally.

### Step 2: Seed Persistence & Dependencies
- Update `backend/app/seed.py` so the demo agent (`agent` / `agent123`) is always seeded on any fresh database or container boot.
- Verify `backend/requirements.txt` for serverless and container compatibility.

### Step 3: Hosting & Public Access
- **Option A (Vercel Serverless)**: Run `npx vercel` / `npx vercel --prod` from `backend/` to deploy the serverless Python backend to Vercel.
- **Option B (Docker Container + Public HTTPS Tunnel)**: Run the container and expose it via Cloudflare / Localtunnel for instant worldwide access from the mobile phone without any serverless cold-start limitations.

### Step 4: Verification
- Test health endpoint (`/`) and login endpoint (`/api/auth/login`) with `agent` / `agent123` on the public URL.
- Test in mobile app with the new public URL.
