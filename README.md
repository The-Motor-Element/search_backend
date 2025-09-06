# Apollo Tire Search Backend

A production-ready search microservice built with [Meilisearch](https://www.meilisearch.com/) and [FastAPI](https://fastapi.tiangolo.com/) specifically designed for Apollo tire catalog data. This service provides powerful tire search capabilities with filters, pagination, sorting, and automotive-specific configuration options.

## Features

- **Apollo Tire Data Indexing**: Specialized for Apollo tire catalog with TSV data import
- **Advanced Tire Search**: Full-text search with tire-specific filters and attributes
- **Automotive Filters**: Search by size, ply rating, pattern, load index, speed rating
- **Production Ready**: Environment-based configuration, comprehensive logging, and health checks
- **Type Safety**: Full Pydantic models and type hints throughout
- **Async Performance**: Built on async/await for high concurrency

## Quick Start

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

### Search Apollo Tires
```bash
# Search by pattern/brand
curl "http://localhost:8001/search/products?q=LOADSTAR"

# Search by tire size
curl "http://localhost:8001/search/products?q=155/80"

# Filter by group
curl "http://localhost:8001/search/products?group=Tyres"

# Filter by ply rating
curl "http://localhost:8001/search/products?ply_rating=8PR"
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

### Deployment

```bash
# Production environment variables
MEILI_URL=https://your-meilisearch-instance.com
MEILI_MASTER_KEY=your-secure-master-key
MEILI_ENV=production

# Docker deployment
docker build -t search-backend .
docker run -p 8000:8000 --env-file .env search-backend
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
