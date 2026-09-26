# Implementation Plan: Fix User Synchronization Between Side A and Side B

## Problem Diagnosis
The user reported: *"I added user in side A but unfortunately didn't reflect in side B"*.
Our investigation uncovered 4 interconnected root causes:

1. **Missing JWT Token on Side A Passcode Unlock**:
   - In `web/src/pages/system-admin.js`, unlocking with `PDP-ADMIN-2027` only sets `sessionStorage.setItem('pdp_master_admin_auth', 'true')`.
   - It did **not** store a JWT token in `localStorage.getItem('token')`.
   - In FastAPI, `POST /api/agents` and `GET /api/agents` require `require_admin` / `require_supervisor` via OAuth2 Bearer token.
   - If an admin entered Side A via passcode without prior login, `apiFetch('/agents')` sends no Authorization header, causing `401 Unauthorized`.
   - Thus, user creation either failed or Side B was unable to fetch live data.

2. **Hardcoded Fallback Masking on Side B (`/admin.js`)**:
   - In `web/src/pages/admin.js`, if `apiFetch('/agents')` fails (due to 401 or network error), it catches the error and silently renders `fallbackUsersList` (6 static hardcoded users).
   - This completely hides any real users in the system.

3. **Backend Sorting & Overload (4,835 Users)**:
   - In `backend/app/routers/agents.py`, `get_agents()` returns `db.query(User).order_by(User.full_name).all()`.
   - Because there are 4,835 seeded agents, ordering by `full_name` ascending buries any newly created user deep inside thousands of rows.
   - Side B has no pagination and was attempting to render all records, making new users difficult to locate.

4. **Serverless Ephemerality & Cross-Tab Sync**:
   - On Vercel serverless deployments, `/tmp/pollwatch.db` is ephemeral across lambda instances.
   - There was no client-side synchronization (`pdp_custom_users` in `localStorage`) or broadcast event to immediately sync users between Side A and Side B.

---

## Proposed Changes

### 1. Backend: Prioritize Newest Users (`backend/app/routers/agents.py`)
- Update `GET /api/agents` to sort by `User.id.desc()` so newly created users always appear at the very top.
- Add an optional `limit` parameter (default 100 or all) to prevent browser freezes when loading thousands of users.

### 2. Side A: Auto-Provision Admin Token on Unlock (`web/src/pages/system-admin.js`)
- When `PDP-ADMIN-2027` is entered in `system-admin.js`, automatically authenticate with the backend (or provision a valid Super Admin operator session into `localStorage`) so all subsequent API calls (`POST /api/agents`, `PATCH /api/agents`, `GET /api/agents`) are fully authorized.
- When a user is saved in `handleSaveUser`, write the new user to `pdp_custom_users` in `localStorage` and dispatch a `pdp_users_updated` window event for instant cross-tab and cross-page synchronization.

### 3. Side B: Seamless Real-Time Sync & Newest First (`web/src/pages/admin.js` & `web/src/pages/agents.js`)
- In `admin.js`:
  - Listen for the `pdp_users_updated` event and `storage` event so any user added in Side A appears in Side B **instantly** without a manual page refresh.
  - Merge `pdp_custom_users` with live backend users, ensuring custom/newly created users are pinned to the top of the table with a vibrant "NEW" badge.
  - If backend fetch returns 401 or empty, include `pdp_custom_users` on top of fallback data instead of masking them.
  - Add search and pagination/slicing to the user list table so newly added users are immediately visible.
- In `agents.js`:
  - Ensure custom users are integrated into the agents directory and status toggle.

### 4. Auth & Login Support (`web/src/lib/api.js` & `web/src/pages/login.js`)
- In `login.js` and `api.js`:
  - Allow newly created custom users stored in `pdp_custom_users` to log in smoothly even if the Vercel serverless SQLite database cold-started.
  - Respect the exact `allowed_pages` and role permissions saved during user creation.

---

## Verification Plan

### Automated & Manual Tests:
1. **Pytest Verification**:
   - Run existing test suite (`pytest tests/`) to ensure no regressions in auth, agents, or results endpoints.
2. **Side A to Side B Sync Test**:
   - Open Side A (`/system-admin`), create a test user (e.g., `user_sync_test` with role `LGA Coordinator` and specific Side A & Side B pages).
   - Navigate to Side B (`/admin` and `/agents`).
   - Verify `user_sync_test` appears at the very top of the table with correct role badge, phone, and allowed pages scope.
3. **Login & Sidebar Test**:
   - Log out and log in as `user_sync_test`.
   - Verify the sidebar filters precisely to the allowed pages assigned in Side A.
4. **Browser Verification**:
   - Capture browser screenshots of Side A and Side B demonstrating the live reflection.
