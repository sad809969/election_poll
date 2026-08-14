# JIGAWA PDP POLLWATCH 2027 — VERCEL DEPLOYMENT PLAN

## 🎯 Goal
Commit and push all live API integrations and the interactive "+ Add New User" modal to the GitHub `main` branch so Vercel triggers an automatic deployment.

---

## 📋 Files Being Pushed to Vercel

1. **Web Admin Dashboard & Modal ([admin.js](file:///home/fox/election_poll/web/src/pages/admin.js))**:
   - Live backend fetching from `/api/agents`.
   - Interactive **"+ Add New User"** popup modal supporting all 9 authorization roles (*Super Admin, State Chairman, Candidate, Deputy Candidate, DG, Situation Room Officer, LGA Coordinator, Ward Coordinator, Polling Unit Agent*).

2. **Web Dashboard Tabs**:
   - [map.js](file:///home/fox/election_poll/web/src/pages/map.js) -> Live PU health markers and LGA filtering.
   - [collation.js](file:///home/fox/election_poll/web/src/pages/collation.js) -> Live 27 LGA vote collation table and lead margin calculations.
   - [incidents.js](file:///home/fox/election_poll/web/src/pages/incidents.js) -> Live incident log and severity status toggling.
   - [communication.js](file:///home/fox/election_poll/web/src/pages/communication.js) -> Inter-agent messaging threads.
   - [broadcast.js](file:///home/fox/election_poll/web/src/pages/broadcast.js) -> Push alert announcements dispatcher.
   - [audit-logs.js](file:///home/fox/election_poll/web/src/pages/audit-logs.js) -> Security audit log viewer.

3. **Backend Cloud Optimizations**:
   - [config.py](file:///home/fox/election_poll/backend/app/core/config.py) -> `/tmp/pollwatch.db` support for serverless file system and wildcard CORS headers.
   - [seed.py](file:///home/fox/election_poll/backend/app/seed.py) -> Auto-seeding 27 Jigawa State LGAs, sample Wards, Polling Units, Agents, EC8A Results, and Incidents on startup.

---

## ⚡ Execution Steps
1. Run `git add .`
2. Commit with message: `feat: Connect live API endpoints and Add User modal for Vercel deployment`
3. Push to `origin main` to trigger Vercel build.
