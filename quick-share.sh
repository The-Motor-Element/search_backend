#!/bin/bash

# Multi-Brand Tire Search - Quick Tunnel Script
# For rapid sharing with team using cloudflared quick tunnels

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Multi-Brand Tire Search - Quick Share Setup${NC}"
echo -e "${BLUE}=============================================${NC}"

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${YELLOW}📥 Installing cloudflared...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install cloudflared
    else
        echo -e "${RED}❌ Please install cloudflared manually${NC}"
        exit 1
    fi
fi

# Check if services are running
echo -e "${YELLOW}🔍 Checking services...${NC}"
if ! curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${RED}❌ Services not running. Starting them first...${NC}"
    ./run.sh
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    sleep 30
fi

echo -e "${GREEN}✅ All services are running${NC}"

# Start quick tunnels for each service
echo -e "${YELLOW}🌐 Starting quick tunnels...${NC}"

# Start UI tunnel
echo -e "${BLUE}🖥️  Starting UI tunnel...${NC}"
cloudflared tunnel --url http://localhost:8080 > ui-tunnel.log 2>&1 &
UI_PID=$!

# Start API tunnel  
echo -e "${BLUE}📡 Starting API tunnel...${NC}"
cloudflared tunnel --url http://localhost:8001 > api-tunnel.log 2>&1 &
API_PID=$!

# Start MeiliSearch tunnel
echo -e "${BLUE}🔍 Starting MeiliSearch tunnel...${NC}"
cloudflared tunnel --url http://localhost:7700 > meilisearch-tunnel.log 2>&1 &
MEILI_PID=$!

# Wait for tunnels to start and extract URLs
echo -e "${YELLOW}⏳ Waiting for tunnels to initialize...${NC}"
sleep 10

# Extract URLs from logs
UI_URL=""
API_URL=""
MEILI_URL=""

for i in {1..30}; do
    if [[ -f ui-tunnel.log ]] && grep -q "https://.*\.trycloudflare\.com" ui-tunnel.log; then
        UI_URL=$(grep -o "https://.*\.trycloudflare\.com" ui-tunnel.log | head -1)
        break
    fi
    sleep 1
done

for i in {1..30}; do
    if [[ -f api-tunnel.log ]] && grep -q "https://.*\.trycloudflare\.com" api-tunnel.log; then
        API_URL=$(grep -o "https://.*\.trycloudflare\.com" api-tunnel.log | head -1)
        break
    fi
    sleep 1
done

for i in {1..30}; do
    if [[ -f meilisearch-tunnel.log ]] && grep -q "https://.*\.trycloudflare\.com" meilisearch-tunnel.log; then
        MEILI_URL=$(grep -o "https://.*\.trycloudflare\.com" meilisearch-tunnel.log | head -1)
        break
    fi
    sleep 1
done

# Update UI configuration to use cloudflared API URL
if [[ -n "$API_URL" && -n "$UI_URL" ]]; then
    echo -e "${YELLOW}🔧 Configuring UI to use cloudflared API endpoint...${NC}"
    
    # Create a temporary configuration for cloudflared
    cat > test_ui/cloudflared-config.js << EOF
// Cloudflared configuration - automatically generated
window.APOLLO_API_URL = '$API_URL';
console.log('🌐 Using cloudflared API URL:', '$API_URL');
EOF
    
    # Update the HTML to include this config
    if ! grep -q "cloudflared-config.js" test_ui/index.html; then
        # Add the config script before the main script
        sed -i '' 's|<script src="script.js">|<script src="cloudflared-config.js"></script>\n    <script src="script.js">|' test_ui/index.html
        echo -e "${GREEN}✅ UI configured for cloudflared${NC}"
    fi
    
    # Restart UI tunnel to pick up changes
    kill $UI_PID 2>/dev/null || true
    sleep 2
    cloudflared tunnel --url http://localhost:8080 > ui-tunnel.log 2>&1 &
    UI_PID=$!
    
    # Wait for new UI URL
    sleep 5
    UI_URL=$(grep -o "https://.*\.trycloudflare\.com" ui-tunnel.log | head -1)
fi

# Display results
echo ""
echo -e "${GREEN}🎉 Multi-Brand Tire Search is now accessible to your team!${NC}"
echo ""
echo -e "${BLUE}🌍 Team Access URLs:${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [[ -n "$UI_URL" ]]; then
    echo -e "${GREEN}🖥️  Main Application (UI):${NC}"
    echo -e "   ${YELLOW}$UI_URL${NC}"
    echo -e "   ${BLUE}→ Primary interface for searching tires${NC}"
