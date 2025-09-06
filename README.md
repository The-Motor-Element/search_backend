# Apollo Tire Search Backend

**🚀 Production-ready search microservice with advanced Meilisearch features**

Built with [Meilisearch](https://www.meilisearch.com/) and [FastAPI](https://fastapi.tiangolo.com/) specifically for Apollo tire catalog data with comprehensive search capabilities including faceted search, intelligent filtering, autocomplete, and analytics.

## ✨ Key Highlights

- 🔍 **1,557 Apollo Tire Products** - Fully indexed and searchable
- ⚡ **Sub-millisecond Search** - Optimized Meilisearch performance  
- 🎯 **Tire-Specific Features** - Ply ratings, sizes, patterns, groups
- 📊 **Faceted Search & Analytics** - Real-time facet distributions
- 💡 **Intelligent Autocomplete** - Context-aware suggestions
- 🔗 **Similar Products** - AI-powered recommendations
- ✨ **Advanced Filtering** - Boolean AND/OR/NOT with sorting
- 📈 **Browse Mode & Analytics** - Category exploration and statistics

## Features

- **Apollo Tire Data Indexing**: Specialized for Apollo tire catalog with TSV data import
- **Advanced Tire Search**: Full-text search with tire-specific filters and attributes
- **Automotive Filters**: Search by size, ply rating, pattern, load index, speed rating
- **Production Ready**: Environment-based configuration, comprehensive logging, and health checks
- **Type Safety**: Full Pydantic models and type hints throughout
- **Async Performance**: Built on async/await for high concurrency

## Quick Start

### Option 1: Docker Deployment (Recommended)

The fastest way to get the complete application running:

```bash
# Clone and navigate to the repository
git clone <repository-url>
cd search_backend

# Deploy with Docker (includes UI + API + Meilisearch)
chmod +x deploy.sh
./deploy.sh

# Wait for services to start, then load data
docker-compose exec api python scripts/docker_load_data.py

# Open the search interface
open http://localhost:8080
```

**Service URLs:**
- 🔍 **Search UI**: http://localhost:8080
- 🔌 **API Documentation**: http://localhost:8001/docs  
- 📊 **Meilisearch**: http://localhost:7700

### Option 2: Local Development

### Prerequisites

- Docker and Docker Compose
- Python 3.8+

### 1. Start Services

```bash
# Clone and navigate to project
git clone <repository-url>
cd search_backend

# Start Meilisearch with Docker Compose
docker-compose up -d

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create a `.env` file:

```bash
MEILI_URL=http://localhost:7700
MEILI_MASTER_KEY=development_key_please_change_in_production
PRODUCTS_INDEX=products
```

### 3. Start the API Server

```bash
uvicorn app.main:app --reload --port 8001
```

**Note**: Using port 8001 to avoid conflicts with other services that may be using port 8000.

### 4. Load Apollo Tire Data

```bash
python scripts/load_apollo_data.py
```

### 5. Test the API

Visit [http://localhost:8001/docs](http://localhost:8001/docs) for the interactive API documentation.

## API Endpoints

### Health Check
```bash
curl http://localhost:8001/health
```

### Index Apollo Tire Products
```bash
curl -X POST "http://localhost:8000/index/products" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "id": "RTH1YDLXP1A01",
      "group": "SCV",
      "material": "155/80 D12 8PR LOADSTAR SUPER XP - D",
      "record_type": "Tyre",
      "mpn": "RTH1YDLXP1A01",
      "size": "155/80 D12",
      "ply_rating": "8PR",
      "pattern_model": "LOADSTAR SUPER XP",
      "brand": "Apollo",
      "category": "SCV Tyres"
    }
  ]'
```

### Configure Tire Search Settings
```bash
curl -X POST "http://localhost:8000/index/settings" \
  -H "Content-Type: application/json" \
  -d '{
    "searchable_attributes": ["title", "material", "pattern_model", "mpn", "size"],
    "filterable_attributes": ["group", "record_type", "ply_rating", "load_index", "speed_rating"],
    "sortable_attributes": ["size", "load_index", "speed_rating"]
  }'
