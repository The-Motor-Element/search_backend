#!/usr/bin/env python3
"""
Verify that data loading was successful
Checks if the products index exists and has documents
"""

import asyncio
import os
import sys
from meilisearch_python_sdk import AsyncClient

# Configuration
MEILI_URL = os.getenv("MEILI_URL", "http://localhost:7700")
MEILI_MASTER_KEY = os.getenv("MEILI_MASTER_KEY", "development_key_please_change_in_production")
PRODUCTS_INDEX = os.getenv("PRODUCTS_INDEX", "products")


async def verify_data_loading():
    """Verify that data was loaded successfully"""
    
    client = AsyncClient(url=MEILI_URL, api_key=MEILI_MASTER_KEY)
    
    try:
        # Check if index exists and has documents
        index = client.index(PRODUCTS_INDEX)
        stats = await index.get_stats()
        
        print(f"✅ Index '{PRODUCTS_INDEX}' exists")
        print(f"📊 Documents: {stats.number_of_documents}")
        print(f"🔄 Is indexing: {stats.is_indexing}")
        
        if stats.number_of_documents > 0:
            print("✅ Data loading verification successful!")
            
            # Try a sample search
            try:
                results = await index.search("LOADSTAR", limit=1)
                if results.hits:
                    print(f"✅ Sample search successful: Found '{results.hits[0].get('material', 'N/A')}'")
                else:
                    print("⚠️  Sample search returned no results (may be OK if data doesn't contain 'LOADSTAR')")
            except Exception as e:
                print(f"⚠️  Sample search failed: {e}")
            
            return True
        else:
            print("❌ No documents found in index")
            return False
            
    except Exception as e:
        print(f"❌ Error verifying data loading: {e}")
        return False
    finally:
        await client.aclose()


if __name__ == "__main__":
    result = asyncio.run(verify_data_loading())
    sys.exit(0 if result else 1)
