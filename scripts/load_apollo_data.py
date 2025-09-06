#!/usr/bin/env python3
"""
Apollo Tire Data Loader
Loads Apollo tire data from TSV file and indexes it in Meilisearch
"""

import asyncio
import os
import sys
import csv
import re
from typing import List, Dict, Any
from datetime import datetime

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from meilisearch_python_sdk import AsyncClient

load_dotenv()

# Configuration
MEILI_URL = os.getenv("MEILI_URL", "http://localhost:7700")
MEILI_MASTER_KEY = os.getenv("MEILI_MASTER_KEY", "development_key_please_change_in_production")
PRODUCTS_INDEX = os.getenv("PRODUCTS_INDEX", "products")
DATA_FILE = "data/apollo-parsed.tsv"
BATCH_SIZE = 100


def clean_field_name(field_name: str) -> str:
    """Convert field names to snake_case for consistency"""
    return field_name.lower().replace("/", "_").replace(" ", "_").replace("-", "_")


def extract_tags(material: str, pattern_model: str, size: str) -> List[str]:
    """Extract searchable tags from product data"""
    tags = []
    
    # Extract words from material
    if material:
        words = re.findall(r'\b[A-Za-z]{3,}\b', material.upper())
        tags.extend([word.lower() for word in words])
    
    # Extract words from pattern/model
    if pattern_model:
        words = re.findall(r'\b[A-Za-z]{3,}\b', pattern_model.upper())
        tags.extend([word.lower() for word in words])
    
    # Extract size components
    if size:
        # Extract numeric parts and common size patterns
        size_parts = re.findall(r'\d+(?:\.\d+)?|[A-Z]+', size.upper())
        tags.extend([part.lower() for part in size_parts if len(part) >= 2])
    
    # Remove duplicates and common words
    common_words = {'the', 'and', 'or', 'for', 'with', 'from', 'apollo'}
    tags = list(set(tag for tag in tags if tag not in common_words and len(tag) >= 2))
    
    return tags[:10]  # Limit to 10 tags


def compute_category(group: str, record_type: str) -> str:
    """Compute a category from group and record type"""
    if group and record_type:
        return f"{group} {record_type}s"
    elif record_type:
        return f"{record_type}s"
    elif group:
        return group
    else:
        return "Automotive Parts"


def compute_title(material: str, size: str, pattern_model: str) -> str:
    """Compute a searchable title from available fields"""
    title_parts = []
    
    if size:
        title_parts.append(size)
    
    if pattern_model and pattern_model.strip():
        title_parts.append(pattern_model)
    elif material:
        # If no pattern/model, use material but try to clean it up
        clean_material = material
        if size and size in material:
            clean_material = material.replace(size, "").strip()
        title_parts.append(clean_material)
    
    return " ".join(title_parts).strip() or material or "Apollo Product"


def parse_apollo_data(file_path: str) -> List[Dict[str, Any]]:
    """Parse Apollo TSV data into product dictionaries"""
    products = []
    
    with open(file_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file, delimiter='\t')
        
        for i, row in enumerate(reader):
            try:
                # Clean and map fields
                group = row.get('Group', '').strip()
                material = row.get('Material', '').strip()
                record_type = row.get('Record Type', '').strip()
                mpn = row.get('MPN', '').strip()
                size = row.get('Size', '').strip()
                ply_rating = row.get('Ply Rating', '').strip()
                pattern_model = row.get('Pattern/Model', '').strip()
                construction_type = row.get('Construction Type', '').strip()
                load_index = row.get('Load Index', '').strip()
                speed_rating = row.get('Speed Rating', '').strip()
                series = row.get('Series', '').strip()
                special_features = row.get('Special Features', '').strip()
                
                # Skip rows with missing essential data
                if not mpn or not material:
                    continue
                
                # Compute derived fields
                title = compute_title(material, size, pattern_model)
                category = compute_category(group, record_type)
                tags = extract_tags(material, pattern_model, size)
                
                product = {
                    "id": mpn,
                    "group": group or None,
                    "material": material,
                    "record_type": record_type or None,
                    "mpn": mpn,
                    "size": size or None,
                    "ply_rating": ply_rating or None,
                    "pattern_model": pattern_model or None,
                    "construction_type": construction_type or None,
                    "load_index": load_index or None,
                    "speed_rating": speed_rating or None,
                    "series": series or None,
                    "special_features": special_features or None,
                    "title": title,
                    "brand": "Apollo",
                    "category": category,
                    "tags": tags
                }
                
                products.append(product)
                
            except Exception as e:
                print(f"⚠️  Error parsing row {i+1}: {e}")
                continue
    
    return products


