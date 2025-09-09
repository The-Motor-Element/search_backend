#!/bin/bash

# Multi-Brand Tire Search - Cloudflare Tunnel Setup Script
# This script sets up cloudflared tunnels for sharing the application with your team

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TUNNEL_NAME="tire-search-$(date +%s)"
CONFIG_DIR="$HOME/.cloudflared"
CONFIG_FILE="$CONFIG_DIR/config.yml"

echo -e "${BLUE}🚀 Multi-Brand Tire Search - Cloudflare Tunnel Setup${NC}"
echo -e "${BLUE}=================================================${NC}"

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}❌ cloudflared is not installed${NC}"
    echo -e "${YELLOW}📥 Installing cloudflared...${NC}"
    
    # Install cloudflared for macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install cloudflared
        else
            echo -e "${RED}❌ Homebrew not found. Please install Homebrew first or install cloudflared manually${NC}"
            echo -e "${BLUE}   Visit: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Please install cloudflared manually for your OS${NC}"
        echo -e "${BLUE}   Visit: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ cloudflared is installed${NC}"

# Check if user is logged in
if ! cloudflared tunnel list &> /dev/null; then
    echo -e "${YELLOW}🔐 Please log in to Cloudflare first...${NC}"
    cloudflared tunnel login
fi

echo -e "${GREEN}✅ Cloudflare authentication verified${NC}"

# Check if services are running
echo -e "${YELLOW}🔍 Checking if services are running...${NC}"

if ! curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${RED}❌ UI service not running on port 8080${NC}"
    echo -e "${YELLOW}💡 Run './run.sh' first to start all services${NC}"
    exit 1
fi

if ! curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo -e "${RED}❌ API service not running on port 8001${NC}"
    echo -e "${YELLOW}💡 Run './run.sh' first to start all services${NC}"
    exit 1
fi

if ! curl -s http://localhost:7700/health > /dev/null 2>&1; then
    echo -e "${RED}❌ MeiliSearch service not running on port 7700${NC}"
    echo -e "${YELLOW}💡 Run './run.sh' first to start all services${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All services are running${NC}"

# Create tunnel
echo -e "${YELLOW}🌐 Creating Cloudflare tunnel: ${TUNNEL_NAME}${NC}"
cloudflared tunnel create $TUNNEL_NAME

# Get tunnel ID
TUNNEL_ID=$(cloudflared tunnel list | grep $TUNNEL_NAME | awk '{print $1}')
echo -e "${GREEN}✅ Tunnel created with ID: ${TUNNEL_ID}${NC}"

# Create config directory if it doesn't exist
mkdir -p $CONFIG_DIR

# Create cloudflared config file
echo -e "${YELLOW}📝 Creating tunnel configuration...${NC}"

cat > $CONFIG_FILE << EOF
tunnel: $TUNNEL_ID
credentials-file: $CONFIG_DIR/$TUNNEL_ID.json

ingress:
  # Main UI - Team will access this URL
  - hostname: tire-search-ui-$TUNNEL_ID.trycloudflare.com
    service: http://localhost:8080
  
  # API Backend - For direct API access
  - hostname: tire-search-api-$TUNNEL_ID.trycloudflare.com
    service: http://localhost:8001
  
  # MeiliSearch Dashboard - For search engine management
  - hostname: tire-search-admin-$TUNNEL_ID.trycloudflare.com
    service: http://localhost:7700
  
  # Catch-all rule (required)
  - service: http_status:404

EOF

echo -e "${GREEN}✅ Configuration file created at: ${CONFIG_FILE}${NC}"

# Route DNS
echo -e "${YELLOW}🔗 Setting up DNS routing...${NC}"
cloudflared tunnel route dns $TUNNEL_NAME tire-search-ui-$TUNNEL_ID.trycloudflare.com
cloudflared tunnel route dns $TUNNEL_NAME tire-search-api-$TUNNEL_ID.trycloudflare.com  
cloudflared tunnel route dns $TUNNEL_NAME tire-search-admin-$TUNNEL_ID.trycloudflare.com

# Start tunnel in background
echo -e "${YELLOW}🚀 Starting tunnel...${NC}"
cloudflared tunnel --config $CONFIG_FILE run $TUNNEL_NAME &
TUNNEL_PID=$!

# Wait a bit for tunnel to start
sleep 5

# Check if tunnel is running
if ps -p $TUNNEL_PID > /dev/null; then
    echo -e "${GREEN}✅ Tunnel is running successfully!${NC}"
    echo ""
    echo -e "${BLUE}🌍 Your Multi-Brand Tire Search is now accessible to your team:${NC}"
    echo ""
    echo -e "${GREEN}🖥️  Main Application (UI):${NC}"
    echo -e "   ${YELLOW}https://tire-search-ui-$TUNNEL_ID.trycloudflare.com${NC}"
    echo ""
    echo -e "${GREEN}📡 API Documentation:${NC}"
    echo -e "   ${YELLOW}https://tire-search-api-$TUNNEL_ID.trycloudflare.com/docs${NC}"
    echo ""
    echo -e "${GREEN}🔍 MeiliSearch Dashboard:${NC}"
    echo -e "   ${YELLOW}https://tire-search-admin-$TUNNEL_ID.trycloudflare.com${NC}"
    echo ""
    echo -e "${BLUE}📋 System Information:${NC}"
    echo -e "   • Total Products: $(curl -s http://localhost:8001/search/filters/brands | python3 -c "import sys,json;d=json.load(sys.stdin);print(sum(b['count'] for b in d['brands']))" 2>/dev/null || echo 'Loading...')"
    echo -e "   • Brands: Apollo, CEAT, MRF, Eurogrip"
    echo -e "   • Tunnel PID: $TUNNEL_PID"
    echo ""
    echo -e "${YELLOW}📝 Save these URLs and share them with your team!${NC}"
    echo ""
    echo -e "${BLUE}🛠️  Management Commands:${NC}"
    echo -e "   Stop tunnel: ${YELLOW}kill $TUNNEL_PID${NC}"
    echo -e "   View config: ${YELLOW}cat $CONFIG_FILE${NC}"
    echo -e "   Tunnel logs: ${YELLOW}cloudflared tunnel --config $CONFIG_FILE run $TUNNEL_NAME${NC}"
    
    # Save URLs to a file for easy reference
    cat > cloudflared-urls.txt << EOF
Multi-Brand Tire Search - Team Access URLs
==========================================

🖥️  Main Application: https://tire-search-ui-$TUNNEL_ID.trycloudflare.com
📡 API Documentation: https://tire-search-api-$TUNNEL_ID.trycloudflare.com/docs  
🔍 Admin Dashboard: https://tire-search-admin-$TUNNEL_ID.trycloudflare.com

Tunnel ID: $TUNNEL_ID
Tunnel PID: $TUNNEL_PID
Created: $(date)

To stop the tunnel: kill $TUNNEL_PID
EOF
    
    echo -e "${GREEN}📄 URLs saved to: cloudflared-urls.txt${NC}"
    
else
    echo -e "${RED}❌ Failed to start tunnel${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Setup complete! Your team can now access the tire search application.${NC}"
