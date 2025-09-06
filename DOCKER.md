# Docker Deployment Guide

This guide explains how to deploy the Apollo Tire Search application using Docker and Docker Compose.

## Prerequisites

- Docker Desktop or Docker Engine
- Docker Compose
- At least 2GB of available RAM
- Ports 7700, 8001, and 8080 available

## Quick Start

### 1. Deploy with Script (Recommended)

```bash
# Make the script executable and run
chmod +x deploy.sh
./deploy.sh
```

### 2. Manual Deployment

```bash
# Build and start all services
docker-compose up -d

# Wait for services to be healthy
docker-compose ps

# Load Apollo tire data
docker-compose exec api python scripts/docker_load_data.py

# Open the application
open http://localhost:8080
```

## Architecture

The Docker deployment consists of three services:

### 1. Meilisearch (`meilisearch`)
- **Port:** 7700
- **Purpose:** Search engine and data storage
- **Health Check:** HTTP endpoint monitoring
- **Data:** Persistent volume for search indexes

### 2. API Server (`api`)
- **Port:** 8001
- **Purpose:** FastAPI backend with search endpoints
- **Dockerfile:** `Dockerfile.api`
- **Dependencies:** Meilisearch service
- **Features:** Advanced search, facets, analytics

### 3. UI Server (`ui`)
- **Port:** 8080
- **Purpose:** Interactive web interface
- **Dockerfile:** `Dockerfile.ui`
- **Dependencies:** API service
- **Features:** Modern search UI with tire-specific features

## Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Search UI | http://localhost:8080 | Interactive search interface |
| API Documentation | http://localhost:8001/docs | FastAPI Swagger docs |
| API Health | http://localhost:8001/health | API health check |
| Meilisearch | http://localhost:7700 | Search engine admin |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MEILI_MASTER_KEY` | `development_key_please_change_in_production` | Meilisearch API key |
| `MEILI_ENV` | `development` | Meilisearch environment |
| `MEILI_URL` | `http://meilisearch:7700` | Meilisearch URL (internal) |

## Data Loading

After the services are running, load the Apollo tire data:

```bash
# Load data into the containerized application
docker-compose exec api python scripts/docker_load_data.py
```

This will:
- Load 1,557 Apollo tire products
- Configure search indexes
- Set up faceted search capabilities
- Enable autocomplete and similar product features

## Management Commands

### Check Service Status
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f ui
docker-compose logs -f meilisearch
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart api
```

### Stop Services
```bash
# Stop all services (keeps data)
docker-compose down

# Stop and remove volumes (removes data)
docker-compose down -v
```

### Rebuild Services
```bash
# Rebuild after code changes
docker-compose build
docker-compose up -d
```

## Development Workflow

### 1. Code Changes
After making changes to the application code:

```bash
# Rebuild the affected service
docker-compose build api  # for backend changes
docker-compose build ui   # for UI changes

# Restart the service
docker-compose up -d
```

### 2. Database Reset
To reset the search data:

```bash
# Stop services and remove data
docker-compose down -v

# Start fresh
docker-compose up -d

# Reload data
docker-compose exec api python scripts/docker_load_data.py
```

### 3. Debugging
To debug issues:

```bash
# Enter the API container
docker-compose exec api bash

# Enter the UI container  
docker-compose exec ui bash

# Check Meilisearch directly
curl http://localhost:7700/health
```

## Production Considerations

### Security
1. **Change the Meilisearch master key:**
   ```bash
   export MEILI_MASTER_KEY="your_secure_production_key"
   ```

2. **Set production environment:**
   ```bash
   export MEILI_ENV="production"
   ```

### Performance
1. **Resource Allocation:**
   - Meilisearch: 1GB+ RAM recommended
   - API Server: 512MB RAM minimum
   - UI Server: 256MB RAM minimum

2. **Scaling:**
   ```bash
   # Scale API servers
   docker-compose up -d --scale api=3
   ```

### Monitoring
1. **Health Checks:** All services include health checks
2. **Logs:** Structured logging with timestamps
3. **Metrics:** Available via FastAPI metrics endpoints

## Troubleshooting

### Common Issues

1. **Port Conflicts:**
   ```bash
   # Check what's using the ports
   lsof -i :7700
   lsof -i :8001
   lsof -i :8080
   ```

2. **Service Won't Start:**
   ```bash
   # Check logs for errors
   docker-compose logs meilisearch
   docker-compose logs api
   docker-compose logs ui
   ```

3. **Data Loading Fails:**
   ```bash
   # Ensure Meilisearch is healthy first
   docker-compose ps
   
   # Check API connectivity
   docker-compose exec api curl http://meilisearch:7700/health
   ```

4. **UI Can't Connect to API:**
   - Verify all services are running: `docker-compose ps`
   - Check API health: `curl http://localhost:8001/health`
   - Check browser console for errors

### Performance Issues

1. **Slow Search Response:**
   - Check Meilisearch logs for indexing status
   - Verify sufficient RAM allocation
   - Monitor CPU usage: `docker stats`

2. **High Memory Usage:**
   - Restart services: `docker-compose restart`
   - Check for memory leaks in logs
   - Consider scaling down if over-provisioned

## Support

For issues with the Docker deployment:
1. Check service logs: `docker-compose logs -f`
2. Verify all services are healthy: `docker-compose ps`
3. Test individual components using the health check URLs
4. Review this documentation for common solutions
