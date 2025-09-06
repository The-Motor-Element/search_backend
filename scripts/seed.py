#!/usr/bin/env python3
"""
Seed script for E-commerce Search Backend
Generates sample product data and indexes it in Meilisearch
Demonstrates bulk indexing with chunking
"""

import asyncio
import os
import sys
import json
import random
from typing import List
from datetime import datetime, timedelta

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from meilisearch_python_sdk import AsyncClient

load_dotenv()

# Configuration
MEILI_URL = os.getenv("MEILI_URL", "http://localhost:7700")
MEILI_MASTER_KEY = os.getenv("MEILI_MASTER_KEY", "development_key_please_change_in_production")
PRODUCTS_INDEX = os.getenv("PRODUCTS_INDEX", "products")
BATCH_SIZE = 100  # Process products in batches
TOTAL_PRODUCTS = 500


# Sample data for realistic product generation
CATEGORIES = [
    "electronics", "clothing", "books", "home-garden", "sports",
    "toys", "automotive", "health-beauty", "jewelry", "food"
]

ELECTRONICS_BRANDS = ["Apple", "Samsung", "Sony", "LG", "HP", "Dell", "Canon", "Nikon"]
CLOTHING_BRANDS = ["Nike", "Adidas", "Zara", "H&M", "Uniqlo", "Gap", "Levi's"]
BOOK_PUBLISHERS = ["Penguin", "HarperCollins", "Random House", "Simon & Schuster"]

PRODUCT_TEMPLATES = {
    "electronics": [
        "Wireless Bluetooth Headphones",
        "4K Smart TV",
        "Gaming Laptop",
        "Smartphone",
        "Digital Camera",
        "Wireless Mouse",
        "Mechanical Keyboard",
        "Portable Speaker",
        "Smartwatch",
        "Tablet"
    ],
    "clothing": [
        "Cotton T-Shirt",
        "Denim Jeans",
        "Running Shoes",
        "Winter Jacket",
        "Casual Dress",
        "Polo Shirt",
        "Sneakers",
        "Hoodie",
        "Formal Pants",
        "Summer Shorts"
    ],
    "books": [
        "Programming Guide",
        "Mystery Novel",
        "Cookbook",
        "Biography",
        "Science Fiction",
        "Self-Help Book",
        "History Book",
        "Poetry Collection",
        "Technical Manual",
        "Children's Book"
    ],
    "home-garden": [
        "Coffee Maker",
        "Garden Tools Set",
        "Throw Pillow",
        "LED Light Bulbs",
        "Plant Pot",
        "Kitchen Knife Set",
        "Bathroom Towels",
        "Vacuum Cleaner",
        "Air Purifier",
        "Bedding Set"
    ]
}

ADJECTIVES = [
    "Premium", "Deluxe", "Professional", "Compact", "Wireless", "Smart",
    "Eco-Friendly", "Portable", "Heavy-Duty", "Ultra-Thin", "High-Performance"
]


def generate_product(product_id: int) -> dict:
    """
    Generate a realistic sample product
    """
    category = random.choice(CATEGORIES)
    
    # Select appropriate brand based on category
    if category == "electronics":
        brand = random.choice(ELECTRONICS_BRANDS)
    elif category == "clothing":
        brand = random.choice(CLOTHING_BRANDS)
    elif category == "books":
        brand = random.choice(BOOK_PUBLISHERS)
    else:
        brand = f"Brand{random.randint(1, 20)}"
    
    # Generate title
    if category in PRODUCT_TEMPLATES:
        base_title = random.choice(PRODUCT_TEMPLATES[category])
        title = f"{random.choice(ADJECTIVES)} {base_title}"
    else:
        title = f"{random.choice(ADJECTIVES)} {category.title()} Item"
    
    # Generate price based on category
    price_ranges = {
        "electronics": (50, 2000),
        "clothing": (15, 200),
        "books": (10, 50),
        "home-garden": (20, 500),
        "sports": (25, 300),
        "toys": (10, 150),
        "automotive": (30, 1000),
        "health-beauty": (15, 100),
        "jewelry": (50, 5000),
        "food": (5, 100)
    }
    
    min_price, max_price = price_ranges.get(category, (20, 200))
    price = round(random.uniform(min_price, max_price), 2)
    
    # Generate other attributes
    rating = round(random.uniform(3.0, 5.0), 1)
    review_count = random.randint(0, 1000)
    stock_quantity = random.randint(0, 100)
    in_stock = stock_quantity > 0
    
    # Generate creation date (within last 2 years)
    created_at = datetime.now() - timedelta(days=random.randint(0, 730))
    updated_at = created_at + timedelta(days=random.randint(0, 30))
    
    # Generate tags
    all_tags = [
        "new", "bestseller", "sale", "trending", "premium", "eco-friendly",
        "fast-shipping", "limited-edition", "handmade", "imported"
    ]
    tags = random.sample(all_tags, random.randint(1, 4))
    
    return {
        "id": f"prod_{product_id:06d}",
        "title": title,
        "description": f"High-quality {title.lower()} from {brand}. Perfect for everyday use with excellent durability and performance.",
        "category": category,
        "brand": brand,
        "price": price,
        "currency": "USD",
        "in_stock": in_stock,
        "stock_quantity": stock_quantity,
        "rating": rating,
        "review_count": review_count,
        "tags": tags,
        "sku": f"{brand[:2].upper()}-{category[:3].upper()}-{product_id:03d}",
        "weight": round(random.uniform(0.1, 5.0), 2),
        "dimensions": {
            "length": round(random.uniform(5, 50), 1),
            "width": round(random.uniform(5, 40), 1),
            "height": round(random.uniform(2, 30), 1)
        },
        "images": [f"https://example.com/products/{product_id}.jpg"],
        "created_at": created_at.isoformat(),
        "updated_at": updated_at.isoformat()
    }


