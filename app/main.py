"""
Multi-Brand Tire Search Backend using Meilisearch and FastAPI
Production-ready microservice for tire product search and indexing
Supports Apollo, CEAT, MRF, Eurogrip, and other tire manufacturers
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
from dotenv import load_dotenv

# Using meilisearch-python-sdk async client
# Docs: https://github.com/meilisearch/meilisearch-python-sdk
from meilisearch_python_sdk import AsyncClient
from meilisearch_python_sdk.models.task import TaskInfo

from .schemas import (
    Product, 
    SearchResponse, 
    IndexSettings, 
    TaskResponse, 
    FacetedSearchResponse, 
    SimilarProductsResponse, 
    FilterOption, 
    SearchSuggestionResponse
)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global Meilisearch client
meili_client: Optional[AsyncClient] = None

# Configuration
MEILI_URL = os.getenv("MEILI_URL", "http://localhost:7700")
MEILI_MASTER_KEY = os.getenv("MEILI_MASTER_KEY", "development_key_please_change_in_production")
PRODUCTS_INDEX = os.getenv("PRODUCTS_INDEX", "products")


async def get_task_uid(task_info: TaskInfo) -> str:
    """
    Robustly extract task UID from TaskInfo object or dict
    Handles various SDK response formats
    """
    if hasattr(task_info, 'task_uid'):
        return str(task_info.task_uid)
    elif hasattr(task_info, 'uid'):
        return str(task_info.uid)
    elif isinstance(task_info, dict):
        return str(task_info.get('taskUid') or task_info.get('uid'))
    else:
        return str(task_info)


async def wait_for_task_completion(task_info: TaskInfo, timeout: int = 30) -> TaskResponse:
    """
    Wait for Meilisearch task completion with graceful error handling
    See: https://docs.meilisearch.com/reference/api/tasks.html
    """
    try:
        task_uid = await get_task_uid(task_info)
        logger.info(f"Waiting for task {task_uid} to complete...")
        
        # Use SDK's wait_for_task method
        final_task = await meili_client.wait_for_task(task_uid, timeout_in_ms=timeout * 1000)
        
        return TaskResponse(
            task_uid=task_uid,
            status=final_task.status,
            type=getattr(final_task, 'type', 'unknown'),
            details=getattr(final_task, 'details', {})
        )
    except Exception as e:
        logger.warning(f"Could not wait for task completion: {e}")
        task_uid = await get_task_uid(task_info)
        return TaskResponse(
            task_uid=task_uid,
            status="enqueued",
            type="unknown",
            details={"error": "Could not wait for completion", "message": str(e)}
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager for Meilisearch client
    Initializes async client on startup and closes on shutdown
    """
    global meili_client
    
    # Startup
    logger.info(f"Connecting to Meilisearch at {MEILI_URL}")
    meili_client = AsyncClient(
        url=MEILI_URL,
        api_key=MEILI_MASTER_KEY
    )
    
    # Verify connection
    try:
        health = await meili_client.health()
        logger.info(f"Meilisearch connection successful: {health}")
    except Exception as e:
        logger.error(f"Failed to connect to Meilisearch: {e}")
        raise
    
    yield
    
    # Shutdown
    if meili_client:
        await meili_client.aclose()
        logger.info("Meilisearch client closed")


