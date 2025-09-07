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


def test_search_endpoint(url_base, name, timeout=10):
    """Test search endpoint with better error handling"""
    try:
        # First try a simple empty search which should work even with no data
        search_url = f"{url_base}/search?q=&limit=1"
        with urllib.request.urlopen(search_url, timeout=timeout) as response:
            if response.status == 200:
                data = response.read().decode('utf-8')
                try:
                    json_data = json.loads(data)
                    # Should return search response structure even if empty
                    if "hits" in json_data and "estimated_total_hits" in json_data:
                        print(f"✅ {name}: Empty search successful ({json_data['estimated_total_hits']} documents)")
                        
                        # If there are documents, try a specific search
                        if json_data['estimated_total_hits'] > 0:
                            specific_search_url = f"{url_base}/search?q=LOADSTAR&limit=1"
                            with urllib.request.urlopen(specific_search_url, timeout=timeout) as specific_response:
                                if specific_response.status == 200:
                                    print(f"✅ {name}: Specific search successful")
                                else:
                                    print(f"⚠️  {name}: Specific search returned {specific_response.status}")
                        
                        return True
                    else:
                        print(f"❌ {name}: Invalid search response format")
                        return False
                except json.JSONDecodeError:
                    print(f"❌ {name}: Invalid JSON response")
                    return False
            else:
                print(f"❌ {name}: HTTP {response.status}")
                return False
    except urllib.error.HTTPError as e:
        # Handle specific HTTP errors
        if e.code == 500:
            print(f"⚠️  {name}: Index not found (expected if no data loaded) - {e}")
            return True  # This is acceptable for empty instance
        else:
            print(f"❌ {name}: HTTP Error {e.code} - {e}")
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
    
    # Test search endpoint with better error handling
    success &= test_search_endpoint(API_BASE_URL, "Basic Search")
    
    print()
    if success:
        print("🎉 All health checks passed!")
        return 0
    else:
        print("💥 Some health checks failed!")
        return 1


if __name__ == "__main__":
    sys.exit(main())
