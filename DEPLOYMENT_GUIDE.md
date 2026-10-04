# Jigawa PDP PollWatch 2027 — Production Hosting Guide

This guide covers deployment instructions for **Render** and **Neotech Hosting**, ensuring persistent databases so polling unit agents, collation results, and audit trails remain permanently stored.

---

## 1. Deploying to Render (`render.com`) in 3 Clicks

Render provides persistent web services and managed PostgreSQL databases with automatic SSL.

### Step 1: Connect Your Repository
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** &rarr; Select **Blueprint**.
3. Connect your GitHub repository: `sad809969/election_poll` on the `main` branch.

### Step 2: Automatic Blueprint Deployment
Render reads the included [render.yaml](render.yaml) file automatically:
- **Web Service**: `pdp-pollwatch-backend` (FastAPI + Uvicorn)
- **Database**: `pdp-pollwatch-db` (Managed Persistent PostgreSQL)
- **Automatic Variables**: Sets `DATABASE_URL` directly from the managed PostgreSQL database.

### Step 3: Verify Your Render Backend
Once deployed, Render gives you a public URL (e.g. `https://pdp-pollwatch-backend.onrender.com`).
Test it in your browser:
- `https://your-service-name.onrender.com/docs` &rarr; Interactive Swagger API documentation.
- `https://your-service-name.onrender.com/api/electoral/lgas` &rarr; 27 LGAs of Jigawa State.

---

## 2. Deploying to Neotech Hosting

Neotech Hosting supports both **Linux VPS / Dedicated Server** and **cPanel Python Application Manager**.

### Option A: Linux Cloud Server / VPS on Neotech (Recommended)
1. SSH into your Neotech server as root:
   ```bash
   ssh root@your-server-ip
   ```
2. Clone your repository:
   ```bash
   git clone https://github.com/sad809969/election_poll.git /var/www/election_poll
   cd /var/www/election_poll
   ```
3. Run the automated deployment script:
   ```bash
   sudo ./deploy_neotech.sh
   ```
4. The script automatically:
   - Configures Python 3 virtual environment and installs dependencies.
   - Sets up systemd service unit `pdp-pollwatch` that auto-starts on boot.
   - Configures Nginx reverse proxy with gzip and websocket support.
   - Runs database initialization and seeds.

### Option B: Docker Compose on Neotech Server
If your Neotech server has Docker installed:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
This launches PostgreSQL 15, FastAPI, and Next.js frontend in isolated production containers.

### Option C: cPanel Python App Manager on Neotech
1. In cPanel, go to **Setup Python App**.
2. Select Python version **3.11** or **3.12**.
3. Set **Application root**: `election_poll/backend`.
4. Set **Application startup file**: `passenger_wsgi.py`.
5. Click **Create** &rarr; Click **Run pip install** using `requirements.txt`.
6. Click **Restart**.

---

## 3. Connecting the Mobile App

In the Flutter Mobile App:
1. On the Login Screen, tap the **WiFi icon** (or Server Settings) at the top right.
2. Select your active server preset:
   - **🚀 Render Cloud**: `https://jigawa-pdp-pollwatch.onrender.com`
   - **🏢 Neotech Hosting**: `https://api.pdpjigawa2027.com` (or your Neotech server domain/IP)
   - **☁️ Vercel Cloud**: `https://jigawa-pdp-pollwatch-backend.vercel.app`
   - **⚡ Local / USB**: `http://127.0.0.1:8000`
3. Tap **Test Connection** &rarr; Tap **Save & Apply**.
4. Log in with your Polling Unit Agent credentials (username or phone number).
