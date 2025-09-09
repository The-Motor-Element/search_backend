# 🔍 Multi-Brand Tire Search Backend

A powerful tire search engine built with **FastAPI**, **MeiliSearch**, and **Docker** supporting multiple tire brands including Apollo, CEAT, MRF, and Eurogrip.

## ✨ Features

- 🚀 **Fast Search**: Powered by MeiliSearch for instant tire search results across all brands
- 🏭 **Multi-Brand Support**: Search across Apollo, CEAT, MRF, Eurogrip tire catalogs (4,600+ products)
- 📊 **Rich Filtering**: Search by size, brand, pattern, group, and vehicle compatibility  
- 🎯 **Typo Tolerance**: Find results even with misspellings
- 📈 **Real-time Suggestions**: Auto-complete and search-as-you-type
- 🔧 **RESTful API**: Clean, documented API endpoints
- 🖥️ **Web Interface**: Simple JavaScript-based search interface
- 🐳 **Docker Support**: Easy setup with Docker Compose
- ☁️ **AWS Free Tier**: Deploy to cloud for $0/month

## 🚀 Quick Start

### Local Development

### Local Development

**Step 1: Clone and Start Services**
```bash
git clone <your-repo-url>
cd search_backend
docker-compose up -d
```

**Step 2: Load Multi-Brand Tire Data**
```bash
# Wait for services to be healthy (about 30 seconds)
docker-compose exec api python scripts/load_all_tire_data.py
```

**Step 3: Access the Application**
- 🖥️ **Web Interface**: http://localhost:8080
- 📡 **API Documentation**: http://localhost:8001/docs
- 🔍 **MeiliSearch Dashboard**: http://localhost:7700

### AWS Free Tier Deployment ($0/month)

Deploy to AWS completely free using Free Tier resources:

```bash
# One-command deployment
./deploy-free-tier.sh -k your-keypair-name -i

# Test deployment
./test-free-tier.sh http://YOUR-EC2-IP
```

See [FREE-TIER-README.md](FREE-TIER-README.md) for complete AWS deployment guide.

### Cloud Sharing with Cloudflare Tunnels

Share your local development with your team instantly:

```bash
# Quick temporary sharing
./quick-share.sh
```

See [CLOUDFLARED.md](CLOUDFLARED.md) for team sharing setup.

## 🔧 Development Commands

### Docker Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild containers
docker-compose build

# Load data
docker-compose exec api python scripts/load_all_tire_data.py
```

### Testing the API
```bash
# Health check
curl http://localhost:8001/health

# Search across all brands
curl "http://localhost:8001/search?q=175/70R13&limit=5"

# Filter by specific brand
curl "http://localhost:8001/search?q=tire&filters=brand=CEAT&limit=5"

# Get all available brands
curl "http://localhost:8001/search/filters/brands"

# Get statistics
curl http://localhost:8001/analytics/stats
```

## 📊 Multi-Brand Tire Database

The application includes comprehensive tire data:

| Brand | Products | Categories | Examples |
|-------|----------|------------|----------|
| **Apollo** | 1,557 | SCV, Passenger Car, HCV, Two Wheeler | Alnac 4G, Apterra, Acti series |
| **CEAT** | 1,139 | Farm, Industrial, BHL, Passenger | Grader, Czar series |  
| **MRF** | 1,785 | Car Radial, Rally, Farm, Two Wheeler | ZV2K, Wanderer series |
| **Eurogrip** | 118 | Agriculture, Forklift, Industrial | TVS brand products |
| **Total** | **4,600+** | All vehicle types | Complete tire catalog |

### Features by Brand
- Size specifications (155/80 R13, 175/70R13, etc.)
- Ply ratings and load indices
- Pattern names and categories
- Brand-specific vehicle compatibility

## 🔍 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/search` | GET | Search tires across all brands with filters and sorting |
| `/search/filters/brands` | GET | Get all available tire brands |
| `/search/filters/groups` | GET | Get all product groups |
| `/search/filters/record-types` | GET | Get all record types |
| `/search/facets` | GET | Faceted search with brand/group distributions |
| `/analytics/stats` | GET | Multi-brand database and index statistics |
| `/health` | GET | Health check for all services |
| `/docs` | GET | Interactive API documentation |

