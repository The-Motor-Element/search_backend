.PHONY: help install setup start stop seed test clean validate docs health test-ci ports docker-test

# Default target
help:
	@echo "E-commerce Search Backend - Available Commands:"
	@echo ""
	@echo "  install      - Install Python dependencies"
	@echo "  setup        - Setup environment and start services"
	@echo "  start        - Start all services (Meilisearch + API)"
	@echo "  stop         - Stop all services"
	@echo "  seed         - Seed sample data"
	@echo "  test         - Run tests"
	@echo "  test-ci      - Run tests for CI (with Docker services)"
	@echo "  health       - Check service health"
	@echo "  ports        - Validate Docker port configuration"
	@echo "  docker-test  - Test Docker Compose compatibility"
	@echo "  validate     - Validate setup"
	@echo "  clean        - Clean up containers and volumes"
	@echo "  docs         - Open API documentation"
	@echo ""

# Install Python dependencies
install:
	pip install -r requirements.txt

# Setup environment
setup: install
	@echo "Setting up environment..."
	@cp .env.example .env || echo ".env already exists"
	@command -v docker-compose >/dev/null 2>&1 && docker-compose up -d || docker compose up -d
	@echo "Waiting for Meilisearch to start..."
	@sleep 5
	@echo "Setup complete!"

# Start services
start:
	@echo "Starting Meilisearch..."
	@command -v docker-compose >/dev/null 2>&1 && docker-compose up -d || docker compose up -d
	@echo "Starting API server..."
	@echo "Run: uvicorn app.main:app --reload --port 8000"

# Stop services
stop:
	@echo "Stopping services..."
	@command -v docker-compose >/dev/null 2>&1 && docker-compose down || docker compose down

# Seed sample data
seed:
	python scripts/seed.py

# Run tests
test:
	pytest tests/ -v

# Run tests for CI environment (with Docker services)
test-ci:
	@echo "Starting services for testing..."
	@command -v docker-compose >/dev/null 2>&1 && docker-compose up -d || docker compose up -d
	@echo "Checking service health..."
	python scripts/test_health_checks.py
	@echo "Running tests..."
	API_BASE_URL=http://localhost:8001 pytest tests/ -v
	@echo "Stopping services..."
	@command -v docker-compose >/dev/null 2>&1 && docker-compose down || docker compose down

# Check service health
health:
	python scripts/test_health_checks.py

# Validate Docker port configuration
ports:
	python scripts/validate_docker_ports.py

# Test Docker Compose compatibility
docker-test:
	python scripts/test_docker_compose.py

# Validate setup
validate:
	python scripts/validate_setup.py

# Clean up
clean:
	@command -v docker-compose >/dev/null 2>&1 && docker-compose down -v || docker compose down -v
	docker system prune -f

# Open documentation
docs:
	@echo "Opening API documentation..."
	@echo "Visit: http://localhost:8000/docs"

# Development workflow
dev: setup validate seed
	@echo ""
	@echo "🎉 Development environment ready!"
	@echo ""
	@echo "Start the API server with:"
	@echo "  uvicorn app.main:app --reload --port 8000"
	@echo ""
	@echo "Then visit:"
	@echo "  http://localhost:8000/docs - API Documentation"
	@echo "  http://localhost:8000/health - Health Check"
