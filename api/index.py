import os
import sys

# Resolve paths to ensure backend directory is in the PYTHONPATH
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, 'backend')

sys.path.append(root_dir)
sys.path.append(backend_dir)

# Default to production settings for Vercel
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.prod')

# Import the WSGI app from Django backend/config/wsgi.py
from config.wsgi import app
