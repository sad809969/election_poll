"""
Passenger WSGI Entrypoint for cPanel / Neotech Hosting
"""
import sys
import os

# Add application directory to path
APP_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, APP_DIR)

from app.database import init_db
try:
    from app.seed import seed_database
except ImportError:
    seed_database = None

# Ensure database tables and seed data exist
try:
    init_db()
    if seed_database:
        seed_database()
except Exception as e:
    print(f"Startup notice: {e}")

from app.main import app

# For ASGI to WSGI compatibility in cPanel Passenger environments
try:
    from a2wsgi import ASGIMiddleware
    application = ASGIMiddleware(app)
except ImportError:
    application = app
