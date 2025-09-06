#!/usr/bin/env python3
"""
Docker Deployment Verification Script
Tests all services and endpoints in the containerized Apollo Tire Search application
"""

import requests
import json
import sys
from time import sleep

def test_endpoint(url, description, expected_status=200):
    """Test an endpoint and return success status"""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == expected_status:
            print(f"✅ {description}: OK ({response.status_code})")
            return True
        else:
            print(f"❌ {description}: Failed ({response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ {description}: Connection failed - {e}")
        return False

def test_search_api():
    """Test the search API functionality"""
    try:
        # Test basic search
        response = requests.get("http://localhost:8001/search?q=LOADSTAR&limit=3", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('hits') and len(data['hits']) > 0:
                print(f"✅ Search API: Found {len(data['hits'])} results for 'LOADSTAR'")
                return True
            else:
                print("❌ Search API: No results returned")
                return False
        else:
            print(f"❌ Search API: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Search API: Error - {e}")
        return False

def main():
    """Run all verification tests"""
    print("🔍 Apollo Tire Search - Docker Deployment Verification")
    print("=" * 60)
    
    tests = [
        ("http://localhost:7700/health", "Meilisearch Health"),
        ("http://localhost:8001/health", "API Health"),
        ("http://localhost:8001/docs", "API Documentation"),
        ("http://localhost:8080", "UI Server"),
        ("http://localhost:8001/search/facets?q=LOADSTAR&facets=group,record_type", "Faceted Search Endpoint"),
        ("http://localhost:8001/search/suggestions?q=load", "Suggestions Endpoint"),
        ("http://localhost:8001/analytics/stats", "Analytics Endpoint"),
    ]
    
    passed = 0
    total = len(tests) + 1  # +1 for search functionality test
    
    # Test basic endpoints
    for url, description in tests:
        if test_endpoint(url, description):
            passed += 1
        sleep(0.5)  # Small delay between tests
    
    # Test search functionality
    print("\n🔍 Testing Search Functionality:")
    if test_search_api():
        passed += 1
    
    print(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Your Docker deployment is working correctly.")
        print("\n🌐 Application URLs:")
        print("   • Search UI: http://localhost:8080")
        print("   • API Docs: http://localhost:8001/docs")
        print("   • Meilisearch: http://localhost:7700")
        print("\n💡 Try searching for: LOADSTAR, Apollo, 155/80, SCV")
    else:
        print(f"\n⚠️  {total - passed} tests failed. Check the services and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main()
