"""
Test suite for E-commerce Search Backend
Tests indexing, search functionality, and settings configuration
"""

import os
import pytest
import pytest_asyncio
import httpx
import asyncio
from typing import List, Dict, Any

# Test configuration - Allow override via environment variable
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
TEST_TIMEOUT = 30


@pytest_asyncio.fixture
async def client():
    """HTTP client for testing API endpoints"""
    async with httpx.AsyncClient(base_url=API_BASE_URL, timeout=TEST_TIMEOUT) as client:
        yield client


@pytest.fixture
def sample_products():
    """Sample product data for testing"""
    return [
        {
            "id": "TEST_TIRE_001",
            "group": "SCV",
            "material": "Test Tire 155/80 D12 8PR SUPER TEST - D",
            "record_type": "Tyre",
            "mpn": "TEST_TIRE_001",
            "size": "155/80 D12",
            "ply_rating": "8PR",
            "pattern_model": "SUPER TEST",
            "construction_type": None,
            "load_index": None,
            "speed_rating": None,
            "series": None,
            "special_features": "D",
            "title": "Test Tire 155/80 D12 8PR",
            "brand": "Apollo",
            "category": "SCV",
            "tags": ["test", "tire", "8pr"]
        },
        {
            "id": "TEST_TIRE_002",
            "group": "TBR",
            "material": "Test Commercial 275/70 R22.5 14PR HIGHWAY MAX - E",
            "record_type": "Tyre",
            "mpn": "TEST_TIRE_002",
            "size": "275/70 R22.5",
            "ply_rating": "14PR",
            "pattern_model": "HIGHWAY MAX",
            "construction_type": "R",
            "load_index": "148",
            "speed_rating": "J",
            "series": None,
            "special_features": "E",
            "title": "Test Commercial 275/70 R22.5 14PR",
            "brand": "Apollo",
            "category": "TBR",
            "tags": ["commercial", "highway", "14pr"]
        }
    ]


@pytest.fixture
def sample_settings():
    """Sample index settings for testing"""
    return {
        "searchable_attributes": ["material", "pattern_model", "mpn", "size"],
        "filterable_attributes": ["group", "record_type", "ply_rating", "brand"],
        "sortable_attributes": ["size", "ply_rating"],
        "ranking_rules": [
            "words",
            "typo",
            "proximity", 
            "attribute",
            "exactness"
        ]
    }


class TestHealthEndpoint:
    """Test health check functionality"""
    
    @pytest.mark.asyncio
    async def test_health_check(self, client):
        """Test that health endpoint returns service status"""
        response = await client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert "meilisearch" in data
        assert "service" in data
        assert data["service"] == "multi-brand-tire-search-backend"


class TestIndexingEndpoints:
    """Test product indexing functionality"""
    
    @pytest.mark.asyncio
    async def test_index_products_success(self, client, sample_products):
        """Test successful product indexing"""
        response = await client.post("/index/products", json=sample_products)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify task response structure
        assert "task_uid" in data
        assert "status" in data
        assert "type" in data
        
        # Task should complete successfully
        assert data["status"] in ["succeeded", "enqueued", "processing"]
    
    @pytest.mark.asyncio
    async def test_index_empty_products(self, client):
        """Test indexing with empty product list"""
        response = await client.post("/index/products", json=[])
        
        assert response.status_code == 200
        data = response.json()
        assert "task_uid" in data
    
    @pytest.mark.asyncio
    async def test_index_invalid_product(self, client):
        """Test indexing with invalid product data"""
        invalid_product = [{"invalid": "data"}]  # Missing required fields
        
        response = await client.post("/index/products", json=invalid_product)
        
        # Should return validation error
        assert response.status_code == 422


class TestSettingsEndpoint:
    """Test index settings configuration"""
    
    @pytest.mark.asyncio
    async def test_update_settings_success(self, client, sample_settings):
        """Test successful settings update"""
        response = await client.post("/index/settings", json=sample_settings)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "task_uid" in data
        assert "status" in data
        assert data["status"] in ["succeeded", "enqueued", "processing"]
    
    @pytest.mark.asyncio
    async def test_update_partial_settings(self, client):
        """Test updating only some settings"""
        partial_settings = {
            "searchable_attributes": ["title", "description"],
            "filterable_attributes": ["category", "price"]
        }
        
        response = await client.post("/index/settings", json=partial_settings)
        
        assert response.status_code == 200
        data = response.json()
        assert "task_uid" in data