async def setup_index_settings(client: AsyncClient):
    """
    Configure optimal settings for e-commerce search
    """
    print("🔧 Setting up index configuration...")
    
    index = client.index(PRODUCTS_INDEX)
    
    settings = {
        "searchableAttributes": [
            "title",
            "description",
            "brand",
            "category",
            "tags"
        ],
        "filterableAttributes": [
            "category",
            "brand",
            "price",
            "in_stock",
            "rating",
            "tags"
        ],
        "sortableAttributes": [
            "price",
            "rating",
            "created_at",
            "title"
        ],
        "rankingRules": [
            "words",
            "typo", 
            "proximity",
            "attribute",
            "sort",
            "exactness"
        ],
        "stopWords": ["the", "a", "an", "and", "or", "but", "in", "on", "at"],
        "synonyms": {
            "phone": ["mobile", "smartphone", "cell phone", "cellphone"],
            "laptop": ["notebook", "computer", "pc"],
            "tv": ["television", "monitor", "display"],
            "shoes": ["footwear", "sneakers", "boots"],
            "shirt": ["top", "blouse", "tee"]
        }
    }
    
    # Update settings individually for better compatibility
    if "searchableAttributes" in settings:
        task_info = await index.update_searchable_attributes(settings["searchableAttributes"])
        await client.wait_for_task(task_info.task_uid, timeout_in_ms=30000)
    
    if "filterableAttributes" in settings:
        task_info = await index.update_filterable_attributes(settings["filterableAttributes"])
        await client.wait_for_task(task_info.task_uid, timeout_in_ms=30000)
    
    if "sortableAttributes" in settings:
        task_info = await index.update_sortable_attributes(settings["sortableAttributes"])
        await client.wait_for_task(task_info.task_uid, timeout_in_ms=30000)
    
    if "rankingRules" in settings:
        task_info = await index.update_ranking_rules(settings["rankingRules"])
        await client.wait_for_task(task_info.task_uid, timeout_in_ms=30000)
    
    if "stopWords" in settings:
        task_info = await index.update_stop_words(settings["stopWords"])
        await client.wait_for_task(task_info.task_uid, timeout_in_ms=30000)
    
    if "synonyms" in settings:
        task_info = await index.update_synonyms(settings["synonyms"])
        await client.wait_for_task(task_info.task_uid, timeout_in_ms=30000)
    print("✅ Index settings configured successfully")


async def index_products_batch(client: AsyncClient, products: List[dict], batch_num: int):
    """
    Index a batch of products
    """
    print(f"📦 Indexing batch {batch_num} ({len(products)} products)...")
    
    index = client.index(PRODUCTS_INDEX)
    task_info = await index.add_documents(products)
    
    # Wait for indexing to complete
    await client.wait_for_task(task_info.task_uid, timeout_in_ms=30000)
    print(f"✅ Batch {batch_num} indexed successfully")


async def main():
    """
    Main seeding function
    """
    print("🌱 Starting product seeding process...")
    print(f"📊 Generating {TOTAL_PRODUCTS} products in batches of {BATCH_SIZE}")
    
    # Initialize Meilisearch client
    client = AsyncClient(url=MEILI_URL, api_key=MEILI_MASTER_KEY)
    
    try:
        # Test connection
        health = await client.health()
        print(f"🟢 Connected to Meilisearch: {health}")
        
        # Setup index settings
        await setup_index_settings(client)
        
        # Generate and index products in batches
        for batch_start in range(0, TOTAL_PRODUCTS, BATCH_SIZE):
            batch_end = min(batch_start + BATCH_SIZE, TOTAL_PRODUCTS)
            batch_num = (batch_start // BATCH_SIZE) + 1
            
            # Generate products for this batch
            products = []
            for i in range(batch_start, batch_end):
                product = generate_product(i + 1)
                products.append(product)
            
            # Index the batch
            await index_products_batch(client, products, batch_num)
        
        # Get final stats
        index = client.index(PRODUCTS_INDEX)
        stats = await index.get_stats()
        
        print(f"🎉 Seeding completed successfully!")
        print(f"📈 Total documents indexed: {stats.number_of_documents}")
        
        # Try to get index size if available
        try:
            if hasattr(stats, 'database_size'):
                print(f"💾 Index size: {stats.database_size} bytes")
            elif hasattr(stats, 'size'):
                print(f"💾 Index size: {stats.size} bytes")
            else:
                print(f"💾 Index stats: {stats}")
        except Exception as e:
            print(f"💾 Could not get index size: {e}")
        
        # Add a unique product for testing
        unique_product = {
            "id": "test_unique_product",
            "title": "Super Unique Test Product XYZ123",
            "description": "This is a unique product for testing search functionality",
            "category": "test",
            "brand": "TestBrand",
            "price": 99.99,
            "currency": "USD",
            "in_stock": True,
            "stock_quantity": 1,
            "rating": 5.0,
            "review_count": 1,
            "tags": ["test", "unique"],
            "sku": "TEST-001",
            "weight": 1.0,
            "dimensions": {"length": 10, "width": 10, "height": 10},
            "images": ["https://example.com/test.jpg"],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        task_info = await index.add_documents([unique_product])
        await client.wait_for_task(task_info.task_uid, timeout_in_ms=10000)
        print("🧪 Test product added for testing")
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        raise
    finally:
        await client.aclose()


if __name__ == "__main__":
    asyncio.run(main())
