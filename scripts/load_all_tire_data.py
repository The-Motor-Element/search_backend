#!/usr/bin/env python3
"""
Multi-Brand Tire Data Loader
Loads tire data from multiple brands (Apollo, CEAT, MRF, Eurogrip) and indexes it in Meilisearch
"""

import asyncio
import os
import sys
import csv
import re
from typing import List, Dict, Any, Optional
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
BATCH_SIZE = 100

# Data file configurations
DATA_FILES = {
    "Apollo": {
        "file": "data/Apollo-parsed.tsv",
        "columns": {
            "group": "Group",
            "material": "Material", 
            "record_type": "Record Type",
            "mpn": "MPN",
            "size": "Size",
            "ply_rating": "Ply Rating",
            "pattern_model": "Pattern/Model",
            "construction_type": "Construction Type",
            "load_index": "Load Index",
            "speed_rating": "Speed Rating",
            "series": "Series",
            "special_features": "Special Features"
        }
    },
    "CEAT": {
        "file": "data/CEAT-parsed.tsv",
        "columns": {
            "group": "Mat.Grp.Description",
            "material": "Material Description",
            "record_type": "rec_type", 
            "mpn": "MPN",
            "size": "Size",
            "ply_rating": "Ply Rating",
            "pattern_model": "Model / Brand",
            "construction_type": "Tire Type",
            "load_index": "load index and speed rating",
            "speed_rating": "load index and speed rating", 
            "series": None,
            "special_features": "Other"
        }
    },
    "MRF": {
        "file": "data/MRF-Parsed.tsv",
        "columns": {
            "group": "CATEGORY",
            "material": "OE PRODUCT NAME",
            "record_type": None,
            "mpn": "MPN",
            "size": "Tire Size", 
            "ply_rating": "Ply Rating",
            "pattern_model": "Product Name",
            "construction_type": "Construction",
            "load_index": "Load Index",
            "speed_rating": "Speed Rating",
            "series": None,
            "special_features": "Extras"
        }
    },
    "Eurogrip": {
        "file": "data/Eurogrip.tsv",
        "columns": {
            "group": "Group",
            "material": "Product Name",
            "record_type": "Type",
            "mpn": "Tyre Code",
            "size": "Tire Size",
            "ply_rating": "Ply Rating", 
            "pattern_model": "Product Name",
            "construction_type": "Construction",
            "load_index": "Load Index",
            "speed_rating": "Speed Rating",
            "series": None,
            "special_features": "Extras"
        }
    }
}


def clean_field_name(field_name: str) -> str:
    """Convert field names to snake_case for consistency"""
    return field_name.lower().replace("/", "_").replace(" ", "_").replace("-", "_")


def extract_tags(material: str, pattern_model: str, size: str, brand: str) -> List[str]:
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
    
    # Add brand as a tag
    if brand:
        tags.append(brand.lower())
    
    # Remove duplicates and common words
    common_words = {'the', 'and', 'or', 'for', 'with', 'from', 'apollo', 'ceat', 'mrf', 'eurogrip', 'tvs'}
    tags = list(set(tag for tag in tags if tag not in common_words and len(tag) >= 2))
    
    return tags[:10]  # Limit to 10 tags


def compute_category(group: str, record_type: str, brand: str) -> str:
    """Compute a category from group and record type"""
    parts = []
    
    if brand:
        parts.append(brand)
    
    if group and group.strip():
        parts.append(group.strip())
    
    if record_type and record_type.strip():
        if record_type.lower().endswith('s'):
            parts.append(record_type)
        else:
            parts.append(f"{record_type}s")
    elif group:
        parts.append("Products")
    else:
        parts.append("Automotive Parts")
    
    return " ".join(parts)


def compute_title(material: str, size: str, pattern_model: str) -> str:
    """Compute a searchable title from available fields"""
    title_parts = []
    
    if size and size.strip():
        title_parts.append(size.strip())
    
    if pattern_model and pattern_model.strip() and pattern_model != material:
        title_parts.append(pattern_model.strip())
    elif material and material.strip():
        # If no pattern/model, use material but try to clean it up
        clean_material = material.strip()
        if size and size in material:
            clean_material = material.replace(size, "").strip()
        title_parts.append(clean_material)
    
    title = " ".join(title_parts).strip()
    return title or material or "Tire Product"


def parse_load_speed_combined(combined_field: str) -> tuple[Optional[str], Optional[str]]:
    """Parse combined load index and speed rating field (for CEAT)"""
    if not combined_field or not combined_field.strip():
        return None, None
    
    # Try to extract load index (numbers) and speed rating (letters)
    load_match = re.search(r'(\d+(?:/\d+)?)', combined_field)
    speed_match = re.search(r'([A-Z]+)', combined_field)
    
    load_index = load_match.group(1) if load_match else None
    speed_rating = speed_match.group(1) if speed_match else None
    
    return load_index, speed_rating