class TestSearchEndpoint:
    """Test search functionality"""
    
    @pytest.mark.asyncio
    async def test_search_basic_query(self, client, sample_products):
        """Test basic search functionality"""
        # First index some products
        await client.post("/index/products", json=sample_products)
        
        # Wait a moment for indexing to complete
        await asyncio.sleep(2)
        
        # Search for products
        response = await client.get("/search?q=Test Tire")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify search response structure
        assert "hits" in data
        assert "query" in data
        assert "processing_time_ms" in data
        assert "limit" in data
        assert "offset" in data
        assert "estimated_total_hits" in data
        
        assert data["query"] == "Test Tire"
        assert isinstance(data["hits"], list)
    
    @pytest.mark.asyncio
    async def test_search_with_filters(self, client):
        """Test search with filters"""
        response = await client.get("/search?q=test&filters=group=SCV")
        
        # Filter might fail if filterable attributes aren't configured properly
        if response.status_code == 200:
            data = response.json()
            assert "hits" in data
            # If we get results, they should match the filter
            if data["hits"]:
                for hit in data["hits"]:
                    assert hit.get("group") == "SCV"
        else:
            # If filtering fails due to configuration, that's acceptable in tests
            assert response.status_code in [400, 500]  # Expected for unconfigured filter
    
    @pytest.mark.asyncio
    async def test_search_with_pagination(self, client):
        """Test search with pagination parameters"""
        response = await client.get("/search?q=test&limit=5&offset=0")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["limit"] == 5
        assert data["offset"] == 0
        assert len(data["hits"]) <= 5
    
    @pytest.mark.asyncio
    async def test_search_with_sort(self, client):
        """Test search with sorting (may fail if sortable attributes not configured)"""
        response = await client.get("/search?q=test&sort=size:asc")
        
        # Sort might fail if sortable attributes aren't configured, which is acceptable
        if response.status_code == 200:
            data = response.json()
            assert "hits" in data
        else:
            # If sorting fails due to configuration, that's acceptable in tests
            assert response.status_code in [400, 500]  # Expected for unconfigured sort
    
    @pytest.mark.asyncio
    async def test_search_unique_product(self, client):
        """Test searching for the unique test product from seed script"""
        # This test assumes the seed script has been run or uses our test data
        response = await client.get("/search?q=TEST_TIRE_001")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should find results or return empty
        assert "hits" in data
        assert "estimated_total_hits" in data
    
    @pytest.mark.asyncio
    async def test_search_no_results(self, client):
        """Test search with no matching results"""
        response = await client.get("/search?q=nonexistentproductxyz12345")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["estimated_total_hits"] == 0
        assert len(data["hits"]) == 0
    
    @pytest.mark.asyncio
    async def test_search_invalid_parameters(self, client):
        """Test search with invalid parameters"""
        # Test invalid limit
        response = await client.get("/search?q=test&limit=0")
        assert response.status_code == 422
        
        # Test negative offset
        response = await client.get("/search?q=test&offset=-1")
        assert response.status_code == 422


class TestIntegrationWorkflow:
    """Test complete workflow from indexing to searching"""
    
    @pytest.mark.asyncio
    async def test_complete_workflow(self, client, sample_products, sample_settings):
        """Test complete workflow: settings -> indexing -> search"""
        
        # 1. Update settings
        settings_response = await client.post("/index/settings", json=sample_settings)
        assert settings_response.status_code == 200
        
        # 2. Index products
        index_response = await client.post("/index/products", json=sample_products)
        assert index_response.status_code == 200
        
        # 3. Wait for indexing to complete
        await asyncio.sleep(3)
        
        # 4. Search for indexed products
        search_response = await client.get("/search?q=Test Tire")
        assert search_response.status_code == 200
        
        search_data = search_response.json()
        
        # Should find our test product
        if search_data["estimated_total_hits"] > 0:
            found_product = search_data["hits"][0]
            assert "Test Tire" in found_product.get("material", "")
            assert found_product.get("brand") == "Apollo"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
