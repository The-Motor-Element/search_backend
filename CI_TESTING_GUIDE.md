# CI/CD and Testing Guide

This document explains the CI/CD pipeline and testing setup for the Apollo Search Backend.

## GitHub Actions Workflow

The main workflow (`.github/workflows/deploy.yml`) includes:

1. **Test Job** - Runs on every push/PR
2. **Deploy Job** - Runs on main branch after successful tests

### Test Job Steps

1. **Setup Environment**
   - Checkout code
   - Setup Python 3.11
   - Cache dependencies
   - Install requirements

2. **Start Services**
   - Start Docker Compose services (Meilisearch + API)
   - Validate port configuration
   - Check service health

3. **Run Tests**
   - Execute pytest with proper API URL configuration
   - Show logs on failure
   - Cleanup containers

## Service Configuration

### Port Mappings
- **Meilisearch**: `7700:7700`
- **API Service**: `8001:8001` (Note: Different from local dev port 8000)
- **UI Service**: `8080:8080`

### Environment Variables
- `MEILI_MASTER_KEY`: Set to `test_key_for_ci` for testing
- `API_BASE_URL`: Set to `http://localhost:8001` for CI tests

## Health Checks

The workflow uses comprehensive health checks:

```bash
# Health check script
python scripts/test_health_checks.py
```

This script:
- Waits for Meilisearch to be available
- Checks API service health endpoint
- Validates Meilisearch version and index access
- Provides detailed error messages

## Running Tests Locally

### Method 1: Using Makefile

```bash
# Start services and run tests
make test-ci

# Just check health
make health

# Setup dev environment
make dev
```

### Method 2: Manual Steps

```bash
# 1. Start services
docker compose up -d  # or docker-compose up -d on older systems

# 2. Check health
python scripts/test_health_checks.py

# 3. Run tests with correct URL
API_BASE_URL=http://localhost:8001 pytest tests/ -v

# 4. Cleanup
docker compose down  # or docker-compose down
```

### Method 3: Local Development

```bash
# 1. Start only Meilisearch
docker compose up -d meilisearch  # or docker-compose up -d meilisearch

# 2. Start API locally
uvicorn app.main:app --reload --port 8000

# 3. Run tests (default port)
pytest tests/ -v
```

## Troubleshooting

### Common Issues

1. **Connection Refused Errors**
   - Services not started: `docker-compose up -d`
   - Wrong port: Check `API_BASE_URL` environment variable
   - Services not healthy: Run health check script

2. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :8000
   lsof -i :7700
   
   # Stop conflicting services
   docker compose down  # or docker-compose down
   ```

3. **Test Configuration Issues**
   - Ensure `API_BASE_URL` matches your setup
   - Check Docker Compose port mappings
   - Verify environment variables

### Debug Commands

```bash
# Check Docker status
docker compose ps  # or docker-compose ps
docker compose logs  # or docker-compose logs

# Test endpoints manually
curl http://localhost:7700/health
curl http://localhost:8001/health

# Validate port configuration
python scripts/validate_docker_ports.py
```

## CI Environment vs Local Development

| Environment | Meilisearch | API Service | Configuration |
|-------------|-------------|-------------|---------------|
| **CI** | localhost:7700 | localhost:8001 | Docker Compose |
| **Local Dev** | localhost:7700 | localhost:8000 | Mixed (Docker + Local) |
| **Production** | Internal | Load Balancer | Docker/K8s |

## Best Practices

1. **Always run health checks** before tests
2. **Use environment variables** for service URLs
3. **Clean up containers** after testing
4. **Check logs** when tests fail
5. **Validate port mappings** for consistency

## Scripts Reference

- `scripts/test_health_checks.py` - Comprehensive health validation
- `scripts/validate_docker_ports.py` - Docker port configuration check
- `scripts/validate_setup.py` - General setup validation
- `Makefile` - Common development tasks