### Search Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (works across all brands) |
| `limit` | int | Number of results (default: 10) |
| `offset` | int | Pagination offset (default: 0) |
| `filters` | string | Facet filters (e.g., `brand=Apollo`, `group=SCV`) |
| `sort` | string | Sort field and order |

## 🧪 Testing

### Run Tests
```bash
# Run all tests
pytest tests/ -v

# Test with coverage
pytest --cov=app --cov-report=html tests/

# Test specific endpoints
pytest tests/test_endpoints.py -v
```

## 📁 Project Structure

```
search_backend/
├── app/
│   ├── main.py              # FastAPI application
│   └── schemas.py           # Pydantic models
├── scripts/
│   └── load_all_tire_data.py     # Multi-brand data loader
├── data/
│   ├── Apollo-parsed.tsv         # Apollo tire data
│   ├── CEAT-parsed.tsv          # CEAT tire data  
│   ├── MRF-Parsed.tsv           # MRF tire data
│   └── Eurogrip.tsv             # Eurogrip tire data
├── test_ui/
│   ├── index.html            # Web interface
│   ├── modules/             # JavaScript modules
│   └── server.py            # Python web server
├── tests/
│   └── test_endpoints.py    # API tests
├── docker-compose.yml       # Docker services
├── deploy-free-tier.sh     # AWS Free Tier deployment
├── cloudformation-free-tier.yml  # AWS template
├── FREE-TIER-README.md     # AWS deployment guide
└── requirements.txt        # Python dependencies
```

## ☁️ Deployment Options

### 1. AWS Free Tier ($0/month)
Perfect for development and testing:
```bash
./deploy-free-tier.sh -k your-keypair -i
```

### 2. Local Development
For coding and testing:
```bash
docker-compose up -d
```

### 3. Team Sharing
Share with team via Cloudflare Tunnels:
```bash
./quick-share.sh
```

## 🐛 Troubleshooting

### Common Issues

**Services Not Starting**
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs meilisearch
docker-compose logs api

# Restart services
docker-compose restart
```

**Data Not Loading**
```bash
# Reload data
docker-compose exec api python scripts/load_all_tire_data.py

# Check data indexed
curl "http://localhost:8001/search?q=&limit=1"
```

**API Not Responding**
```bash
# Check API health
curl http://localhost:8001/health

# Rebuild containers
docker-compose build
docker-compose up -d
```

## 🚀 Getting Started Checklist

- [ ] Install Docker and Docker Compose
- [ ] Clone the repository
- [ ] Run `docker-compose up -d`
- [ ] Load data: `docker-compose exec api python scripts/load_all_tire_data.py`
- [ ] Test UI: Visit http://localhost:8080
- [ ] Test API: Visit http://localhost:8001/docs
- [ ] **For AWS**: Run `./deploy-free-tier.sh -k your-keypair -i`
- [ ] **For sharing**: Run `./quick-share.sh`

## 🌐 Production Deployment

For production use, consider:
- Using managed databases (AWS RDS, etc.)
- Setting up SSL/TLS certificates
- Implementing proper authentication
- Setting up monitoring and logging
- Using container orchestration (EKS, ECS)

## 📚 API Documentation

Once running, visit:
- **Interactive docs**: http://localhost:8001/docs
- **Alternative docs**: http://localhost:8001/redoc

Key endpoints:
- `GET /search` - Search tires across all brands
- `GET /search/filters/brands` - Get available brands
- `GET /analytics/stats` - Database statistics
- `GET /health` - Health check

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `pytest tests/ -v`
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

🎉 **Ready to search 4,600+ tire products across 4 major brands!**