async def setup_apollo_index_settings(client: AsyncClient):
    """
    Configure optimal settings for Apollo tire search
    """
    print("🔧 Setting up Apollo tire index configuration...")
    
    index = client.index(PRODUCTS_INDEX)
    
    # Set searchable attributes
    searchable_attrs = [
        "title",
        "material", 
        "pattern_model",
        "mpn",
        "size",
        "group",
        "tags"
    ]
    task_info = await index.update_searchable_attributes(searchable_attrs)
    await client.wait_for_task(task_info.task_uid, timeout_in_ms=30000)
    
    # Set filterable attributes
    filterable_attrs = [
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
    ]
    task_info = await index.update_filterable_attributes(filterable_attrs)
    await client.wait_for_task(task_info.task_uid, timeout_in_ms=30000)
    
    # Set sortable attributes
    sortable_attrs = [
        "size",
        "load_index", 
        "speed_rating",
        "title",
        "mpn"
    ]
    task_info = await index.update_sortable_attributes(sortable_attrs)
    await client.wait_for_task(task_info.task_uid, timeout_in_ms=30000)
    
    # Set ranking rules
    ranking_rules = [
        "words",
        "typo",
        "proximity", 
        "attribute",
        "sort",
        "exactness"
    ]
    task_info = await index.update_ranking_rules(ranking_rules)
    await client.wait_for_task(task_info.task_uid, timeout_in_ms=30000)
    
    # Set synonyms for tire terminology
    synonyms = {
        "tire": ["tyre", "wheel"],
        "radial": ["rad", "r"],
        "bias": ["diagonal", "d"],
        "tube": ["inner tube", "flap"],
        "pr": ["ply", "ply rating"],
        "lt": ["light truck"],
        "passenger": ["car", "vehicle"]
    }
    task_info = await index.update_synonyms(synonyms)
    await client.wait_for_task(task_info.task_uid, timeout_in_ms=30000)
    
    print("✅ Apollo tire index settings configured successfully")


async def index_products_batch(client: AsyncClient, products: List[Dict], batch_num: int):
    """Index a batch of Apollo tire products"""
    print(f"📦 Indexing batch {batch_num} ({len(products)} products)...")
    
    index = client.index(PRODUCTS_INDEX)
    task_info = await index.add_documents(products)
    
    # Wait for indexing to complete
    await client.wait_for_task(task_info.task_uid, timeout_in_ms=60000)
    print(f"✅ Batch {batch_num} indexed successfully")


async def main():
    """Main data loading function"""
    print("🚗 Starting Apollo tire data loading process...")
    
    # Check if data file exists
    if not os.path.exists(DATA_FILE):
        print(f"❌ Data file not found: {DATA_FILE}")
        print("Please ensure the apollo-parsed.tsv file is in the data/ directory")
        return
    
    # Initialize Meilisearch client
    client = AsyncClient(url=MEILI_URL, api_key=MEILI_MASTER_KEY)
    
    try:
        # Test connection
        health = await client.health()
        print(f"🟢 Connected to Meilisearch: {health}")
        
        # Parse the data file
        print(f"📄 Parsing data from {DATA_FILE}...")
        products = parse_apollo_data(DATA_FILE)
        print(f"📊 Parsed {len(products)} valid products")
        
        if not products:
            print("❌ No valid products found in data file")
            return
        
        # Setup index settings
        await setup_apollo_index_settings(client)
        
        # Clear existing index to start fresh
        index = client.index(PRODUCTS_INDEX)
        try:
            task_info = await index.delete_all_documents()
            await client.wait_for_task(task_info.task_uid, timeout_in_ms=30000)
            print("🧹 Cleared existing index data")
        except Exception as e:
            print(f"⚠️  Could not clear index: {e}")
        
        # Index products in batches
        total_batches = (len(products) + BATCH_SIZE - 1) // BATCH_SIZE
        
        for batch_start in range(0, len(products), BATCH_SIZE):
            batch_end = min(batch_start + BATCH_SIZE, len(products))
            batch_num = (batch_start // BATCH_SIZE) + 1
            
            batch_products = products[batch_start:batch_end]
            await index_products_batch(client, batch_products, batch_num)
        
        # Get final stats
        stats = await index.get_stats()
        
        print(f"🎉 Apollo tire data loading completed successfully!")
        print(f"📈 Total documents indexed: {stats.number_of_documents}")
        print(f"📋 Field distribution: {dict(list(stats.field_distribution.items())[:5])}...")
        
        # Show some sample searches
        print(f"\n🔍 Sample searches you can try:")
        print(f"  - Search by size: curl 'http://localhost:8000/search?q=155/80'")
        print(f"  - Search by pattern: curl 'http://localhost:8000/search?q=LOADSTAR'")
        print(f"  - Filter by group: curl 'http://localhost:8000/search?q=tire&filters=group=SCV'")
        print(f"  - Filter by type: curl 'http://localhost:8000/search?q=&filters=record_type=Tyre'")
        
    except Exception as e:
        print(f"❌ Error during data loading: {e}")
        raise
    finally:
        await client.aclose()


if __name__ == "__main__":
    asyncio.run(main())
