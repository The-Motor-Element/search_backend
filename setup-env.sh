#!/bin/bash

# Environment setup script for AWS deployment
echo "🔧 Apollo Search Backend - Environment Setup"
echo "============================================="

# Function to generate a secure key
generate_key() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Check if .env file exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Backing up to .env.backup"
    cp .env .env.backup
fi

# Create .env file with defaults
cat > .env << EOF
# Apollo Search Backend - Environment Configuration

# Meilisearch Configuration
MEILI_URL=http://localhost:7700
MEILI_MASTER_KEY=$(generate_key)
MEILI_ENV=development
PRODUCTS_INDEX=products

# AWS Configuration (for deployment)
AWS_REGION=us-east-1
ENVIRONMENT=production

# Application Configuration
PYTHONPATH=/app
EOF

echo "✅ Environment file created: .env"
echo ""
echo "📋 Generated configuration:"
echo "   MEILI_MASTER_KEY: $(grep MEILI_MASTER_KEY .env | cut -d'=' -f2)"
echo "   AWS_REGION: us-east-1"
echo ""
echo "🔒 Important Security Notes:"
echo "   • Change MEILI_MASTER_KEY before production deployment"
echo "   • Never commit .env file to version control"
echo "   • Use AWS Secrets Manager for production secrets"
echo ""
echo "🚀 Next steps:"
echo "   1. Review and modify .env file as needed"
echo "   2. For local development: docker-compose up -d"
echo "   3. For AWS deployment: export MEILI_MASTER_KEY=\$(grep MEILI_MASTER_KEY .env | cut -d'=' -f2) && ./deploy-aws.sh"
