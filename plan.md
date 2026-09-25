# Implementation Plan: Vercel Deployment for Backend & Web UI

## Objective
Deploy the updated **FastAPI Backend** and **Next.js Web UI** to Vercel, resolve the `500 FUNCTION_INVOCATION_FAILED` on the live backend, align the frontend-to-backend API routing proxy, and push the verified merge commit to GitHub (`origin/main`).

---

## 1. Problem Analysis & Root Cause

### Backend Status on Vercel:
- **Current Live URL**: `https://jigawa-pdp-pollwatch-backend.vercel.app`
- **Current State**: Returns `500 FUNCTION_INVOCATION_FAILED`.
- **Root Cause**: When remote PR #4 was merged to GitHub `origin/main`, `SECRET_KEY: str = os.getenv("SECRET_KEY")` was introduced without a fallback. On Vercel, because `SECRET_KEY` was not configured in the environment variables, Pydantic crashed on cold start (`ValidationError: Input should be a valid string, got NoneType`).
- **Fix Already in Local Merge Commit (`2572674`)**: We added `SECRET_KEY: str = os.getenv("SECRET_KEY", "jigawa-pdp-pollwatch-2027-secret-key-123456789")` and tested `VERCEL=1` local execution—it successfully initializes `/tmp/pollwatch.db` and loads the API with zero errors.

### Frontend UI Status on Vercel:
- **Current Route Rule**: `web/vercel.json` has `"src": "/api/v1/(.*)"`, but all active FastAPI endpoints live under `/api/` (e.g., `/api/results`, `/api/auth/login`).
- **Need**: Update `web/vercel.json` and add `rewrites()` in `web/next.config.js` to proxy `/api/:path*` to `https://jigawa-pdp-pollwatch-backend.vercel.app/api/:path*`.

---

## 2. Proposed Changes

### Task 1: Update Frontend Vercel Proxy Config (`web/vercel.json`)
- Change the API route rewrite from `/api/v1/(.*)` to `/api/(.*)` pointing to `https://jigawa-pdp-pollwatch-backend.vercel.app/api/$1`.

### Task 2: Configure Next.js Rewrites (`web/next.config.js`)
- Add an `async rewrites()` function to proxy all `/api/:path*` calls to `https://jigawa-pdp-pollwatch-backend.vercel.app/api/:path*` (or `process.env.NEXT_PUBLIC_API_BASE_URL`).

### Task 3: Local Build & Pytest Verification
- Run `PYTHONPATH=. venv/bin/pytest tests/ -v` (confirm 15/15 pass).
- Run `npm run build` in `web/` (confirm 18/18 static pages generate cleanly).

### Task 4: Push to GitHub to Trigger Vercel Deployments
- Stage and commit the Vercel configuration updates.
- Push the branch to `origin main`:
  ```bash
  git push origin main
  ```
- This triggers Vercel's automated deployment pipelines for both projects:
  1. `jigawa-pdp-pollwatch-backend`
  2. `jigawa-pdp-pollwatch-web` (or root project)

### Task 5: Live Production Verification
- Query `https://jigawa-pdp-pollwatch-backend.vercel.app/` and `/api/results` via `curl` to verify `HTTP 200 OK`.
- Query the frontend deployment URL and take a browser screenshot to confirm live rendering.

---

## 3. User Approval Request
Please approve this plan so I can proceed with updating the Vercel configs and pushing to GitHub.
