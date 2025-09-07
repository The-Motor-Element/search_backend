#!/usr/bin/env python3
"""
Health check script for local development and CI testing
Verifies that all services are running and healthy before running tests
"""

import os
import sys
import time
import requests
from typing import Optional

# Configuration
MEILISEARCH_URL = os.getenv("MEILI_URL", "http://localhost:7700")
API_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
MAX_RETRIES = 30
RETRY_DELAY = 2  # seconds


def check_service_health(url: str, service_name: str, max_retries: int = MAX_RETRIES) -> bool:
    """
    Check if a service is healthy by making requests to its health endpoint
    """
    print(f"Checking {service_name} health at {url}...")
    
    for attempt in range(1, max_retries + 1):
        try:
            response = requests.get(f"{url}/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {service_name} is healthy! Status: {data.get('status', 'unknown')}")
                return True
            else:
                print(f"❌ Attempt {attempt}: {service_name} returned status {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"⏳ Attempt {attempt}: {service_name} not ready - {str(e)}")
        
        if attempt < max_retries:
            print(f"   Waiting {RETRY_DELAY} seconds before retry...")
            time.sleep(RETRY_DELAY)
    
    print(f"❌ {service_name} failed to become healthy after {max_retries} attempts")
    return False


def check_meilisearch_specific():
    """
    Check Meilisearch specific endpoints and features
    """
    print("Checking Meilisearch specific features...")
    
    try:
        # Check version endpoint
        response = requests.get(f"{MEILISEARCH_URL}/version", timeout=5)
        if response.status_code == 200:
            version_data = response.json()
            print(f"✅ Meilisearch version: {version_data.get('pkgVersion', 'unknown')}")
        
        # Check if we can create/access an index
        headers = {}
        master_key = os.getenv("MEILI_MASTER_KEY")
        if master_key:
            headers["Authorization"] = f"Bearer {master_key}"
        
        response = requests.get(f"{MEILISEARCH_URL}/indexes", headers=headers, timeout=5)
        if response.status_code == 200:
            print("✅ Meilisearch index access working")
            return True
        else:
            print(f"⚠️  Meilisearch index access returned {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Meilisearch specific checks failed: {e}")
        return False


def main():
    """
    Main health check routine
    """
    print("🔍 Starting health checks for Apollo Search Backend...")
    print("=" * 60)
    
    all_healthy = True
    
    # Check Meilisearch
    if not check_service_health(MEILISEARCH_URL, "Meilisearch"):
        all_healthy = False
    else:
        if not check_meilisearch_specific():
            all_healthy = False
    
    print("=" * 60)
    
    # Check API service
    if not check_service_health(API_URL, "API Service"):
        all_healthy = False
    
    print("=" * 60)
    
    if all_healthy:
        print("🎉 All services are healthy and ready for testing!")
        print(f"   - Meilisearch: {MEILISEARCH_URL}")
        print(f"   - API Service: {API_URL}")
        sys.exit(0)
    else:
        print("💥 Some services are not healthy. Please check the logs and try again.")
        print("\n🔧 Troubleshooting tips:")
        print("   1. Make sure Docker Compose is running: docker-compose up -d")
        print("   2. Check service logs: docker-compose logs")
        print("   3. Verify ports are not in use: netstat -tulpn | grep :7700")
        print("   4. Check environment variables are set correctly")
        sys.exit(1)


if __name__ == "__main__":
    main()