```

## ✨ Advanced Features

This Apollo tire search backend implements comprehensive Meilisearch features:

### 🔍 Faceted Search & Analytics
```bash
# Get search results with facet distribution for building filter UIs
curl "http://localhost:8001/search/facets?q=LOADSTAR&facets=group,ply_rating,record_type&limit=5"
```

### 🎯 Advanced Filtering
```bash
# Boolean AND/OR filtering with sorting
curl "http://localhost:8001/search?q=155&filters=group%20%3D%20%27SCV%27%20AND%20record_type%20%3D%20%27Tyre%27&sort=size:asc"

# Complex OR filtering
curl "http://localhost:8001/search?q=&filters=ply_rating%20%3D%20%278PR%27%20OR%20ply_rating%20%3D%20%276PR%27&sort=ply_rating:asc"
```

### ✨ Search Highlighting & Cropping
```bash
# Highlight search terms in results
curl "http://localhost:8001/search?q=SUPER&highlight=true&attributes_to_highlight=material,pattern_model"

# Custom text cropping and attribute selection
curl "http://localhost:8001/search?q=ENDUMAXX&attributes_to_retrieve=id,material,size&attributes_to_crop=material&crop_length=50"
```

### 💡 Autocomplete & Suggestions
```bash
# Get intelligent search suggestions
curl "http://localhost:8001/search/suggestions?q=load&limit=5"
```

### 🔗 Similar Products Recommendation
```bash
# Find similar products based on group, ply rating, and pattern
curl "http://localhost:8001/search/similar/RTH1YDLXP1A01?limit=5"
```

### 📊 Filter Options for UI Components
```bash
# Get available filter values with counts
curl "http://localhost:8001/search/filters/groups"
curl "http://localhost:8001/search/filters/record-types" 
curl "http://localhost:8001/search/filters/ply-ratings"
```

### 📈 Analytics & Statistics
```bash
# Get comprehensive index analytics
curl "http://localhost:8001/analytics/stats"
```

### 🌐 Browse Mode (Facets Only)
```bash
# Get facet distributions without search results
curl "http://localhost:8001/search/facets?q=&facets=group,record_type&limit=0"
```

## 🚀 Quick Demo

### Interactive Test UI
Experience all features through our comprehensive web interface:
```bash
cd test_ui
python server.py
# Visit http://localhost:8080 in your browser
```

### Command Line Testing
Run the comprehensive feature demonstration:
```bash
python scripts/demo_advanced_features.py
```

Or test all advanced features:
```bash
python scripts/test_advanced_features.py
```

## Apollo Tire Search Configuration

### Searchable Attributes Priority

Configure which fields to search and their importance for tire products:

```json
[
  "title",        // Computed title (most important)
  "material",     // Full material description
  "pattern_model", // Tire pattern/model name
  "mpn",          // Manufacturer part number
  "size",         // Tire size
  "group",        // Product group
  "tags"          // Extracted search tags
]
```

### Filterable Attributes

Enable filtering on key tire attributes:

```json
[
  "group",            // Product group (SCV, etc.)
  "record_type",      // Type (Tyre, Flaps, etc.)
  "brand",            // Brand (Apollo)
  "ply_rating",       // Ply rating (8PR, 6PR, etc.)
  "construction_type", // Construction type
  "load_index",       // Load index rating
  "speed_rating",     // Speed rating (Q, R, S, etc.)
  "series",           // Tire series
  "special_features", // Special features/codes
  "category"          // Computed category
]
```

### Tire-Specific Synonyms

Improve search with tire industry terminology:

```json
{
  "tire": ["tyre", "wheel"],
  "radial": ["rad", "r"], 
  "bias": ["diagonal", "d"],
  "tube": ["inner tube", "flap"],
  "pr": ["ply", "ply rating"],
  "lt": ["light truck"]
}
```

## Tire Filter Examples

Meilisearch supports powerful filter expressions for tire search:

```bash
# Filter by product group
filters=group=SCV

