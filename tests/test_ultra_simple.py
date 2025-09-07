#!/usr/bin/env python3
"""
Ultra-simple health check using only built-in Python modules
No external dependencies required
"""

import urllib.request
import urllib.error
import json
import os
import sys

# Test configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
MEILI_URL = os.getenv("MEILI_URL", "http://localhost:7700")


def test_url(url, name, timeout=10):
    """Test a URL with built-in urllib"""
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            if response.status == 200:
                data = response.read().decode('utf-8')
                try:
                    json_data = json.loads(data)
                    print(f"✅ {name}: {response.status} - {json_data.get('status', 'OK')}")
                    return True
                except json.JSONDecodeError:
                    print(f"✅ {name}: {response.status} - Response received")
                    return True
            else:
                print(f"❌ {name}: HTTP {response.status}")
                return False
    except urllib.error.URLError as e:
        print(f"❌ {name}: Connection error - {e}")
        return False
    except Exception as e:
        print(f"❌ {name}: {e}")
        return False


def main():
    """Main health check routine"""
    print("🏥 Ultra-Simple Health Check")
    print("=" * 35)
    print(f"Meilisearch: {MEILI_URL}")
    print(f"API: {API_BASE_URL}")
    print()
    
    success = True
    
    # Test Meilisearch
    success &= test_url(f"{MEILI_URL}/health", "Meilisearch")
    
    # Test API
    success &= test_url(f"{API_BASE_URL}/health", "API")
    
    # Test basic search
    success &= test_url(f"{API_BASE_URL}/search?q=test", "Basic Search")
    
    print()
    if success:
        print("🎉 All health checks passed!")
        return 0
    else:
        print("💥 Some health checks failed!")
        return 1


if __name__ == "__main__":
    sys.exit(main())
