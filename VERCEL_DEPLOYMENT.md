# Vercel deployment configuration for Apollo Search Backend

## Environment Variables Required

### Required Secrets in GitHub
- `VERCEL_TOKEN`: Your Vercel authentication token
- `VERCEL_ORG_ID`: Your Vercel organization ID  
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### Required Environment Variables in Vercel
- `MEILI_URL`: URL of your Meilisearch instance
- `MEILI_MASTER_KEY`: Master key for Meilisearch authentication
- `PRODUCTS_INDEX`: Name of the products index (default: "products")

## Setup Instructions

### 1. Create Vercel Project
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link
```

### 2. Configure Environment Variables in Vercel
```bash
# Set production environment variables
vercel env add MEILI_URL production
vercel env add MEILI_MASTER_KEY production  
vercel env add PRODUCTS_INDEX production
```

### 3. Get Project Information
```bash
# Get your organization and project IDs
vercel project ls
```

### 4. Add GitHub Secrets
Go to your GitHub repository settings → Secrets and variables → Actions:

- `VERCEL_TOKEN`: Get from https://vercel.com/account/tokens
- `VERCEL_ORG_ID`: From vercel project ls or project settings
- `VERCEL_PROJECT_ID`: From vercel project ls or project settings

### 5. Deploy
Push to main branch to trigger automatic deployment.

## API Routes
- **API Endpoints**: `/api/*` → FastAPI backend
- **Static UI**: `/*` → Test UI files

## External Meilisearch Required
Vercel's serverless functions require an external Meilisearch instance. Options:

1. **Meilisearch Cloud**: https://cloud.meilisearch.com/ (Recommended)
2. **Railway**: Deploy Meilisearch container
3. **DigitalOcean**: App Platform with Meilisearch
4. **AWS/GCP**: Container service

## Manual Deployment
```bash
# One-time manual deploy
vercel --prod
```
