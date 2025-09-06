"""
Pydantic models for E-commerce Search Backend
Defines data structures for products, search responses, and settings
"""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from decimal import Decimal


class Product(BaseModel):
    """
    Apollo Tire Product model for tire/automotive parts indexing
    Based on Apollo tire catalog data structure
    """
    id: str = Field(..., description="Unique product identifier (MPN)")
    group: str = Field(..., description="Product group category")
    material: str = Field(..., description="Material description/product name")
    record_type: str = Field(..., description="Type of record (Tyre, Flaps, etc.)")
    mpn: str = Field(..., description="Manufacturer Part Number")
    size: Optional[str] = Field(None, description="Tire/product size")
    ply_rating: Optional[str] = Field(None, description="Ply rating (e.g., 8PR, 6PR)")
    pattern_model: Optional[str] = Field(None, description="Pattern or model name")
    construction_type: Optional[str] = Field(None, description="Construction type")
    load_index: Optional[str] = Field(None, description="Load index rating")
    speed_rating: Optional[str] = Field(None, description="Speed rating")
    series: Optional[str] = Field(None, description="Tire series")
    special_features: Optional[str] = Field(None, description="Special features or codes")
    
    # Additional computed fields for better search
    title: Optional[str] = Field(None, description="Computed title for search")
    brand: str = Field(default="Apollo", description="Brand (Apollo)")
    category: Optional[str] = Field(None, description="Computed category")
    tags: Optional[List[str]] = Field(default_factory=list, description="Search tags")

    class Config:
        schema_extra = {
            "example": {
                "id": "RTH1YDLXP1A01",
                "group": "SCV",
                "material": "155/80 D12 8PR LOADSTAR SUPER XP - D",
                "record_type": "Tyre",
                "mpn": "RTH1YDLXP1A01",
                "size": "155/80 D12",
                "ply_rating": "8PR",
                "pattern_model": "LOADSTAR SUPER XP",
                "construction_type": None,
                "load_index": None,
                "speed_rating": None,
                "series": None,
                "special_features": "D",
                "title": "155/80 D12 8PR LOADSTAR SUPER XP - D",
                "brand": "Apollo",
                "category": "SCV Tyres",
                "tags": ["loadstar", "super", "xp", "8pr", "d12"]
            }
        }


class SearchResponse(BaseModel):
    """
    Search response model containing results and metadata
    """
    hits: List[Dict[str, Any]] = Field(..., description="Search results")
    query: str = Field(..., description="Original search query")
    processing_time_ms: int = Field(..., description="Search processing time in milliseconds")
    limit: int = Field(..., description="Maximum number of results requested")
    offset: int = Field(..., description="Number of results skipped")
    estimated_total_hits: int = Field(..., description="Estimated total number of matching documents")

    class Config:
        schema_extra = {
            "example": {
                "hits": [
                    {
                        "id": "RTH1YDLXP1A01",
                        "title": "155/80 D12 8PR LOADSTAR SUPER XP - D",
                        "material": "155/80 D12 8PR LOADSTAR SUPER XP - D",
                        "mpn": "RTH1YDLXP1A01",
                        "size": "155/80 D12",
                        "group": "SCV",
                        "record_type": "Tyre",
                        "ply_rating": "8PR"
                    }
                ],
                "query": "loadstar 155/80",
                "processing_time_ms": 15,
                "limit": 20,
                "offset": 0,
                "estimated_total_hits": 1
            }
        }


class IndexSettings(BaseModel):
    """
    Meilisearch index settings configuration
    See: https://docs.meilisearch.com/reference/api/settings.html
    """
    searchable_attributes: Optional[List[str]] = Field(
        None, 
        description="Attributes to search in, ordered by importance"
    )
    filterable_attributes: Optional[List[str]] = Field(
        None,
        description="Attributes that can be used for filtering"
    )
    sortable_attributes: Optional[List[str]] = Field(
        None,
        description="Attributes that can be used for sorting"
    )
    ranking_rules: Optional[List[str]] = Field(
        None,
        description="Custom ranking rules for search relevance"
    )
    stop_words: Optional[List[str]] = Field(
        None,
        description="Words to ignore during search"
    )
    synonyms: Optional[Dict[str, List[str]]] = Field(
        None,
        description="Synonym groups for query expansion"
    )
    distinct_attribute: Optional[str] = Field(
        None,
        description="Attribute to use for deduplication"
    )

    class Config:
        schema_extra = {
            "example": {
                "searchable_attributes": [
                    "title",
                    "material",
                    "pattern_model", 
                    "mpn",
                    "size",
                    "group",
                    "tags"
                ],
                "filterable_attributes": [
                    "group",
                    "record_type",
                    "brand", 
                    "ply_rating",
                    "construction_type",
                    "load_index",
                    "speed_rating",
                    "series",
                    "special_features",
                    "category"
                ],
                "sortable_attributes": [
                    "size",
                    "load_index",
                    "speed_rating",
                    "title",
                    "mpn"
                ],
                "ranking_rules": [
                    "words",
                    "typo",
                    "proximity",
                    "attribute",
                    "sort",
                    "exactness"
                ],
                "stop_words": ["the", "a", "an"],
                "synonyms": {
                    "tire": ["tyre", "wheel"],
                    "radial": ["rad", "r"],
                    "bias": ["diagonal", "d"],
                    "tube": ["inner tube", "flap"]
                }
            }
        }


class TaskResponse(BaseModel):
    """
    Meilisearch task response model
    Represents the status of async operations like indexing
    """
    task_uid: str = Field(..., description="Unique task identifier")
    status: str = Field(..., description="Task status (enqueued, processing, succeeded, failed)")
    type: str = Field(..., description="Task type (e.g., documentAdditionOrUpdate)")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional task details")

    class Config:
        schema_extra = {
            "example": {
                "task_uid": "1",
                "status": "succeeded",
                "type": "documentAdditionOrUpdate",
                "details": {
                    "receivedDocuments": 100,
                    "indexedDocuments": 100
                }
            }
        }
