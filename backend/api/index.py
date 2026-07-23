import sys
import os

# Add root directory to PYTHONPATH for Vercel Serverless Function
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

# Vercel entrypoint
handler = app
