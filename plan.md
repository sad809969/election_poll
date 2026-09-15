# JIGAWA PDP POLLWATCH 2027 — SYSTEM ANALYSIS & IMPLEMENTATION PLAN

## 🛠️ System Overview & Status

### 1. FastAPI Backend (`/backend`)
- **Architecture**: FastAPI, SQLAlchemy ORM (SQLite/PostgreSQL support), Async WebSockets, Pydantic v2.
- **Data Coverage**: Pre-seeded with all **27 Jigawa State LGAs**, 287 Wards, 4,827 Polling Units, and 9 authorization roles.
- **Core Endpoints**: Auth, Agents, Electoral Hierarchy, Results Collation, Incident Tracker, Communications, Audit Trail, Dashboard Aggregates.

### 2. Next.js Command Center Dashboard (`/web`)
- **Situation Room Monitoring Center**: Interactive Jigawa vector map, color-coded PU health pins, live report feed, hourly timeline graph, LGA progress bars.
- **Admin Control Suite Implemented**:
  - `admin.js`: `+ Add New User` Modal for user governance across 9 roles.
  - `polling-units.js`: `+ Add Polling Unit` Modal.
  - `results.js`: `+ Manual Form EC8A Entry` Modal.
  - `incidents.js`: `+ Report New Incident` Modal.

### 3. Flutter Field Agent Mobile App (`/mobile`)
- **Features**: Agent PU-locked login, offline queue with Hive/SQLite auto-sync, Form EC8A result entry with photo proof upload, incident reporting with GPS tags, and election timeline tracker.

---

## ⚡ Next Execution Steps

1. **Backend Testing & Dependencies**: Add `httpx` to `backend/requirements.txt` to run `pytest` unit test suite cleanly.
2. **Web Environment Optimization**: Ensure local `node_modules` binaries in `/web` enable clean `npm run build` and `npm run dev` builds.
3. **Local Testing & Preview**: Launch local backend and web dev server to verify end-to-end data flow.
