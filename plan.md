# JIGAWA PDP POLLWATCH 2027 — ADMIN CONTROL & REAL DATA SUITE PLAN

## 🎯 Goal
Provide full Admin Control Forms across the system so the Admin can manually create, enter, and edit all system data (**Polling Units**, **System Users & 9 Roles**, **Form EC8A Results**, **Field Incidents**, **Parties & Candidates**), and ensure all web dashboards display 100% real database data directly from FastAPI backend endpoints.

---

## 🛠️ Admin Manual Control Forms & Modals

1. **[admin.js](file:///home/fox/election_poll/web/src/pages/admin.js)**:
   - **"+ Add New User" Modal**: Create accounts for all 9 tiers (*Super Admin, State Chairman, Candidate, Deputy Candidate, DG, Situation Room Officer, LGA Coordinator, Ward Coordinator, Polling Unit Agent*).
   - Dynamic user role filters and live fetching from `GET /api/agents`.

2. **[polling-units.js](file:///home/fox/election_poll/web/src/pages/polling-units.js)**:
   - **"+ Add Polling Unit" Modal**: Manually create new Polling Units across all 27 LGAs & Wards with unique PU code, registered voter count, WGS84 GPS coordinates.
   - Live fetching from `GET /api/electoral/polling-units`.

3. **[results.js](file:///home/fox/election_poll/web/src/pages/results.js)**:
   - **"+ Manual Form EC8A Entry" Modal**: Allows Admins to select a Polling Unit and manually enter Form EC8A vote tallies (PDP votes, APC votes, NNPP votes, LP votes, Rejected votes).
   - Submits to `POST /api/results`.

4. **[incidents.js](file:///home/fox/election_poll/web/src/pages/incidents.js)**:
   - **"+ Report New Incident" Modal**: Allows Admins to manually log security/BVAS/field incidents for any Polling Unit with severity level (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) and category.
   - Submits to `POST /api/incidents`.

---

## ⚡ Execution Steps
1. Add **"+ Manual Form EC8A Entry"** modal on `web/src/pages/results.js`.
2. Add **"+ Report New Incident"** modal on `web/src/pages/incidents.js`.
3. Update API fallbacks so all pages prefer live database arrays over static fallback data.
4. Commit and push to GitHub `main` branch.