def parse_brand_data(brand: str, file_path: str, column_mapping: Dict[str, str]) -> List[Dict[str, Any]]:
    """Parse tire data for a specific brand"""
    products = []
    
    if not os.path.exists(file_path):
        print(f"⚠️  Data file not found: {file_path}")
        return products
    
    print(f"📄 Parsing {brand} data from {file_path}...")
    
    with open(file_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file, delimiter='\t')
        
        for i, row in enumerate(reader):
            try:
                # Extract fields based on column mapping
                group = row.get(column_mapping.get('group', ''), '').strip() if column_mapping.get('group') else None
                material = row.get(column_mapping.get('material', ''), '').strip()
                record_type = row.get(column_mapping.get('record_type', ''), '').strip() if column_mapping.get('record_type') else None
                mpn = row.get(column_mapping.get('mpn', ''), '').strip()
                size = row.get(column_mapping.get('size', ''), '').strip() if column_mapping.get('size') else None
                ply_rating = row.get(column_mapping.get('ply_rating', ''), '').strip() if column_mapping.get('ply_rating') else None
                pattern_model = row.get(column_mapping.get('pattern_model', ''), '').strip() if column_mapping.get('pattern_model') else None
                construction_type = row.get(column_mapping.get('construction_type', ''), '').strip() if column_mapping.get('construction_type') else None
                load_index = row.get(column_mapping.get('load_index', ''), '').strip() if column_mapping.get('load_index') else None
                speed_rating = row.get(column_mapping.get('speed_rating', ''), '').strip() if column_mapping.get('speed_rating') else None
                series = row.get(column_mapping.get('series', ''), '').strip() if column_mapping.get('series') else None
                special_features = row.get(column_mapping.get('special_features', ''), '').strip() if column_mapping.get('special_features') else None
                
                # Skip rows with missing essential data
                if not mpn or not material:
                    continue
                
                # Handle special cases for different brands
                if brand == "CEAT":
                    # CEAT has combined load index and speed rating
                    if load_index and load_index == speed_rating:  # Same field
                        parsed_load, parsed_speed = parse_load_speed_combined(load_index)
                        load_index = parsed_load
                        speed_rating = parsed_speed
                elif brand == "MRF":
                    # MRF might have "Complete Tyre Code" as material
                    complete_code_field = row.get("Complete Tyre Code", "").strip()
                    if complete_code_field and not material:
                        material = complete_code_field
                elif brand == "Eurogrip":
                    # Eurogrip might have "Complete Tyre Code" as well
                    complete_code_field = row.get("Complete Tyre Code", "").strip()
                    if complete_code_field:
                        if not material or len(complete_code_field) > len(material):
                            material = complete_code_field
                
                # Clean up empty strings to None
                def clean_empty(value):
                    return value if value and value.strip() else None
                
                group = clean_empty(group)
                record_type = clean_empty(record_type) or "Tyre"  # Default to Tyre
                size = clean_empty(size)
                ply_rating = clean_empty(ply_rating)
                pattern_model = clean_empty(pattern_model)
                construction_type = clean_empty(construction_type)
                load_index = clean_empty(load_index)
                speed_rating = clean_empty(speed_rating)
                series = clean_empty(series)
                special_features = clean_empty(special_features)
                
                # Compute derived fields
                title = compute_title(material, size, pattern_model)
                category = compute_category(group, record_type, brand)
                tags = extract_tags(material, pattern_model, size, brand)
                
                # Create unique ID with brand prefix to avoid collisions
                unique_id = f"{brand.upper()}_{mpn}"
                
                product = {
                    "id": unique_id,
                    "group": group,
                    "material": material,
                    "record_type": record_type,
                    "mpn": mpn,
                    "size": size,
                    "ply_rating": ply_rating,
                    "pattern_model": pattern_model,
                    "construction_type": construction_type,
                    "load_index": load_index,
                    "speed_rating": speed_rating,
                    "series": series,
                    "special_features": special_features,
                    "title": title,
                    "brand": brand,
                    "category": category,
                    "tags": tags
                }
                
                products.append(product)
                
            except Exception as e:
                print(f"⚠️  Error parsing {brand} row {i+1}: {e}")
                continue
    
    print(f"📊 Parsed {len(products)} valid {brand} products")
    return products


