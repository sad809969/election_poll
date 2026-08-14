# JIGAWA PDP POLLWATCH 2027 — VERCEL FIX & COMMIT PLAN

## 🎯 Root Cause Analysis & Fix

### 1. Dynamic API URL Resolution Fix (`web/src/lib/api.js`)
- **Problem**: When deployed on Vercel (`https://jigawa-pdp-pollwatch.vercel.app`), the API utility was hardcoded to default to `http://localhost:8000/api`. Browsers on Vercel HTTPS failed to connect to `localhost:8000`.
- **Fix**: Added dynamic resolution `getApiBase()` which detects production Vercel hostname and routes API calls to relative `${window.location.origin}/api`.

### 2. Add New User Button Click Fix (`web/src/pages/admin.js`)
- **Fix**: Added `type="button"`, `cursor-pointer`, and explicit `z-10` layer stacking to guarantee click events fire cleanly.

---

## ⚡ Git Commit & Push Execution
- Commit and push changes directly to `origin/main` so Vercel builds the fix instantly!
