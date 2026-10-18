# Jigawa PDP PollWatch 2027 — Production Hosting Guide

This guide covers deployment instructions for **Render (`render.com`)** and **Neotech Hosting**, ensuring persistent databases so polling unit agents, collation results, and audit trails remain permanently stored.

---

## 1. Deploying to Render (`render.com`)

Render hosts the entire PDP PollWatch stack:
1. **Managed PostgreSQL Database** (`pdp-pollwatch-db`) — Permanent database storage.
2. **FastAPI Backend Web Service** (`pdp-pollwatch-backend`) — Python 3.11 with automatic API docs and WebSockets.
3. **Flutter Web Unified Situation Room & Admin Portal** (`pdp-pollwatch-web`) — Production Dockerized Nginx with gzip compression, SPA fallback, and cache management.

---

### Option A: 1-Click Automated Blueprint (Recommended)

Render can create all three services simultaneously using the repository's [`render.yaml`](render.yaml):

1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click the **New +** button &rarr; Select **Blueprint**.
3. Connect your GitHub repository: `sad809969/election_poll` on the `main` branch.
4. Render automatically parses `render.yaml` and lists:
   - `pdp-pollwatch-db` (PostgreSQL Database)
   - `pdp-pollwatch-backend` (FastAPI Python Web Service)
   - `pdp-pollwatch-web` (Flutter Web Docker Web Service)
5. Click **Apply**.
6. Render builds the services automatically. Once deployed, you will receive two public URLs:
   - **Backend**: `https://pdp-pollwatch-backend.onrender.com`
   - **Flutter Web App**: `https://pdp-pollwatch-web.onrender.com`

---

### Option B: Deploying Flutter Web Individually on Render

If you already have your backend running and only want to add the Flutter Web portal:

1. In Render Dashboard, click **New +** &rarr; Select **Web Service**.
2. Connect the `sad809969/election_poll` repository.
3. Configure the settings:
   - **Name**: `pdp-pollwatch-web` (or your preferred name)
   - **Region**: Oregon (or match your backend region)
   - **Branch**: `main`
   - **Root Directory**: `mobile`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `Dockerfile`
   - **Instance Type**: `Free`
4. *(Optional)* If your backend has a different URL, add an Environment Variable:
   - Key: `API_BASE_URL`
   - Value: `https://your-custom-backend.onrender.com/api`
5. Click **Create Web Service**.

Render will build the Docker container using `mobile/Dockerfile`, compile the release Flutter web bundle, and serve it via Nginx on port 3000 (dynamically mapped to `$PORT`).

---

### Option C: Deploying Flutter Web as a Render Static Site (Zero-Spin-Down CDN)

If you prefer Render's static CDN hosting (which never sleeps after 15 minutes of inactivity):

1. Build the Flutter web app locally:
   ```bash
   cd mobile
   flutter build web --release --no-wasm-dry-run
   ```
2. In Render Dashboard, click **New +** &rarr; Select **Static Site**.
3. Connect the repository.
4. Configure:
   - **Name**: `pdp-pollwatch-web`
   - **Branch**: `main`
   - **Build Command**: *(leave empty if committing `build/web` or use shallow Flutter build)*
   - **Publish Directory**: `mobile/build/web`
5. Under **Redirects/Rewrites**:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: `Rewrite`
6. Click **Create Static Site**.

---

## 2. Testing Your Deployed System

### A. Verify Backend
- Interactive Swagger API: `https://pdp-pollwatch-backend.onrender.com/docs`
- Health Check: `https://pdp-pollwatch-backend.onrender.com/health`
- LGA Electoral Telemetry: `https://pdp-pollwatch-backend.onrender.com/api/electoral/lgas`

### B. Verify Flutter Web Portal
1. Open `https://pdp-pollwatch-web.onrender.com` in your web browser.
2. Log in using your Super Admin or State Director credentials:
   - **Username**: `admin`
   - **Password**: *(your configured admin password)*
3. Switch server targets at any time via **Admin Settings &rarr; Telemetry Server Configuration** if pointing to another host.

---

## 3. Deploying to Neotech Hosting

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
This launches PostgreSQL 15, FastAPI, and Flutter Web in isolated production containers.

---

## 4. Connecting the Mobile App (Android APK)

In the Flutter Mobile App on phones / tablets:
1. On the Login Screen, tap the **WiFi icon** (or Server Settings) at the top right.
2. Select your active server preset:
   - **🚀 Render Cloud**: `https://pdp-pollwatch-backend.onrender.com/api`
   - **🏢 Neotech Hosting**: `https://api.pdpjigawa2027.com/api`
   - **⚡ Local / LAN**: `http://192.168.1.X:8000/api`
3. Tap **Test Connection** &rarr; Tap **Save & Apply**.
4. Log in with your Polling Unit Agent credentials.
