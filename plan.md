# Implementation Plan: Unified Super Admin Sidebar Navigation & Dynamic User Page Permissions (Side A & Side B)

## Objective
Unify all sidebar elements across **Side A** (Master System Admin Control Panel) and **Side B** (Situation Room & General Operations) inside Super Admin. Implement an interactive **Role & Page Access Control System** where Super Admin can view all navigation elements across all roles, create new users, and dynamically assign exact pages (from Side A and Side B) that each user is authorized to see and access.

---

## 1. Problem Analysis & Requirements

### The User's Requirement:
> *"ok now I want all sidebar element for all roles side A and side B in super admin we'll do it all together in super admin in a such away we'll be creating user and add them the page they'll be able to seeee after we finisheddd"*

### Key Requirements:
1. **Unified Super Admin Navigation Hub**:
   - Super Admin needs a consolidated view of **ALL** navigation elements across both:
     - **Side A** (System Admin Control Panel modules)
     - **Side B** (Situation Room & General Election pages)
   - Both Side A and Side B elements must be cleanly grouped, visible, and manageable inside Super Admin (`/system-admin` and `/admin`).

2. **Dynamic Page Permission Assignment during User Creation**:
   - In Super Admin's "Create User / Agent" form:
     - Display an interactive **"Allowed Pages & Sidebar Navigation"** selector with checkable options for every Side A and Side B element.
     - Provide one-click Role Presets:
       - **Super Admin (All)**: Automatically selects all Side A and Side B pages.
       - **Situation Room Officer**: Selects all Side B monitoring and reporting pages.
       - **LGA Coordinator**: Selects Collation Center, Results, Polling Units, Incidents, Communication.
       - **Ward Coordinator**: Selects Polling Units, Results, Incidents, Communication.
       - **Polling Unit Agent**: Selects Results Dashboard, Incident Tracker, Notifications.
       - **Custom Configuration**: Allows the Super Admin to freely check or uncheck individual pages.
   - When a user is saved, their custom `allowed_pages` list is persisted in the database.

3. **Dynamic Sidebar Filtering based on User's Assigned Pages**:
   - When any user logs in, `web/src/components/Sidebar.js` reads their profile:
     - If the user is **Super Admin**, they see ALL elements across Side A and Side B.
     - If the user has custom `allowed_pages` assigned, `Sidebar.js` dynamically filters the navigation to **ONLY** display the exact pages authorized for them.
     - If a user has Side A permissions assigned, the "Side A Master Control" footer link is visible and allows them access to their permitted Side A modules.
     - If `allowed_pages` is empty/null (legacy users), it gracefully falls back to default role-based visibility.

---

## 2. Navigation Elements Breakdown (Side A & Side B)

### Side B: Situation Room & General Operations
| Section | Page / Element | Route | Target Roles |
|---|---|---|---|
| **MAIN** | Dashboard | `/` | All / Admins / Coordinators |
| | Interactive Map | `/map` | Admins, Situation Room Officers |
| | Incident Tracker | `/incidents` | All Roles |
| | Agents Directory | `/agents` | Admins, State/LGA Coordinators |
| | Polling Units Directory | `/polling-units` | Admins, LGA/Ward Coordinators |
| **RESULTS** | Results Dashboard | `/results` | All Roles (Agents direct entry) |
| | Collation Center | `/collation` | Admins, LGA Coordinators |
| | Results by Office & Export | `/election-results` | Admins, State Coordinators, Analysts |
| **COMMUNICATION**| Communication Center | `/communication` | Admins, Coordinators |
| | Broadcast Messages | `/broadcast` | Admins, Situation Room Officers |
| | Notifications | `/notifications` | All Roles |
| **ADMIN** | User Management | `/admin` | Super Admin |
| | System Settings | `/settings` | Super Admin |
| | Audit Logs | `/audit-logs` | Super Admin |
| **GATEWAY** | Side A Control Panel | `/system-admin` | Super Admin / Authorized Operators |

### Side A: System Admin Control Panel Modules
| Section | Module | Internal Tab / Key | Target Roles |
|---|---|---|---|
| **SYSTEM SETUP** | Master Overview | `side-a:dashboard` | Super Admin, Operators |
| | Manage LGAs (27) | `side-a:lgas` | Super Admin, Electoral Officers |
| | Manage Wards (287) | `side-a:wards` | Super Admin, Electoral Officers |
| | Manage Polling Units (4,827) | `side-a:polling-units` | Super Admin, Electoral Officers |
| | Manage Political Parties | `side-a:parties` | Super Admin, Electoral Officers |
| **ACCESS & ROLES** | User Hierarchy Roster | `side-a:users` | Super Admin |
| | Role & Page Permissions Matrix | `side-a:permissions` | Super Admin |
| **SECURITY** | Immutable Audit Logs | `side-a:audit` | Super Admin, Security Analysts |
| | User Activity Stream | `side-a:activity` | Super Admin, Security Analysts |
| | Login History & Telemetry | `side-a:logins` | Super Admin, Security Analysts |
| **MAINTENANCE** | System Parameters & DB Vault | `side-a:settings` | Super Admin |

