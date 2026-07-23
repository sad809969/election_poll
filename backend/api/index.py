import sys
import os

# Add root backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

# Export app as handler for Vercel Serverless Function
app = app
