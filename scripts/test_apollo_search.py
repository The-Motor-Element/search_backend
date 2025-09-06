#!/usr/bin/env python3
"""
Apollo Tire Search Test Script
Tests the search functionality with Apollo tire data
"""

import asyncio
import httpx
import json
from typing import Dict, Any


async def test_apollo_search():
    """Test Apollo tire search functionality"""
    
    base_url = "http://localhost:8001"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("🔍 Testing Apollo Tire Search Backend")
        print("=" * 50)
        
        # Test 1: Health check
        print("\n1. Testing health endpoint...")
        try:
            response = await client.get(f"{base_url}/health")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                health_data = response.json()
                print(f"   Response: {json.dumps(health_data, indent=2)}")
            else:
                print(f"   Error: {response.text}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Test 2: Search by pattern
        print("\n2. Testing search by pattern (LOADSTAR)...")
        try:
            response = await client.get(f"{base_url}/search?q=LOADSTAR&limit=3")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                search_data = response.json()
                print(f"   Found {search_data.get('estimated_total_hits', 0)} results")
                print(f"   Query: '{search_data.get('query', '')}'")
                if search_data.get('hits'):
                    for i, hit in enumerate(search_data['hits'][:2]):
                        print(f"   Result {i+1}: {hit.get('title', hit.get('material', 'N/A'))}")
                        print(f"             MPN: {hit.get('mpn', 'N/A')}")
                        print(f"             Size: {hit.get('size', 'N/A')}")
                        print(f"             Group: {hit.get('group', 'N/A')}")
            else:
                print(f"   Error: {response.text}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Test 3: Search by size
        print("\n3. Testing search by tire size (155/80)...")
        try:
            response = await client.get(f"{base_url}/search?q=155/80&limit=3")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                search_data = response.json()
                print(f"   Found {search_data.get('estimated_total_hits', 0)} results")
                if search_data.get('hits'):
                    for i, hit in enumerate(search_data['hits'][:2]):
                        print(f"   Result {i+1}: {hit.get('title', hit.get('material', 'N/A'))}")
                        print(f"             Size: {hit.get('size', 'N/A')}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Test 4: Filter by group
        print("\n4. Testing filter by group (SCV)...")
        try:
            response = await client.get(f"{base_url}/search?q=tire&filters=group=SCV&limit=3")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                search_data = response.json()
                print(f"   Found {search_data.get('estimated_total_hits', 0)} SCV results")
                if search_data.get('hits'):
                    for i, hit in enumerate(search_data['hits'][:2]):
                        print(f"   Result {i+1}: {hit.get('title', hit.get('material', 'N/A'))}")
                        print(f"             Group: {hit.get('group', 'N/A')}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Test 5: Filter by record type
        print("\n5. Testing filter by record type (Tyre)...")
        try:
            response = await client.get(f"{base_url}/search?q=&filters=record_type=Tyre&limit=5")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                search_data = response.json()
                print(f"   Found {search_data.get('estimated_total_hits', 0)} Tyre results")
                if search_data.get('hits'):
                    print(f"   Sample results:")
                    for i, hit in enumerate(search_data['hits'][:3]):
                        print(f"     - {hit.get('title', hit.get('material', 'N/A'))}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Test 6: Search with ply rating filter
        print("\n6. Testing search with ply rating filter (8PR)...")
        try:
            response = await client.get(f"{base_url}/search?q=&filters=ply_rating=8PR&limit=3")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                search_data = response.json()
                print(f"   Found {search_data.get('estimated_total_hits', 0)} 8PR results")
                if search_data.get('hits'):
                    for i, hit in enumerate(search_data['hits'][:2]):
                        print(f"   Result {i+1}: {hit.get('title', hit.get('material', 'N/A'))}")
                        print(f"             Ply Rating: {hit.get('ply_rating', 'N/A')}")
        except Exception as e:
            print(f"   Error: {e}")
        
        print("\n" + "=" * 50)
        print("🎉 Apollo Tire Search Tests Completed!")


if __name__ == "__main__":
    asyncio.run(test_apollo_search())