---

## 3. Technical Implementation Details

### Step 1: Database Model & Migration (`backend/app/models.py`)
- Add `allowed_pages = Column(Text, nullable=True)` to the `User` model.
- Stores JSON-encoded list of route strings (e.g. `["/results", "/incidents", "/notifications"]`).
- Default is `None` (for backward-compatible role fallback).

### Step 2: Schemas & Serialization (`backend/app/schemas.py`)
- Update `AgentCreate` to include `allowed_pages: Optional[str] = None`.
- Update `AgentUpdate` to include `allowed_pages: Optional[str] = None`.
- Update `AgentResponse` to include `allowed_pages: Optional[str] = None`.
- Update `UserOut` to include `allowed_pages: Optional[str] = None`.

### Step 3: API Endpoints & Auth Responses
- In `backend/app/routers/agents.py`:
  - When `POST /api/agents` is called, persist `payload.allowed_pages` in `agent.allowed_pages`.
  - When `PATCH /api/agents/{id}` is called, allow updating `allowed_pages`.
- In `backend/app/routers/auth.py`:
  - In `POST /api/auth/login`, include `allowed_pages: user.allowed_pages` in the token response so the client receives authorized pages upon login.
  - In `GET /api/auth/me`, `allowed_pages` is returned via `UserOut`.

### Step 4: Frontend API & Session Helper (`web/src/lib/api.js`)
- Update `loginUser()` to store `allowed_pages` in `localStorage.setItem('user', ...)`:
  ```javascript
  localStorage.setItem('user', JSON.stringify({
    username: data.username,
    role: data.role,
    allowed_pages: data.allowed_pages ? JSON.parse(data.allowed_pages) : null,
  }))
  ```

### Step 5: Dynamic Navigation in `web/src/components/Sidebar.js`
- Read current user via `getCurrentUser()`.
- If user is `Super Admin` (or `role.toLowerCase().includes('admin')`), show all Side B and Side A items.
- If user has `allowed_pages`:
  - Filter Side B menu links to only render pages present in `allowed_pages`.
  - Check whether any Side A key (`side-a:...` or `/system-admin`) is in `allowed_pages`. If yes, show the Side A footer toggle.
  - Cleanly hide empty section headers if all children are hidden.
- If user has no `allowed_pages` set:
  - Gracefully fallback to default role-based visibility.

### Step 6: Super Admin UI Enhancements (`web/src/pages/system-admin.js` & `web/src/pages/admin.js`)
1. **Permissions Matrix View**:
   - In `/system-admin`, add a **"Permissions Matrix"** section displaying all Side A and Side B navigation items alongside configured roles.
2. **Enhanced "Create User" Modal**:
   - Add a full **"Allowed Pages & Sidebar Navigation"** section with categorized checkboxes for:
     - **Side B (Situation Room Navigation)**: Dashboard, Map, Incidents, Agents, Polling Units, Results, Collation, Election Results, Communication, Broadcast, Notifications.
     - **Side A (System Admin Modules)**: Master Dashboard, Manage LGAs, Manage Wards, Manage PUs, Manage Parties, User Hierarchy, Security & Audit, Login History, Parameters & DB.
   - Quick preset selector buttons (`Super Admin (All)`, `Situation Room Officer`, `LGA Coordinator`, `Ward Coordinator`, `Polling Unit Agent`, `Clear All`).
   - Saving sends `allowed_pages: JSON.stringify(selectedPages)`.
3. **User List Permission Badges**:
   - In the user roster table, display an "Access Scope" badge (e.g. `All Pages (Side A + B)` or `3 Allowed Pages: /results, /incidents, /notifications`).

---

## 4. Verification & Testing Plan

1. **Automated Backend Pytest**:
   - Run `PYTHONPATH=. venv/bin/pytest tests/test_api.py -v` to ensure all 15 tests continue to pass without regression.
2. **Frontend Build Verification**:
   - Run `npm run build` in `web/` to confirm all 18 Next.js pages compile without errors.
3. **Interactive Local Browser Testing**:
   - Log in as Super Admin (`admin`).
   - Navigate to Super Admin (`/system-admin`).
   - Create a test user (e.g., `agent_custom_demo`) assigned only 2 pages: Results (`/results`) and Notifications (`/notifications`).
   - Log out and log in as `agent_custom_demo`.
   - Verify that the sidebar strictly displays only Results and Notifications, and restricts other pages.
   - Take browser screenshots to document and verify the behavior.
4. **Git & Deployment**:
   - Commit changes and push to `origin main` to update Vercel live deployments.

---

## 5. Approval Request
Per **Global Operating Rule 1**, this plan is presented for your review and approval before touching any code. Please confirm if you approve this implementation plan to proceed!
