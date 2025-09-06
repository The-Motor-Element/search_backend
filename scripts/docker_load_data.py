#!/usr/bin/env python3
"""
Docker-compatible Apollo data loader
Loads Apollo tire data into Meilisearch in a containerized environment
"""

import os
import sys
import asyncio
import logging
from pathlib import Path

# Add app directory to Python path
sys.path.insert(0, '/app')

from scripts.load_apollo_data import main as load_data

async def docker_load_data():
    """Load data in Docker environment with proper error handling"""
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    logger = logging.getLogger(__name__)
    
    logger.info("🐳 Starting Apollo data load in Docker container...")
    
    # Check if data file exists
    data_file = Path('/app/data/apollo-parsed.tsv')
    if not data_file.exists():
        logger.error(f"❌ Data file not found: {data_file}")
        logger.error("💡 Make sure the data directory is properly mounted")
        sys.exit(1)
    
    # Check Meilisearch connection
    meili_url = os.getenv("MEILI_URL", "http://meilisearch:7700")
    logger.info(f"🔗 Connecting to Meilisearch at: {meili_url}")
    
    try:
        # Run the data loading
        await load_data()
        logger.info("✅ Apollo data loaded successfully!")
        
    except Exception as e:
        logger.error(f"❌ Failed to load data: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(docker_load_data())