async def setup_tire_index_settings(client: AsyncClient):
    """
    Configure optimal settings for multi-brand tire search
    """
    print("🔧 Setting up multi-brand tire index configuration...")
    
    index = client.index(PRODUCTS_INDEX)
    
    # Set searchable attributes (in order of importance)
    searchable_attrs = [
        "title",
        "material", 
        "pattern_model",
        "mpn",
        "size",
        "brand",
        "group",
        "tags"
    ]
    task_info = await index.update_searchable_attributes(searchable_attrs)
    await client.wait_for_task(task_info.task_uid, timeout_in_ms=30000)
    
    # Set filterable attributes
    filterable_attrs = [
        "brand",
        "group",
        "record_type",
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
        "brand",
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
        "bias": ["diagonal", "d", "bias-ply"],
        "tube": ["inner tube", "flap", "tt", "tubetype"],
        "tubeless": ["tl"],
        "pr": ["ply", "ply rating"],
        "lt": ["light truck"],
        "passenger": ["car", "vehicle", "pcr"],
        "truck": ["tbr", "commercial"],
        "scv": ["small commercial vehicle"],
        "otr": ["off the road", "off-road"],
        "agriculture": ["agricultural", "tractor", "farm"],
        "earthmover": ["earth mover", "mining"],
        "apollo": ["apollo tyres"],
        "ceat": ["ceat tyres"],
        "mrf": ["mrf tyres"], 
        "eurogrip": ["eurogrip tyres", "tvs"]
    }
    task_info = await index.update_synonyms(synonyms)
    await client.wait_for_task(task_info.task_uid, timeout_in_ms=30000)
    
    print("✅ Multi-brand tire index settings configured successfully")


async def index_products_batch(client: AsyncClient, products: List[Dict], batch_num: int, brand: str):
    """Index a batch of tire products"""
    print(f"📦 Indexing {brand} batch {batch_num} ({len(products)} products)...")
    
    index = client.index(PRODUCTS_INDEX)
    task_info = await index.add_documents(products)
    
    # Wait for indexing to complete
    await client.wait_for_task(task_info.task_uid, timeout_in_ms=60000)
    print(f"✅ {brand} batch {batch_num} indexed successfully")


async def main():
    """Main data loading function"""
    print("🚗 Starting multi-brand tire data loading process...")
    
    # Initialize Meilisearch client
    client = AsyncClient(url=MEILI_URL, api_key=MEILI_MASTER_KEY)
    
    try:
        # Test connection
        health = await client.health()
        print(f"🟢 Connected to Meilisearch: {health}")
        
        # Setup index settings first
        await setup_tire_index_settings(client)
        
        # Clear existing index to start fresh
        index = client.index(PRODUCTS_INDEX)
        try:
            task_info = await index.delete_all_documents()
            await client.wait_for_task(task_info.task_uid, timeout_in_ms=30000)
            print("🧹 Cleared existing index data")
        except Exception as e:
            print(f"⚠️  Could not clear index: {e}")
        
        # Process each brand
        total_products = 0
        brand_stats = {}
        
        for brand, config in DATA_FILES.items():
            print(f"\n🏭 Processing {brand} data...")
            
            # Parse the data file
            products = parse_brand_data(brand, config["file"], config["columns"])
            
            if not products:
                print(f"❌ No valid products found for {brand}")
                brand_stats[brand] = 0
                continue
            
            # Index products in batches
            total_batches = (len(products) + BATCH_SIZE - 1) // BATCH_SIZE
            
            for batch_start in range(0, len(products), BATCH_SIZE):
                batch_end = min(batch_start + BATCH_SIZE, len(products))
                batch_num = (batch_start // BATCH_SIZE) + 1
                
                batch_products = products[batch_start:batch_end]
                await index_products_batch(client, batch_products, batch_num, brand)
            
            total_products += len(products)
            brand_stats[brand] = len(products)
            print(f"✅ {brand}: {len(products)} products indexed")
        
        # Get final stats
        stats = await index.get_stats()
        
        print(f"\n🎉 Multi-brand tire data loading completed successfully!")
        print(f"📈 Total documents indexed: {stats.number_of_documents}")
        print(f"📊 Brand breakdown:")
        for brand, count in brand_stats.items():
            print(f"   - {brand}: {count} products")
        
        print(f"📋 Field distribution: {dict(list(stats.field_distribution.items())[:5])}...")
        
        # Show some sample searches
        print(f"\n🔍 Sample searches you can try:")
        print(f"  - Search by brand: curl 'http://localhost:8000/search?q=apollo'")
        print(f"  - Search by size: curl 'http://localhost:8000/search?q=155/80'")
        print(f"  - Search by pattern: curl 'http://localhost:8000/search?q=LOADSTAR'")
        print(f"  - Filter by brand: curl 'http://localhost:8000/search?q=tire&filters=brand=CEAT'")
        print(f"  - Filter by group: curl 'http://localhost:8000/search?q=&filters=group=SCV'")
        print(f"  - Get all brands: curl 'http://localhost:8000/search/filters/brands'")
        
    except Exception as e:
        print(f"❌ Error during data loading: {e}")
        raise
    finally:
        await client.aclose()


if __name__ == "__main__":
    asyncio.run(main())
