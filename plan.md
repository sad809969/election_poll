# JIGAWA PDP POLLWATCH 2027 — Vercel 500 Error Fix Plan

## Execution Steps
1. Update `backend/app/config.py` to route SQLite `.db` and `uploads` directory to writable `/tmp` when running under Vercel serverless environment.
2. Update `backend/api/index.py` for ASGI serverless execution.
3. Commit and push fix to GitHub origin `main` with PAT authentication.

---
