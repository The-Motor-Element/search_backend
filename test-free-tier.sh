#!/bin/bash

# Simple validation script for Free Tier deployment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

BASE_URL="$1"

if [ -z "$BASE_URL" ]; then
    echo -e "${RED}❌ Usage: $0 <BASE_URL>${NC}"
    echo "Example: $0 http://1.2.3.4"
    exit 1
fi

BASE_URL=${BASE_URL%/}

echo -e "${BLUE}🧪 Testing Free Tier Deployment${NC}"
echo "==============================="
echo "Base URL: $BASE_URL"
echo ""

failed=0

# Test function
test_endpoint() {
    local url="$1"
    local name="$2"
    
    echo -n "Testing $name... "
    
    if curl -f -s --max-time 15 "$url" >/dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
        ((failed++))
    fi
}

# Basic tests
echo -e "${YELLOW}🔍 Basic Services${NC}"
test_endpoint "$BASE_URL:8080" "UI"
test_endpoint "$BASE_URL:8001/health" "API Health"
test_endpoint "$BASE_URL:7700/health" "MeiliSearch"

echo ""
echo -e "${YELLOW}🔍 Search Features${NC}"
test_endpoint "$BASE_URL:8001/search?q=apollo&limit=5" "Search"
test_endpoint "$BASE_URL:8001/search/filters/brands" "Filters"
test_endpoint "$BASE_URL:8001/analytics/stats" "Analytics"

echo ""
if [ $failed -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your free tier deployment is working.${NC}"
    echo ""
    echo -e "${BLUE}🌐 Access URLs:${NC}"
    echo "   UI:    $BASE_URL:8080"
    echo "   API:   $BASE_URL:8001/docs"
    echo "   Admin: $BASE_URL:7700"
    echo ""
    echo -e "${GREEN}💰 Cost: \$0/month (Free Tier)${NC}"
    echo -e "${GREEN}Ready for development! 🚗${NC}"
else
    echo -e "${RED}❌ $failed tests failed.${NC}"
    echo -e "${YELLOW}💡 The instance might still be starting up.${NC}"
    echo "Wait 2-3 minutes and try again."
fi
