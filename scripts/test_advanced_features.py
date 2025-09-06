#!/usr/bin/env python3
"""
Comprehensive test script for Advanced Meilisearch Features
Tests faceted search, filtering, sorting, highlighting, and more
"""

import asyncio
import json
import httpx
from typing import Dict, Any

# Base URL for the API
BASE_URL = "http://localhost:8001"

async def test_endpoint(client: httpx.AsyncClient, endpoint: str, params: Dict = None, description: str = ""):
    """Test a single endpoint and display results"""
    print(f"\n{'='*60}")
    print(f"🧪 {description}")
    print(f"📍 Endpoint: {endpoint}")
    if params:
        print(f"📋 Parameters: {json.dumps(params, indent=2)}")
    print(f"{'='*60}")
    
    try:
        response = await client.get(endpoint, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        # Display key metrics
        if 'processing_time_ms' in data:
            print(f"⚡ Processing time: {data['processing_time_ms']}ms")
        
        if 'hits' in data:
            print(f"📊 Results found: {len(data['hits'])}")
            if data['hits']:
                print(f"🔍 First result: {data['hits'][0].get('material', data['hits'][0].get('id', 'N/A'))}")
        
        if 'facet_distribution' in data:
            print(f"📈 Facets:")
            for facet, values in data['facet_distribution'].items():
                print(f"   {facet}: {dict(list(values.items())[:3])}{'...' if len(values) > 3 else ''}")
        
        if 'suggestions' in data:
            print(f"💡 Suggestions: {data['suggestions']}")
        
        if 'similar_products' in data:
            print(f"🔗 Similar products: {len(data['similar_products'])}")
        
        if 'groups' in data:
            print(f"🏷️  Available groups: {len(data['groups'])}")
            print(f"   Top groups: {[g['value'] for g in data['groups'][:5]]}")
        
        if 'record_types' in data:
            print(f"📝 Record types: {len(data['record_types'])}")
        
        if 'ply_ratings' in data:
            print(f"⚙️  Ply ratings: {len(data['ply_ratings'])}")
        
        if 'index_stats' in data:
            stats = data['index_stats']
            print(f"📊 Index stats: {stats['number_of_documents']} documents")
        
        print("✅ Test passed!")
        return data
        
    except httpx.HTTPStatusError as e:
        print(f"❌ HTTP Error {e.response.status_code}: {e.response.text}")
        return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

async def main():
    """Run comprehensive tests for all advanced features"""
    
    print("🚀 Starting Advanced Meilisearch Features Test Suite")
    print("="*80)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        
        # Test 1: Basic search with highlighting
        await test_endpoint(
            client, 
            f"{BASE_URL}/search",
            {
                "q": "LOADSTAR",
                "highlight": True,
                "attributes_to_highlight": "material,pattern_model",
                "limit": 5
            },
            "Basic Search with Highlighting"
        )
        
        # Test 2: Advanced filtering with multiple conditions
        await test_endpoint(
            client,
            f"{BASE_URL}/search",
            {
                "q": "155",
                "filters": "group = 'SCV' AND record_type = 'Tyre'",
                "sort": "size:asc",
                "limit": 10
            },
            "Advanced Filtering with Sorting"
        )
        
        # Test 3: Faceted search
        await test_endpoint(
            client,
            f"{BASE_URL}/search/facets",
            {
                "q": "apollo",
                "facets": "group,record_type,ply_rating",
                "limit": 5,
                "max_values_per_facet": 10
            },
            "Faceted Search for Analytics"
        )
        
        # Test 4: Text cropping and custom attributes
        await test_endpoint(
            client,
            f"{BASE_URL}/search",
            {
                "q": "SUPER",
                "attributes_to_retrieve": "id,material,mpn,size,group",
                "attributes_to_crop": "material",
                "crop_length": 50,
                "limit": 5
            },
            "Search with Text Cropping"
        )
        
        # Test 5: Get available filters for UI
        await test_endpoint(
            client,
            f"{BASE_URL}/search/filters/groups",
            description="Available Product Groups"
        )
        
        await test_endpoint(
            client,
            f"{BASE_URL}/search/filters/record-types",
            description="Available Record Types"
        )
        
        await test_endpoint(
            client,
            f"{BASE_URL}/search/filters/ply-ratings",
            description="Available Ply Ratings"
        )
        
        # Test 6: Search suggestions/autocomplete
        await test_endpoint(
            client,
            f"{BASE_URL}/search/suggestions",
            {
                "q": "load",
                "limit": 5
            },
            "Search Suggestions/Autocomplete"
        )
        
        # Test 7: Find similar products
        # First get a product ID
        search_result = await test_endpoint(
            client,
            f"{BASE_URL}/search",
            {
                "q": "LOADSTAR",
                "limit": 1
            },
            "Get Product for Similarity Test"
        )
        
        if search_result and search_result.get('hits'):
            product_id = search_result['hits'][0]['id']
            await test_endpoint(
                client,
                f"{BASE_URL}/search/similar/{product_id}",
                {
                    "limit": 5
                },
                f"Similar Products to {product_id}"
            )
        
        # Test 8: Complex OR filtering
        await test_endpoint(
            client,
            f"{BASE_URL}/search",
            {
                "q": "",
                "filters": "ply_rating = '8PR' OR ply_rating = '6PR'",
                "sort": "ply_rating:asc,size:asc",
                "limit": 10
            },
            "Complex OR Filtering with Multi-field Sorting"
        )
        
        # Test 9: Range-like filtering (using string comparison)
        await test_endpoint(
            client,
            f"{BASE_URL}/search/facets",
            {
                "q": "",
                "facets": "group,ply_rating",
                "filters": "group = 'PCR' OR group = 'SCV'",
                "limit": 0  # Only get facets
            },
            "Faceted Search with Multiple Group Filter"
        )
        
        # Test 10: Analytics and statistics
        await test_endpoint(
            client,
            f"{BASE_URL}/analytics/stats",
            description="Search Analytics and Statistics"
        )
        
        # Test 11: Empty query with facets (browse mode)
        await test_endpoint(
            client,
            f"{BASE_URL}/search/facets",
            {
                "q": "",
                "facets": "group,record_type,ply_rating",
                "limit": 20
            },
            "Browse Mode with Facets (Empty Query)"
        )
        
        # Test 12: Position matching
        await test_endpoint(
            client,
            f"{BASE_URL}/search",
            {
                "q": "155/80",
                "show_matches_position": True,
                "limit": 3
            },
            "Search with Match Position Information"
        )
        
    print("\n" + "="*80)
    print("🎉 Advanced Features Test Suite Completed!")
    print("✨ All Meilisearch advanced features have been tested:")
    print("   • Faceted Search & Analytics")
    print("   • Advanced Filtering (AND/OR)")
    print("   • Multi-field Sorting")
    print("   • Search Highlighting")
    print("   • Text Cropping")
    print("   • Autocomplete/Suggestions")
    print("   • Similar Product Recommendations")
    print("   • Custom Attribute Selection")
    print("   • Match Position Detection")
    print("   • Index Statistics")
    print("="*80)

if __name__ == "__main__":
    asyncio.run(main())