# Filter by tire type and ply rating
filters=record_type=Tyre AND ply_rating=8PR

# Filter by load index range
filters=load_index >= 80 AND load_index <= 100

# Complex tire search
filters=(group=SCV OR group=LCV) AND record_type=Tyre AND ply_rating=8PR

# Filter by speed rating
filters=speed_rating=Q OR speed_rating=R
```

For more filter syntax, see [Meilisearch Filter Documentation](https://docs.meilisearch.com/reference/features/filtering.html).

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
pytest tests/ -v

# Run specific test
pytest tests/test_endpoints.py::TestSearchEndpoint::test_search_basic_query -v
```

### Project Structure

```
search_backend/
├── app/
│   ├── main.py          # FastAPI application
│   └── schemas.py       # Pydantic models
├── scripts/
│   └── seed.py          # Data seeding script
├── tests/
│   └── test_endpoints.py # API tests
├── docker-compose.yml   # Meilisearch service
├── requirements.txt     # Dependencies
└── README.md           # Documentation
```

## Production Considerations

### Security

1. **Change Default Master Key**: Set a secure `MEILI_MASTER_KEY` in production
2. **Use HTTPS**: Deploy behind a reverse proxy with TLS termination
3. **API Authentication**: Add authentication middleware for production use
4. **Network Security**: Restrict Meilisearch access to application servers only

### Performance Tuning

1. **Batch Size**: Adjust indexing batch size based on document size and server resources
2. **Ranking Rules**: Customize ranking rules for your specific use case
3. **Resource Allocation**: Monitor Meilisearch memory usage and adjust container limits
4. **Caching**: Consider adding Redis for frequently accessed data

### Monitoring

1. **Health Checks**: Use `/health` endpoint for load balancer health checks
2. **Logging**: Application logs include structured logging for observability
3. **Metrics**: Monitor Meilisearch performance metrics
4. **Alerting**: Set up alerts for indexing failures and search errors

### Docker Deployment (Production)

For production deployment with Docker:

```bash
# Quick deployment with script
./deploy.sh

# Manual deployment
docker-compose up -d

# Load Apollo tire data
docker-compose exec api python scripts/docker_load_data.py

# Check service health
docker-compose ps
```

**Docker Services:**
- **Meilisearch**: http://localhost:7700 (search engine)
- **API Server**: http://localhost:8001 (FastAPI backend)  
- **UI Server**: http://localhost:8080 (web interface)

**Management Commands:**
```bash
# View logs
docker-compose logs -f

# Restart services  
docker-compose restart

# Stop services
docker-compose down

# Update after code changes
docker-compose build && docker-compose up -d
```

See [DOCKER.md](./DOCKER.md) for comprehensive Docker deployment documentation.

### Local Development

```bash
# Environment variables
MEILI_URL=http://localhost:7700
MEILI_MASTER_KEY=your-secure-master-key
MEILI_ENV=development

# Start Meilisearch only
docker-compose up -d meilisearch

# Run API locally
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# Run UI locally  
cd test_ui && python server.py
```

## Frontend Integration

### JavaScript Example

Add instant search to your storefront:

```javascript
// Simple search integration
const searchProducts = async (query) => {
  const response = await fetch(`/search?q=${encodeURIComponent(query)}&limit=10`);
  const data = await response.json();
  return data.hits;
};

// Usage in your frontend
searchProducts('wireless headphones').then(products => {
  // Render products in your UI
  console.log('Found products:', products);
});
```

## References

- [Meilisearch Documentation](https://docs.meilisearch.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Meilisearch Python SDK](https://github.com/meilisearch/meilisearch-python-sdk)
- [Search Ranking Best Practices](https://docs.meilisearch.com/learn/core_concepts/relevancy.html)

## License

MIT License - see LICENSE file for details.
