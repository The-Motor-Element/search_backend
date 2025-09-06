#!/usr/bin/env python3
"""
Setup validation script for E-commerce Search Backend
Checks if all dependencies are installed and services are accessible
"""

import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

try:
    import httpx
    from dotenv import load_dotenv
    from meilisearch_python_sdk import AsyncClient
    print("✅ All Python dependencies are installed")
except ImportError as e:
    print(f"❌ Missing dependency: {e}")
    print("Run: pip install -r requirements.txt")
    sys.exit(1)

load_dotenv()

# Configuration
MEILI_URL = os.getenv("MEILI_URL", "http://localhost:7700")
MEILI_MASTER_KEY = os.getenv("MEILI_MASTER_KEY", "development_key_please_change_in_production")
API_URL = "http://localhost:8000"


async def check_meilisearch():
    """Check if Meilisearch is running"""
    try:
        client = AsyncClient(url=MEILI_URL, api_key=MEILI_MASTER_KEY)
        health = await client.health()
        await client.aclose()
        print(f"✅ Meilisearch is running at {MEILI_URL}")
        return True
    except Exception as e:
        print(f"❌ Meilisearch not accessible at {MEILI_URL}: {e}")
        print("Make sure to run: docker-compose up -d")
        return False


async def check_api_server():
    """Check if API server is running"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{API_URL}/health")
            if response.status_code == 200:
                print(f"✅ API server is running at {API_URL}")
                return True
            else:
                print(f"❌ API server returned status {response.status_code}")
                return False
    except Exception as e:
        print(f"❌ API server not accessible at {API_URL}: {e}")
        print("Make sure to run: uvicorn app.main:app --reload --port 8000")
        return False


async def main():
    """Main validation function"""
    print("🔍 Validating E-commerce Search Backend setup...\n")
    
    # Check Meilisearch
    meili_ok = await check_meilisearch()
    
    # Check API server
    api_ok = await check_api_server()
    
    print("\n" + "="*50)
    
    if meili_ok and api_ok:
        print("🎉 Setup validation successful!")
        print("\nNext steps:")
        print("1. Run seed script: python scripts/seed.py")
        print("2. Visit API docs: http://localhost:8000/docs")
        print("3. Run tests: pytest tests/ -v")
    else:
        print("❌ Setup validation failed!")
        print("\nPlease check the error messages above and:")
        print("1. Start Meilisearch: docker-compose up -d")
        print("2. Start API server: uvicorn app.main:app --reload --port 8000")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
