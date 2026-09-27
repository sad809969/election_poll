# Implementation Plan: Clean Merge, Real Database State, and Side A Live Operations

## 1. Executive Summary & Objective
This plan addresses the user's instructions:
1. **Merge & Reconcile `origin/musab` into `main`**:
   - Integrate Musab's `ElectionAgentAssignment` database model and Alembic migration.
   - Integrate Musab's removal of dummy data from `web/src/pages/election-results.js` (empty state when no results exist).
   - Preserve all existing features on `main` (Super Admin Data & Media Vault, Mobile Camera Geotagging).
   - Provide cross-platform `package.json` scripts that work on both Windows and Linux without syntax errors.
2. **Database Clean Slate (Real Live Data Only)**:
   - Preserve all real electoral infrastructure: 27 LGAs, 299 Wards, 4,827 Polling Units of Jigawa State.
   - Ensure Super Admin login(s) exist and are active in the database.
   - Seed real INEC registered political parties (`PDP`, `APC`, `NNPP`, `LP`, `ADC`, `APGA`, etc.).
   - Purge all simulated mock results, mock incidents, and hardcoded test data so the system only reflects real, live submissions.
3. **Side A Master Overview Dashboard**:
   - Wire the Side A Dashboard (`activeSection === 'dashboard'`) directly to live database counts (real LGAs, Wards, PUs, Users, Results, Incidents, System Health).
4. **Side A Permissions Matrix**:
   - Connect the unified Permissions Matrix directly to the backend database (`allowed_pages` in `users` table).
   - Allow Super Admins to view, toggle, and save live permissions for any role or user.
5. **Side A Electoral Infrastructure & Party Management**:
   - Provide full CRUD (Create, Read, Update, Delete) interfaces in Side A for:
     - **LGAs** (view, add, edit, delete)
     - **Wards** (view, filter by LGA, add, edit, delete)
     - **Polling Units** (search, filter by LGA/Ward, pagination, add, edit, delete)
     - **Political Parties** (view, add new party, edit color/abbreviation/logo, toggle active, delete)
   - Backed by clean REST API endpoints in the backend.

---

## 2. Technical Architecture & File Changes

### Step 1: Merge `origin/musab` into `main`
- Run `git merge origin/musab` and resolve any conflicts:
  - In `backend/app/models.py`: incorporate `ElectionAgentAssignment` model and relationships.
  - In `backend/alembic/versions/`: keep `97345eb645cb_add_election_agent_assignments.py`.
  - In `web/src/pages/election-results.js`: accept Musab's clean empty-state renderer when no results are submitted, while preserving the quick link to the Super Admin Data & Media Vault.
  - In `web/package.json`: ensure scripts work seamlessly across Windows and Linux.
  - In `web/src/pages/system-admin.js`: keep the complete Data & Media Vault module (`activeSection === 'exports'`) while incorporating user sync improvements.

### Step 2: Database Initialization & Clean Slate Script
- Location: `backend/app/seed_live.py` (or integrated database reset tool)
- Data Kept:
  - 27 LGAs of Jigawa State
  - 299 Electoral Wards
  - 4,827 Official Polling Units
  - Real Political Parties (PDP, APC, NNPP, LP, ADC, APGA, SDP, etc.)
  - Super Admin user: `admin` (passcode/password `PDP-ADMIN-2027`)
- Data Purged:
  - Simulated mock results from `election_results`, `election_result_votes`, and `vote_results`
  - Simulated mock incidents from `incidents`
  - Dummy test users (retaining only verified real admin/coordinators)

### Step 3: Backend CRUD Endpoints for Infrastructure & Parties
- Location: `backend/app/routers/admin_electoral.py`
- Endpoints:
  - `GET /api/admin/parties` & `POST /api/admin/parties` & `PATCH /api/admin/parties/{id}` & `DELETE /api/admin/parties/{id}`
  - `POST /api/admin/lgas` & `PATCH /api/admin/lgas/{id}` & `DELETE /api/admin/lgas/{id}`
  - `POST /api/admin/wards` & `PATCH /api/admin/wards/{id}` & `DELETE /api/admin/wards/{id}`
  - `POST /api/admin/polling-units` & `PATCH /api/admin/polling-units/{id}` & `DELETE /api/admin/polling-units/{id}`
  - `GET /api/admin/dashboard-stats`: Live counts of LGAs, Wards, PUs, Registered Voters, Parties, Users, Results, Incidents, System Uptime.
  - `GET /api/admin/permissions`: Return all users with their current `allowed_pages` and roles.
  - `POST /api/admin/permissions/update`: Bulk or individual update of `allowed_pages` persisted to the `users` table in database.

### Step 4: Side A Frontend Implementation (`web/src/pages/system-admin.js`)
- **Dashboard Section (`activeSection === 'dashboard'`)**:
  - Live metric cards pulling directly from `/api/admin/dashboard-stats`.
  - System infrastructure health indicators.
  - Real-time PU reporting progress (starts at 0% until real results arrive).
- **Permissions Matrix Section (`activeSection === 'permissions'`)**:
  - Unified grid mapping Roles & Users to Side A and Side B pages.
  - Checkboxes to grant/revoke access.
  - "Save Changes to Database" button that calls `/api/admin/permissions/update`.
- **Infrastructure Management (`activeSection === 'setup'` or direct sidebar links)**:
  - **Manage LGAs (`activeSection === 'lgas'`)**: table with Name, Code, Wards count, PUs count, Registered Voters + Add LGA modal + Edit/Delete actions.
  - **Manage Wards (`activeSection === 'wards'`)**: LGA filter dropdown + table + Add Ward modal + Edit/Delete actions.
  - **Manage Polling Units (`activeSection === 'polling-units'`)**: LGA/Ward cascade filters + live search + table with PU Code, Name, Voters, Coordinates + Add PU modal + Edit/Delete actions.
  - **Manage Political Parties (`activeSection === 'parties'`)**: cards/table with Logo, Party Name, Abbreviation, Badge Color, Status (Active/Inactive) + Add Party modal + Edit/Delete actions.

---

## 3. Verification & Testing Plan
1. **Git Verification**:
   - Confirm `git merge origin/musab` resolves cleanly with 0 remaining conflicts.
   - Run `git status` and verify all files are tracked.
2. **Database Verification**:
   - Inspect database row counts: 27 LGAs, 299 Wards, 4,827 PUs, official parties seeded, 0 dummy results, 0 dummy incidents, Super Admin active.
3. **Frontend Compilation**:
   - Run `npm run build` in `web/` to guarantee zero JSX or Next.js build errors.
4. **Backend API Verification**:
   - Test CRUD endpoints with `curl` or automated script.
5. **Side A UI Browser Verification**:
   - Navigate to `http://localhost:3000/system-admin`.
   - Test Dashboard live statistics.
   - Test Permissions Matrix loading and saving permissions.
   - Test LGA, Ward, Polling Unit, and Political Party management interfaces.