else
    echo -e "${RED}❌ UI tunnel failed to start${NC}"
fi

if [[ -n "$API_URL" ]]; then
    echo -e "${GREEN}📡 API Documentation:${NC}"
    echo -e "   ${YELLOW}$API_URL/docs${NC}"
    echo -e "   ${BLUE}→ Interactive API documentation${NC}"
    
    echo -e "${GREEN}🔍 API Health Check:${NC}"
    echo -e "   ${YELLOW}$API_URL/health${NC}"
    echo -e "   ${BLUE}→ System status and statistics${NC}"
else
    echo -e "${RED}❌ API tunnel failed to start${NC}"
fi

if [[ -n "$MEILI_URL" ]]; then
    echo -e "${GREEN}🎛️  MeiliSearch Dashboard:${NC}"
    echo -e "   ${YELLOW}$MEILI_URL${NC}"
    echo -e "   ${BLUE}→ Search engine administration${NC}"
else
    echo -e "${RED}❌ MeiliSearch tunnel failed to start${NC}"
fi

echo ""
echo -e "${BLUE}📊 System Information:${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
TOTAL_PRODUCTS=$(curl -s http://localhost:8001/search/filters/brands 2>/dev/null | python3 -c "import sys,json;d=json.load(sys.stdin);print(sum(b['count'] for b in d['brands']))" 2>/dev/null || echo 'Loading...')
echo -e "   • Total Products: ${YELLOW}$TOTAL_PRODUCTS${NC}"
echo -e "   • Brands: ${YELLOW}Apollo, CEAT, MRF, Eurogrip${NC}"
echo -e "   • Search Features: ${YELLOW}Cross-brand search, filtering, facets${NC}"

echo ""
echo -e "${BLUE}🛠️  Management:${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "   Stop all tunnels: ${YELLOW}kill $UI_PID $API_PID $MEILI_PID${NC}"
echo -e "   View logs: ${YELLOW}tail -f *tunnel.log${NC}"
echo -e "   Restart services: ${YELLOW}./run.sh${NC}"

# Save information to file
cat > team-access-info.txt << EOF
Multi-Brand Tire Search - Team Access Information
================================================

🖥️  Main Application: $UI_URL
📡 API Documentation: $API_URL/docs
🔍 Admin Dashboard: $MEILI_URL

System Stats:
- Total Products: $TOTAL_PRODUCTS
- Brands: Apollo, CEAT, MRF, Eurogrip
- Created: $(date)

Process IDs:
- UI Tunnel: $UI_PID
- API Tunnel: $API_PID  
- MeiliSearch Tunnel: $MEILI_PID

To stop all tunnels: kill $UI_PID $API_PID $MEILI_PID
EOF

echo -e "${GREEN}📄 Access info saved to: team-access-info.txt${NC}"

# Create stop script
cat > stop-tunnels.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping cloudflared tunnels..."
if [[ -f team-access-info.txt ]]; then
    PIDS=$(grep -E "(UI Tunnel:|API Tunnel:|MeiliSearch Tunnel:)" team-access-info.txt | awk '{print $NF}')
    for pid in $PIDS; do
        if ps -p $pid > /dev/null 2>&1; then
            echo "Stopping tunnel (PID: $pid)"
            kill $pid
        fi
    done
else
    echo "Stopping all cloudflared processes..."
    pkill cloudflared
fi

# Clean up cloudflared configuration
echo "🧹 Cleaning up cloudflared configuration..."
rm -f test_ui/cloudflared-config.js
if grep -q "cloudflared-config.js" test_ui/index.html 2>/dev/null; then
    sed -i '' '/cloudflared-config.js/d' test_ui/index.html
    echo "✅ UI configuration restored"
fi

echo "✅ Tunnels stopped and configuration cleaned"
rm -f *tunnel.log team-access-info.txt stop-tunnels.sh
EOF

chmod +x stop-tunnels.sh
echo -e "${GREEN}🛑 Stop script created: ./stop-tunnels.sh${NC}"

echo ""
echo -e "${GREEN}🎉 Setup complete! Share the URLs above with your team.${NC}"
echo -e "${YELLOW}💡 Note: These are temporary URLs that will change if you restart the tunnels.${NC}"
