# Implementation Plan: Fix Polling Unit Agent Login & Production Deployment Setup for Render and Neotech Hosting

## 1. Problem Diagnosis & Root Causes

### Issue A: Polling Unit Agent Details Not Accepted on Mobile App
1. **Vercel Ephemeral SQLite Reset**:
   - On Vercel, the backend database is located in `/tmp/pollwatch.db`.
   - In serverless environments, each Lambda function is spun up independently and `/tmp` is wiped on cold starts.
   - When a polling unit agent is created in Side A on the web, it exists only in that specific transient container. When the mobile app attempts to authenticate against `https://jigawa-pdp-pollwatch-backend.vercel.app/api/auth/login`, it hits a cold-started container where the newly created agent does not exist in the database, triggering `401 Unauthorized: Incorrect username or password`.
2. **Phone Number & Whitespace Mismatches**:
   - Polling unit agents frequently enter phone numbers with spaces (e.g., `0803 123 4567`) or international prefixes (`+234...`), while the login screen might send `08031234567`. The backend previously did an exact string match without stripping spaces or formatting.
3. **Mobile Network Timeout on Cold Starts**:
   - `mobile/lib/services/api_service.dart` had a tight 6-second timeout. Serverless cold starts or slow mobile cellular connections in the field exceed 6 seconds, causing connection drops.
4. **Chained Request Failure**:
   - After `/auth/login`, the mobile app attempted a second call to `/auth/me` and a third to `/electoral/polling-units/$puId`. If the agent was created without a polling unit assigned, or if the PU call timed out, login failed.

### Issue B: Need for Persistent Production Hosting (Render & Neotech Hosting)
- The application requires persistent databases (PostgreSQL or persistent disk) so that all agents, polling units, and results created anywhere are permanently saved and accessible across all web and mobile clients worldwide.

---

## 2. Proposed Changes

### Component 1: Backend Auth & Phone Normalization (`backend/app/routers/auth.py`)
- Clean and normalize phone numbers (strip spaces, hyphens, and standard Nigeria `+234`/`0` prefixes) so logging in with `0803 123 4567`, `08031234567`, or `+2348031234567` succeeds seamlessly.
- Perform case-insensitive username checks (`func.lower(User.username) == form_data.username.lower()`).
- Return full agent profile data directly in the `/auth/login` response (`id`, `full_name`, `username`, `role`, `polling_unit_id`, `lga_id`, `ward_id`, `allowed_pages`) so mobile clients have instant access without chaining additional requests.

### Component 2: Mobile App Resilience & Server Presets (`mobile/`)
- In `api_service.dart`:
  - Increase timeout to 15 seconds to support field cellular connections.
  - Parse user details directly from the login response.
  - If PU details are missing or null, provide graceful fallbacks (`Assigned Polling Unit`, `DUT-01`, `Jigawa Command`) so the agent is never locked out of their dashboard.
- In `login_screen.dart`:
  - Add quick-select server preset chips in the connection dialog:
    - **Render**: `https://jigawa-pdp-pollwatch.onrender.com/api`
    - **Neotech Hosting**: `https://api.pdpjigawa2027.com/api`
    - **Vercel Cloud**: `https://jigawa-pdp-pollwatch-backend.vercel.app/api`
    - **Local / USB**: `http://10.0.2.2:8000/api` or `http://127.0.0.1:8000/api`
  - Show clear, user-friendly error messages if credentials or server settings fail.

### Component 3: Database & PostgreSQL Support (`backend/`)
- Add `psycopg2-binary>=2.9.9` to `backend/requirements.txt`.
- Update `backend/app/database.py` to automatically normalize `postgres://` to `postgresql://` (required by SQLAlchemy on Render).
- Ensure CORS in `backend/app/core/config.py` allows all domains (`*`, Render, Neotech Hosting, Vercel, localhost).

### Component 4: Render Production Deployment Setup
- Create `render.yaml` (Infrastructure-as-Code Blueprint):
  - Web Service for FastAPI running `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
  - Managed PostgreSQL database service (`pdp-pollwatch-db`).
  - Auto-linked `DATABASE_URL` environment variable.
  - Automatic database initialization and seeding on startup.
- Update `Dockerfile` for Render container builds with non-root user and production uvicorn parameters.

### Component 5: Neotech Hosting Deployment Setup
- Create `passenger_wsgi.py` for cPanel Python App Setup on Neotech Hosting.
- Create `deploy_neotech.sh` for one-click setup on Linux VPS / Neotech Hosting with virtual environment, dependencies, and database migrations.
- Create `systemd/pdp-pollwatch.service` for automatic background process management and auto-restart on boot.
- Create `nginx/pdp-pollwatch.conf` for production Nginx reverse proxy with SSL and websocket support.
- Create `docker-compose.prod.yml` for containerized Neotech hosting with PostgreSQL and FastAPI.

---

## 3. Verification Plan

1. **Backend Auth & Phone Normalization Test**:
   - Run Python verification testing login with various formats: standard username, lowercase/uppercase, phone number with spaces (`0803 123 4567`), raw phone (`08031234567`), and international format (`+2348031234567`).
2. **Agent Creation & Mobile Login Simulation**:
   - Create a new Polling Unit Agent via `/agents` API.
   - Simulate mobile login using the exact request payload sent by the Flutter app.
   - Verify token and profile return instantly.
3. **Database URL & PostgreSQL Engine Test**:
   - Verify `database.py` correctly parses both SQLite and PostgreSQL URLs.
4. **Pytest Suite**:
   - Run `PYTHONPATH=. pytest tests/` to confirm all 15/15 tests continue to pass.
5. **Flutter Static Analysis**:
   - Run `flutter analyze` or Dart checks to verify mobile app code compiles cleanly.
