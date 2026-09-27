#!/bin/bash
# =============================================================================
# Automated Deployment Script for Jigawa PDP PollWatch 2027
# Target: Linux Cloud Server / VPS on Neotech Hosting
# =============================================================================

set -e

echo "=========================================================="
echo "🚀 Starting Jigawa PDP PollWatch 2027 Production Setup"
echo "=========================================================="

# 1. Check Root Privileges
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run this script with sudo or as root: sudo ./deploy_neotech.sh"
  exit 1
fi

APP_DIR="/var/www/election_poll"

# 2. Update System Packages
echo "📦 Updating system packages..."
apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv python3-dev \
    postgresql postgresql-contrib libpq-dev \
    nginx curl git certbot python3-certbot-nginx

# 3. Create Application Directory if needed
echo "📁 Setting up application directory at $APP_DIR..."
mkdir -p "$APP_DIR"
cp -r . "$APP_DIR/" || true

# 4. Create Python Virtual Environment
echo "🐍 Setting up Python Virtual Environment..."
cd "$APP_DIR/backend"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# 5. Production Environment File
if [ ! -f ".env" ]; then
    echo "⚙️ Generating production .env file..."
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    cat <<EOF > .env
PROJECT_NAME="Jigawa PDP PollWatch 2027"
API_V1_STR="/api"
DEBUG=False
SECRET_KEY=$SECRET_KEY
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL=sqlite:///./pollwatch.db
UPLOAD_DIR="uploads"
EOF
fi

# 6. Initialize Database and Initial Seeds
echo "🗄️ Initializing database tables and seed rosters..."
python3 -c "from app.database import init_db; from app.seed import seed_database; init_db(); seed_database()"

# 7. Configure Permissions
chown -R www-data:www-data "$APP_DIR"
chmod -R 775 "$APP_DIR/backend/uploads" || true

# 8. Install Systemd Service
echo "⚡ Installing Systemd Service..."
cp "$APP_DIR/systemd/pdp-pollwatch.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable pdp-pollwatch
systemctl restart pdp-pollwatch

# 9. Configure Nginx
echo "🌐 Configuring Nginx Reverse Proxy..."
cp "$APP_DIR/nginx/pdp-pollwatch.conf" /etc/nginx/sites-available/pdp-pollwatch
ln -sf /etc/nginx/sites-available/pdp-pollwatch /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "=========================================================="
echo "✅ DEPLOYMENT COMPLETE & RUNNING!"
echo "   - Service Status: systemctl status pdp-pollwatch"
echo "   - API Health: curl http://127.0.0.1:8000/docs"
echo "   - To enable SSL: certbot --nginx -d yourdomain.com"
echo "=========================================================="
