"""
E-commerce Search Backend using Meilisearch and FastAPI
Production-ready microservice for product search and indexing
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
import httpx
from dotenv import load_dotenv

# Using meilisearch-python-sdk async client
# Docs: https://github.com/meilisearch/meilisearch-python-sdk
from meilisearch_python_sdk import AsyncClient
from meilisearch_python_sdk.models.task import TaskInfo

from .schemas import Product, SearchResponse, IndexSettings, TaskResponse

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
    title="E-commerce Search Backend",
    description="Production-ready search microservice using Meilisearch",
    version="1.0.0",
    lifespan=lifespan
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
    filters: Optional[str] = Query(None, description="Filter expression (e.g., 'category = electronics')"),
    limit: int = Query(20, ge=1, le=1000, description="Number of results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    sort: Optional[str] = Query(None, description="Sort criteria (e.g., 'price:asc,rating:desc')")
):
    """
    Search products with filters, pagination, and sorting
    See: https://docs.meilisearch.com/reference/api/search.html
    """
    try:
        index = meili_client.index(PRODUCTS_INDEX)
        
        # Prepare search parameters
        search_params = {
            "limit": limit,
            "offset": offset
        }
        
        # Add filter if provided
        if filters:
            search_params["filter"] = filters
            
        # Add sort if provided (convert comma-separated to list)
        if sort:
            sort_list = [s.strip() for s in sort.split(",")]
            search_params["sort"] = sort_list
        
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
            "service": "apollo-tire-search-backend"
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "service": "apollo-tire-search-backend"
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
