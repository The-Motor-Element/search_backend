# 🔍 Apollo Tire Search Backend - Local Development

A powerful tire search engine built with **FastAPI**, **MeiliSearch**, and **React** for local development and testing.

## ✨ Features

- 🚀 **Fast Search**: Powered by MeiliSearch for instant tire search results
- 📊 **Rich Filtering**: Search by size, brand, pattern, and vehicle compatibility  
- 🎯 **Typo Tolerance**: Find results even with misspellings
- 📈 **Real-time Suggestions**: Auto-complete and search-as-you-type
- 🔧 **RESTful API**: Clean, documented API endpoints
- 🖥️ **Web Interface**: Simple React-based search interface
- 🐳 **Docker Support**: Easy setup with Docker Compose

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Python 3.11+](https://www.python.org/downloads/) (for local API development)
- [Git](https://git-scm.com/downloads)

### Option 1: Docker Compose (Recommended)

**Step 1: Clone and Start Services**
```bash
git clone <your-repo-url>
cd search_backend
docker-compose up -d
```

**Step 2: Load Apollo Tire Data**
```bash
# Wait for services to be healthy (about 30 seconds)
docker-compose exec api python scripts/load_apollo_data.py
```

**Step 3: Access the Application**
- 🖥️ **Web Interface**: http://localhost:8080
- 📡 **API Documentation**: http://localhost:8001/docs
- 🔍 **MeiliSearch Dashboard**: http://localhost:7700

### Option 2: Local API Development

For API development without Docker:

**Step 1: Install Dependencies**
```bash
pip install -r requirements.txt
```

**Step 2: Start MeiliSearch**
```bash
docker run -d -p 7700:7700 getmeili/meilisearch:latest
```

**Step 3: Run API Server**
```bash
# Set environment variables
export MEILI_URL=http://localhost:7700
export MEILI_MASTER_KEY=development_key_please_change_in_production

# Start the API
uvicorn app.main:app --reload --port 8000
```

**Step 4: Load Data**
```bash
python scripts/load_apollo_data.py
```

**Step 5: Access the API**
- 📡 **API Documentation**: http://localhost:8000/docs
- 🏥 **Health Check**: http://localhost:8000/health

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

# Execute commands in API container
docker-compose exec api python scripts/load_apollo_data.py
```

### API Commands
```bash
# Start API in development mode
uvicorn app.main:app --reload --port 8000

# Load Apollo tire data
python scripts/load_apollo_data.py

# Run tests
pytest tests/ -v

# Run tests with coverage
pytest --cov=app tests/
```

### Testing the API
```bash
# Health check
curl http://localhost:8001/health

# Search for Apollo tires
curl "http://localhost:8001/search?q=apollo&limit=5"

# Filter by tire size
curl "http://localhost:8001/search?q=155/80&limit=10"

# Browse by category
curl "http://localhost:8001/search?filters=category=passenger"

# Get statistics
curl http://localhost:8001/stats
```

## 📊 Sample Data

The application includes Apollo tire data with:
- **1,557+ tire products**
- Size specifications (155/80 R13, etc.)
- Ply ratings and load indices
- Pattern names and categories
- Brand and vehicle compatibility

## 🔍 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/search` | GET | Search tires with filters and sorting |
| `/health` | GET | Health check for all services |
| `/stats` | GET | Database and index statistics |
| `/docs` | GET | Interactive API documentation |

### Search Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query |
| `limit` | int | Number of results (default: 10) |
| `offset` | int | Pagination offset (default: 0) |
| `filters` | string | Facet filters (e.g., `category=passenger`) |
| `sort` | string | Sort field and order |

## 🧪 Testing

### Run All Tests
```bash
pytest tests/ -v
```

### Run Specific Tests
```bash
# Test endpoints only
pytest tests/test_endpoints.py -v

# Test with coverage report
pytest --cov=app --cov-report=html tests/

# Run simple health test
pytest tests/test_simple_health.py -v
```

### Test Configuration
Tests use the configuration in `pytest.ini`:
- API Base URL: `http://localhost:8001` (Docker) or `http://localhost:8000` (local)
- Environment variables from `.env` file

## 📁 Project Structure

```
search_backend/
├── app/
│   ├── main.py          # FastAPI application
│   └── schemas.py       # Pydantic models
├── scripts/
│   └── load_apollo_data.py    # Data loading script
├── data/
│   └── apollo-parsed.tsv      # Apollo tire sample data
├── test_ui/
│   ├── index.html            # Simple web interface
│   ├── script.js            # Frontend JavaScript
│   ├── styles.css           # CSS styles
│   └── server.py            # Simple Python web server
├── tests/
│   ├── test_endpoints.py    # API endpoint tests
│   ├── test_simple_health.py # Basic health tests
│   └── conftest.py          # Test configuration
├── docker-compose.yml       # Docker services configuration
├── Dockerfile.api          # API container definition
├── Dockerfile.ui           # UI container definition
├── requirements.txt        # Python dependencies
└── pytest.ini            # Test configuration
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file for local development:

```bash
# MeiliSearch Configuration
MEILI_MASTER_KEY=development_key_please_change_in_production
MEILI_ENV=development
MEILI_URL=http://localhost:7700

# API Configuration
API_BASE_URL=http://localhost:8001
PYTHONPATH=/app
```

### Docker Compose Services

| Service | Port | Description |
|---------|------|-------------|
| `meilisearch` | 7700 | Search engine and dashboard |
| `api` | 8001 | FastAPI backend |
| `ui` | 8080 | Simple React frontend |

## 🐛 Troubleshooting

### Common Issues

**1. Port Conflicts**
```bash
# Check what's using the ports
lsof -i :7700  # MeiliSearch
lsof -i :8001  # API
lsof -i :8080  # UI

# Kill processes if needed
sudo kill -9 $(lsof -t -i:7700)
```

**2. Services Not Starting**
```bash
# Check service status
docker-compose ps

# View service logs
docker-compose logs meilisearch
docker-compose logs api
docker-compose logs ui

# Restart all services
docker-compose restart
```

**3. Data Not Loading**
```bash
# Check MeiliSearch health
curl http://localhost:7700/health

# Reload Apollo data
docker-compose exec api python scripts/load_apollo_data.py

# Check if data is indexed
curl "http://localhost:8001/search?q=&limit=1"
```

**4. API Not Responding**
```bash
# Check API health
curl http://localhost:8001/health

# Check API logs
docker-compose logs api

# Rebuild API container
docker-compose build api
docker-compose up -d api
```

### Development Tips

- Use `docker-compose logs -f` to monitor all services in real-time
- The API automatically reloads when you change Python files (in Docker)
- MeiliSearch data persists in Docker volumes between restarts
- Check `/docs` endpoint for interactive API testing

## 🚀 Getting Started Checklist

- [ ] Clone the repository
- [ ] Install Docker and Docker Compose
- [ ] Run `docker-compose up -d`
- [ ] Wait for services to be healthy (~30 seconds)
- [ ] Load data: `docker-compose exec api python scripts/load_apollo_data.py`
- [ ] Test API: Visit http://localhost:8001/docs
- [ ] Test UI: Visit http://localhost:8080
- [ ] Run tests: `pytest tests/ -v`

## 📚 Learn More

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [MeiliSearch Documentation](https://docs.meilisearch.com/)
- [Docker Compose Guide](https://docs.docker.com/compose/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `pytest tests/ -v`
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