# Initialize FastAPI app with lifespan management
app = FastAPI(
    title="Multi-Brand Tire Search Backend",
    description="Production-ready tire search microservice supporting Apollo, CEAT, MRF, Eurogrip and more",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/index/products", response_model=TaskResponse)
async def index_products(products: List[Product]):
    """
    Index product documents in Meilisearch
    Accepts bulk product data and waits for indexing completion
    """
    try:
        index = meili_client.index(PRODUCTS_INDEX)
        
        # Convert Pydantic models to dicts for Meilisearch
        product_dicts = [product.model_dump() for product in products]
        
        # Add documents to index
        task_info = await index.add_documents(product_dicts)
        logger.info(f"Started indexing {len(products)} products")
        
        # Wait for task completion
        result = await wait_for_task_completion(task_info)
        
        if result.status == "succeeded":
            logger.info(f"Successfully indexed {len(products)} products")
        else:
            logger.warning(f"Indexing task completed with status: {result.status}")
            
        return result
        
    except Exception as e:
        logger.error(f"Error indexing products: {e}")
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")


@app.post("/index/settings", response_model=TaskResponse)
async def update_index_settings(settings: IndexSettings):
    """
    Update Meilisearch index settings
    Configures searchable attributes, filters, ranking rules, etc.
    See: https://docs.meilisearch.com/reference/api/settings.html
    """
    try:
        index = meili_client.index(PRODUCTS_INDEX)
        
        # Update settings using individual methods for better compatibility
        settings_dict = {k: v for k, v in settings.model_dump().items() if v is not None}
        
        tasks = []
        
        if "searchable_attributes" in settings_dict:
            task_info = await index.update_searchable_attributes(settings_dict["searchable_attributes"])
            tasks.append(await wait_for_task_completion(task_info))
        
        if "filterable_attributes" in settings_dict:
            task_info = await index.update_filterable_attributes(settings_dict["filterable_attributes"])
            tasks.append(await wait_for_task_completion(task_info))
        
        if "sortable_attributes" in settings_dict:
            task_info = await index.update_sortable_attributes(settings_dict["sortable_attributes"])
            tasks.append(await wait_for_task_completion(task_info))
        
        if "ranking_rules" in settings_dict:
            task_info = await index.update_ranking_rules(settings_dict["ranking_rules"])
            tasks.append(await wait_for_task_completion(task_info))
        
        if "stop_words" in settings_dict:
            task_info = await index.update_stop_words(settings_dict["stop_words"])
            tasks.append(await wait_for_task_completion(task_info))
        
        if "synonyms" in settings_dict:
            task_info = await index.update_synonyms(settings_dict["synonyms"])
            tasks.append(await wait_for_task_completion(task_info))
        
        # Return the last task response
        result = tasks[-1] if tasks else TaskResponse(
            task_uid="no_changes",
            status="succeeded",
            type="settings_update",
            details={"message": "No settings to update"}
        )
        
        if result.status == "succeeded":
            logger.info("Successfully updated index settings")
        else:
            logger.warning(f"Settings update completed with status: {result.status}")
            
        return result
        
    except Exception as e:
        logger.error(f"Error updating settings: {e}")
        raise HTTPException(status_code=500, detail=f"Settings update failed: {str(e)}")


@app.get("/search", response_model=SearchResponse)
async def search_products(
    q: str = Query(..., description="Search query"),
    filters: Optional[str] = Query(None, description="Filter expression (e.g., 'group = SCV AND record_type = Tyre')"),
    limit: int = Query(20, ge=1, le=1000, description="Number of results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    sort: Optional[str] = Query(None, description="Sort criteria (e.g., 'size:asc,load_index:desc')"),
    highlight: bool = Query(False, description="Enable search term highlighting"),
    crop_length: Optional[int] = Query(None, ge=1, le=1000, description="Length for text cropping"),
    attributes_to_retrieve: Optional[str] = Query(None, description="Comma-separated list of attributes to return"),
    attributes_to_highlight: Optional[str] = Query(None, description="Comma-separated list of attributes to highlight"),
    attributes_to_crop: Optional[str] = Query(None, description="Comma-separated list of attributes to crop"),
    show_matches_position: bool = Query(False, description="Show position of matches in results")
):
    """
    Advanced search with highlighting, cropping, and custom attribute selection
    See: https://docs.meilisearch.com/reference/api/search.html
    """
    try:
        index = meili_client.index(PRODUCTS_INDEX)
        
        # Prepare search parameters
        search_params = {
            "limit": limit,
            "offset": offset,
            "show_matches_position": show_matches_position
        }
        
        # Add filter if provided
        if filters:
            search_params["filter"] = filters
            
        # Add sort if provided (convert comma-separated to list)
        if sort:
            sort_list = [s.strip() for s in sort.split(",")]
            search_params["sort"] = sort_list
        
        # Add attribute selection
        if attributes_to_retrieve:
            search_params["attributes_to_retrieve"] = [attr.strip() for attr in attributes_to_retrieve.split(",")]
        
        # Add highlighting
        if highlight:
            if attributes_to_highlight:
                search_params["attributes_to_highlight"] = [attr.strip() for attr in attributes_to_highlight.split(",")]
            else:
                search_params["attributes_to_highlight"] = ["*"]
        
        # Add cropping
        if attributes_to_crop:
            search_params["attributes_to_crop"] = [attr.strip() for attr in attributes_to_crop.split(",")]
            if crop_length:
                search_params["crop_length"] = crop_length
        
        # Perform search
        results = await index.search(q, **search_params)
        
        logger.info(f"Search query '{q}' returned {len(results.hits)} results")
        
        return SearchResponse(
            hits=results.hits,
            query=q,
            processing_time_ms=results.processing_time_ms,
            limit=limit,
            offset=offset,
            estimated_total_hits=getattr(results, 'estimated_total_hits', len(results.hits))
        )
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@app.get("/search/facets", response_model=FacetedSearchResponse)
async def search_with_facets(
    q: str = Query("", description="Search query (can be empty for facet-only search)"),
    facets: str = Query(..., description="Comma-separated list of facets to retrieve (e.g., 'group,record_type,ply_rating')"),
    filters: Optional[str] = Query(None, description="Filter expression"),
    limit: int = Query(20, ge=0, le=1000, description="Number of results to return (0 for facets only)"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    max_values_per_facet: int = Query(100, ge=1, le=1000, description="Maximum number of values per facet")
):
    """
    Faceted search for filtering and analytics
    Returns search results along with facet counts for building filter UIs
    """
    try:
        index = meili_client.index(PRODUCTS_INDEX)
        
        # Prepare search parameters
        search_params = {
            "limit": limit,
            "offset": offset,
            "facets": [facet.strip() for facet in facets.split(",")]
        }
        
        # Add filter if provided
        if filters:
            search_params["filter"] = filters
        
        # Perform search
        results = await index.search(q, **search_params)
        
        logger.info(f"Faceted search query '{q}' returned {len(results.hits)} results with facets: {facets}")
        
        return FacetedSearchResponse(
            hits=results.hits,
            facet_distribution=getattr(results, 'facet_distribution', {}),
            query=q,
            processing_time_ms=results.processing_time_ms,
            limit=limit,
            offset=offset,
            estimated_total_hits=getattr(results, 'estimated_total_hits', len(results.hits))
        )
        
    except Exception as e:
        logger.error(f"Faceted search error: {e}")
        raise HTTPException(status_code=500, detail=f"Faceted search failed: {str(e)}")


@app.get("/search/filters/brands")
async def get_available_brands():
    """
    Get all available tire brands for filter UI
    """
    try:
        index = meili_client.index(PRODUCTS_INDEX)
        
        # Search with brand facet to get all available brands
        results = await index.search("", facets=["brand"], limit=0)
        brands = getattr(results, 'facet_distribution', {}).get('brand', {})
        
        return {
            "brands": [{"value": brand, "count": count} for brand, count in brands.items()],
            "total_brands": len(brands)
        }
        
    except Exception as e:
        logger.error(f"Error getting brands: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get brands: {str(e)}")


@app.get("/search/filters/groups")
async def get_available_groups():
    """
    Get all available product groups for filter UI
    """
    try:
        index = meili_client.index(PRODUCTS_INDEX)
        
        # Search with group facet to get all available groups
        results = await index.search("", facets=["group"], limit=0)
        groups = getattr(results, 'facet_distribution', {}).get('group', {})
        
        return {
            "groups": [{"value": group, "count": count} for group, count in groups.items()],
            "total_groups": len(groups)
        }
        
    except Exception as e:
        logger.error(f"Error getting groups: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get groups: {str(e)}")


@app.get("/search/filters/record-types")
async def get_available_record_types():
    """
    Get all available record types for filter UI
    """
    try:
        index = meili_client.index(PRODUCTS_INDEX)
        
        results = await index.search("", facets=["record_type"], limit=0)
        record_types = getattr(results, 'facet_distribution', {}).get('record_type', {})
        
        return {
            "record_types": [{"value": rt, "count": count} for rt, count in record_types.items()],
            "total_record_types": len(record_types)
        }
        
    except Exception as e:
        logger.error(f"Error getting record types: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get record types: {str(e)}")


@app.get("/search/filters/ply-ratings")
async def get_available_ply_ratings():
    """
    Get all available ply ratings for filter UI
    """
    try:
        index = meili_client.index(PRODUCTS_INDEX)
        
        results = await index.search("", facets=["ply_rating"], limit=0)
        ply_ratings = getattr(results, 'facet_distribution', {}).get('ply_rating', {})
        
        return {
            "ply_ratings": [{"value": pr, "count": count} for pr, count in ply_ratings.items() if pr],
            "total_ply_ratings": len([pr for pr in ply_ratings.keys() if pr])
        }
        
    except Exception as e:
        logger.error(f"Error getting ply ratings: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get ply ratings: {str(e)}")


@app.get("/search/suggestions", response_model=SearchSuggestionResponse)
async def get_search_suggestions(
    q: str = Query(..., description="Partial search query"),
    limit: int = Query(5, ge=1, le=20, description="Number of suggestions to return")
):
    """
    Get search suggestions/autocomplete based on indexed content
    Uses prefix search on pattern_model and material fields
    """
    try:
        index = meili_client.index(PRODUCTS_INDEX)
        
        # Search for suggestions using prefix matching
        results = await index.search(
            q,
            attributes_to_retrieve=["pattern_model", "material", "mpn", "size"],
            limit=limit * 5  # Get more results to extract suggestions
        )
        
        # Extract unique suggestions
        suggestions = set()
        query_lower = q.lower()
        
        for hit in results.hits:
            # Add pattern model if it starts with or contains the query
            if hit.get('pattern_model'):
                pattern = hit['pattern_model']
                if query_lower in pattern.lower():
                    suggestions.add(pattern)
                
                # Also add individual words from pattern that start with query
                for word in pattern.split():
                    if word.lower().startswith(query_lower) and len(word) > 2:
                        suggestions.add(word)
            
            # Add meaningful words from material description
            if hit.get('material'):
                material_words = hit['material'].split()
                for word in material_words:
                    if word.lower().startswith(query_lower) and len(word) > 2:
                        # Clean up the word (remove special characters)
                        clean_word = ''.join(c for c in word if c.isalnum())
                        if len(clean_word) > 2:
                            suggestions.add(clean_word)
            
            if len(suggestions) >= limit * 2:
                break
        
        return SearchSuggestionResponse(
            suggestions=list(suggestions)[:limit],
            query=q
        )
        
    except Exception as e:
        logger.error(f"Error getting suggestions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get suggestions: {str(e)}")


@app.get("/search/similar/{product_id}", response_model=SimilarProductsResponse)
async def get_similar_products(
    product_id: str,
    limit: int = Query(10, ge=1, le=50, description="Number of similar products to return")
):
    """
    Find similar products based on a given product ID
    Uses shared attributes like group, size, ply_rating, pattern_model
    """
    try:
        index = meili_client.index(PRODUCTS_INDEX)
        
        # First, get the reference product by searching for the exact ID
        results = await index.search(
            product_id,
            attributes_to_retrieve=["id", "group", "size", "ply_rating", "pattern_model", "material", "mpn", "record_type"],
            limit=10  # Get a few results in case there are similar IDs
        )
        
        # Find the exact match
        ref_product = None
        for hit in results.hits:
            if hit.get('id') == product_id:
                ref_product = hit
                break
        
        if not ref_product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Build similarity search using only filterable attributes
        search_query = ""
        
        # Search for products with similar pattern
        if ref_product.get('pattern_model'):
            search_query = ref_product['pattern_model']
        elif ref_product.get('group'):
            search_query = ref_product['group']
        
        # Use only filterable attributes for filters
        filters = []
        
        # Same group (filterable)
        if ref_product.get('group'):
            filters.append(f"group = '{ref_product['group']}'")
        
        # Same ply rating (filterable)
        if ref_product.get('ply_rating'):
            filters.append(f"ply_rating = '{ref_product['ply_rating']}'")
        
        # Same record type (filterable)
        if ref_product.get('record_type'):
            filters.append(f"record_type = '{ref_product['record_type']}'")
        
        # Combine filters - require same group, make others optional
        filter_expression = None
        if ref_product.get('group'):
            base_filter = f"group = '{ref_product['group']}'"
            
            optional_filters = []
            if ref_product.get('ply_rating'):
                optional_filters.append(f"ply_rating = '{ref_product['ply_rating']}'")
            if ref_product.get('record_type'):
                optional_filters.append(f"record_type = '{ref_product['record_type']}'")
            
            if optional_filters:
                filter_expression = f"{base_filter} AND ({' OR '.join(optional_filters)})"
            else:
                filter_expression = base_filter
        
        # Search for similar products
        similar_results = await index.search(
            search_query,
            filter=filter_expression,
            limit=limit + 10,  # Get extra results to filter out the original
            attributes_to_retrieve=["id", "material", "mpn", "size", "group", "record_type", "ply_rating", "pattern_model"]
        )
        
        # Filter out the original product from results
        filtered_hits = [hit for hit in similar_results.hits if hit.get('id') != product_id][:limit]
        
        return SimilarProductsResponse(
            reference_product=ref_product,
            similar_products=filtered_hits,
            total_found=len(filtered_hits),
            processing_time_ms=similar_results.processing_time_ms
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding similar products: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to find similar products: {str(e)}")


@app.get("/analytics/stats")
async def get_search_statistics():
    """
    Get search index statistics and analytics
    """
    try:
        index = meili_client.index(PRODUCTS_INDEX)
        
        # Get index stats
        stats = await index.get_stats()
        
        # Get facet distributions for analytics
        facet_search = await index.search("", facets=["brand", "group", "record_type", "ply_rating"], limit=0)
        facets = getattr(facet_search, 'facet_distribution', {})
        
        return {
            "index_stats": {
                "number_of_documents": stats.number_of_documents,
                "is_indexing": stats.is_indexing,
                "field_distribution": getattr(stats, 'field_distribution', {})
            },
            "facet_analytics": {
                "brands": facets.get('brand', {}),
                "groups": facets.get('group', {}),
                "record_types": facets.get('record_type', {}),
                "ply_ratings": {k: v for k, v in facets.get('ply_rating', {}).items() if k}
            },
            "top_brands": sorted(facets.get('brand', {}).items(), key=lambda x: x[1], reverse=True)[:10],
            "top_groups": sorted(facets.get('group', {}).items(), key=lambda x: x[1], reverse=True)[:10],
            "top_record_types": sorted(facets.get('record_type', {}).items(), key=lambda x: x[1], reverse=True)[:10]
        }
        
    except Exception as e:
        logger.error(f"Error getting statistics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")


@app.get("/health")
async def health_check():
    """
    Health check endpoint with Meilisearch status and version
    """
    try:
        # Check Meilisearch health
        health = await meili_client.health()
        version = await meili_client.get_version()
        
        return {
            "status": "healthy",
            "meilisearch": {
                "status": health.status if hasattr(health, 'status') else "available",
                "version": version.pkg_version if hasattr(version, 'pkg_version') else str(version)
            },
            "service": "multi-brand-tire-search-backend"
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "service": "multi-brand-tire-search-backend"
            }
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
