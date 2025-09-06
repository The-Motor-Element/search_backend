"""
Vercel serverless function entry point for Apollo Search Backend
This file exposes the FastAPI app as a Vercel serverless function
"""

import sys
import os
from typing import Any

# Add the parent directory to Python path to import the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

# Vercel expects the app to be directly importable
# Export the FastAPI app instance for Vercel
def handler(request: Any, response: Any) -> Any:
    """Handler function for Vercel serverless deployment"""
    return app

# Export the app for Vercel's Python runtime
# Vercel will automatically detect this as the ASGI application
app = app
