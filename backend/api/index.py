import sys
import os

# Add root backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import init_db
try:
    from app.seed import seed_database
except ImportError:
    seed_database = None

# Ensure tables and seed data exist in /tmp/pollwatch.db on Vercel cold start
try:
    init_db()
    if seed_database:
        seed_database()
except Exception as e:
    print(f"Startup DB init notice: {e}")

from app.main import app

# Export app as handler for Vercel Serverless Function
app = app
