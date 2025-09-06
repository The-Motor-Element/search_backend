#!/bin/bash

# Apollo Tire Search - Docker Deployment Script
# This script sets up and runs the complete Apollo Tire Search application using Docker

set -e

echo "🚀 Apollo Tire Search - Docker Deployment"
echo "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ docker-compose is not installed. Please install it and try again."
    exit 1
fi

# Set environment variables if not already set
export MEILI_MASTER_KEY="${MEILI_MASTER_KEY:-development_key_please_change_in_production}"
export MEILI_ENV="${MEILI_ENV:-development}"

echo "📋 Configuration:"
echo "   • Meilisearch URL: http://localhost:7700"
echo "   • API Server URL: http://localhost:8001"
echo "   • UI Server URL: http://localhost:8080"
echo "   • Environment: $MEILI_ENV"
echo ""

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
if docker-compose ps | grep -q "Up (healthy)"; then
    echo "✅ Services are starting up successfully!"
else
    echo "⚠️  Services are still starting... checking logs:"
    docker-compose logs --tail=10
fi

echo ""
echo "🎯 Application URLs:"
echo "   • 🔍 Search UI: http://localhost:8080"
echo "   • 🔌 API Docs: http://localhost:8001/docs"
echo "   • 📊 Meilisearch: http://localhost:7700"
echo ""
echo "💡 Next Steps:"
echo "   1. Wait for all services to be healthy (check with: docker-compose ps)"
echo "   2. Load Apollo tire data: docker-compose exec api python scripts/load_apollo_data.py"
echo "   3. Open the UI: http://localhost:8080"
echo ""
echo "🛠️ Management Commands:"
echo "   • View logs: docker-compose logs -f"
echo "   • Stop services: docker-compose down"
echo "   • Restart: docker-compose restart"
echo "   • Check status: docker-compose ps"
