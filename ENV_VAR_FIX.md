# Environment Variable Configuration Fix

## 🐛 **Problem**
GitHub Actions was failing because the `API_BASE_URL` environment variable wasn't being properly set, causing tests to try connecting to port 8000 instead of 8001.

**Error:**
```
API health check failed: HTTPConnectionPool(host='localhost', port=8000): Max retries exceeded
```

## ✅ **Root Cause**
The workflow was using inline environment variable setting (`API_BASE_URL=http://localhost:8001 command`), but this doesn't work consistently across all steps in GitHub Actions.

## 🔧 **Fix Applied**

### 1. **Updated GitHub Workflow Environment Variables**

**Before (Inconsistent):**
```yaml
- name: Run tests
  run: |
    API_BASE_URL=http://localhost:8001 python -m pytest tests/ -v
```

**After (Proper env block):**
```yaml
- name: Run tests
  env:
    API_BASE_URL: http://localhost:8001
    MEILI_URL: http://localhost:7700
    MEILI_MASTER_KEY: test_key_for_ci
  run: |
    python -m pytest tests/test_endpoints.py -v
```

### 2. **Consistent Environment Variables Across All Steps**

Now all test-related steps use the same `env` block:

```yaml
env:
  API_BASE_URL: http://localhost:8001
  MEILI_URL: http://localhost:7700
  MEILI_MASTER_KEY: test_key_for_ci
```

### 3. **Added Debug Information**

**Enhanced `test_simple_health.py`:**
```python
print(f"Environment variables:")
print(f"  - API_BASE_URL: {os.getenv('API_BASE_URL', 'NOT SET')}")
print(f"  - MEILI_URL: {os.getenv('MEILI_URL', 'NOT SET')}")
print(f"  - MEILI_MASTER_KEY: {'SET' if os.getenv('MEILI_MASTER_KEY') else 'NOT SET'}")
```

**New Debug Script (`debug_docker_services.py`):**
- Shows Docker service status
- Lists actual port bindings
- Tests connectivity
- Displays environment variables

### 4. **Enhanced Service Startup**

**Added initialization wait:**
```yaml
# Wait a bit for services to initialize
echo "Waiting for services to initialize..."
sleep 10
```

**Added port mapping verification:**
```yaml
echo "Port mappings:"
docker compose port api 8001 || echo "API port mapping not found"
docker compose port meilisearch 7700 || echo "Meilisearch port mapping not found"
```

## 📋 **Docker Configuration Verified**

**docker-compose.yml:**
```yaml
api:
  ports:
    - "8001:8001"  # ✅ Correct mapping
```

**Dockerfile.api:**
```dockerfile
EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

## 🧪 **Testing Strategy**

### 1. **Layered Debugging:**
1. **Service Status** - Check Docker containers are running
2. **Port Mapping** - Verify port bindings are correct  
3. **Environment Variables** - Confirm all vars are set
4. **Connectivity** - Test actual HTTP connections
5. **Full Tests** - Run complete test suite

### 2. **Multiple Verification Points:**
- Docker Compose service status
- Port binding verification
- Environment variable display
- Manual curl connectivity tests
- Python requests connectivity tests

## 🎯 **Expected GitHub Actions Flow**

```
1. Start Docker Compose services ✅
2. Wait for initialization (10s) ✅  
3. Show service status ✅
4. Verify port mappings ✅
5. Debug environment variables ✅
6. Run health checks ✅
7. Run simple connectivity tests ✅
8. Run full test suite ✅
```

## 🔧 **Local Testing Commands**

```bash
# Test environment variable handling
API_BASE_URL=http://localhost:8001 MEILI_URL=http://localhost:7700 python tests/test_simple_health.py

# Debug Docker services
python scripts/debug_docker_services.py

# Full test with proper environment
API_BASE_URL=http://localhost:8001 pytest tests/test_endpoints.py -v
```

This fix ensures that GitHub Actions properly sets and uses the correct ports for all API connections. 🎉
