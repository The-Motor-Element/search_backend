# Apollo Search Backend - CI/CD Setup Guide

This guide will help you set up automatic deployment to Vercel with GitHub Actions CI/CD for your Apollo Search Backend.

## 🏗️ Architecture Overview

Your deployed application will have:
- **Frontend**: Test UI served as static files
- **Backend**: FastAPI as Vercel serverless functions  
- **Database**: External Meilisearch instance
- **CI/CD**: GitHub Actions for automatic deployment

## 📋 Prerequisites

1. **GitHub Repository**: Your code pushed to GitHub
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Meilisearch Instance**: External hosted Meilisearch (see options below)

## 🎯 Step-by-Step Setup

### 1. Set Up External Meilisearch

Since Vercel doesn't support persistent storage, you need an external Meilisearch instance.

#### Option A: Meilisearch Cloud (Recommended)
1. Go to [Meilisearch Cloud](https://cloud.meilisearch.com/)
2. Create an account and new project
3. Note your endpoint URL and API key

#### Option B: Railway
1. Go to [Railway](https://railway.app/)
2. Deploy Meilisearch template
3. Get your public URL and set master key

#### Option C: DigitalOcean App Platform
1. Create new app from Docker Hub
2. Use image: `getmeili/meilisearch:latest`
3. Set environment variables and expose port 7700

### 2. Set Up Vercel Project

#### Install Vercel CLI
```bash
npm i -g vercel@latest
```

#### Login and Link Project
```bash
# Login to Vercel
vercel login

# Navigate to your project
cd /path/to/search_backend

# Link to Vercel (creates new project)
vercel link
```

#### Set Environment Variables
```bash
# Set your Meilisearch URL
vercel env add MEILI_URL production
# Enter: https://your-meilisearch-instance.com

# Set your Meilisearch master key  
vercel env add MEILI_MASTER_KEY production
# Enter: your_master_key_here

# Set products index name
vercel env add PRODUCTS_INDEX production
# Enter: products
```

### 3. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

#### Required Secrets
- **`VERCEL_TOKEN`**: 
  - Go to [Vercel Account Settings](https://vercel.com/account/tokens)
  - Create new token
  - Copy and paste as secret

#### Get Project Information
```bash
# Get your organization and project IDs
vercel project ls
```

Add these to your `.vercel/project.json` or get from Vercel dashboard:
- **`VERCEL_ORG_ID`**: Your organization ID
- **`VERCEL_PROJECT_ID`**: Your project ID

### 4. Test Manual Deployment

Before setting up CI/CD, test manual deployment:

```bash
# Run the deployment script
./deploy-vercel.sh

# Or deploy manually
vercel --prod
```

### 5. Configure Data Loading

Since your data isn't included in the deployment, you'll need to load it separately:

#### Option A: API Endpoint (Recommended)
Create a protected endpoint to load data:

```python
@app.post("/admin/load-data")
async def load_apollo_data(api_key: str = Query(...)):
    if api_key != os.getenv("ADMIN_API_KEY"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    # Load your data here
```

#### Option B: Separate Script
Create a standalone script to load data to your Meilisearch instance.

### 6. Verify CI/CD Pipeline

1. **Push to GitHub**: Commit and push your changes
2. **Check Actions**: Go to GitHub Actions tab
3. **Monitor Deployment**: Watch the deployment process
4. **Test Live App**: Visit your Vercel URL

## 🔧 Configuration Files Created

- **`vercel.json`**: Vercel deployment configuration
- **`.github/workflows/deploy.yml`**: GitHub Actions CI/CD pipeline
- **`api/index.py`**: Vercel serverless function entry point
- **`.vercelignore`**: Files to exclude from deployment
- **`test_ui/config.js`**: Environment-aware frontend configuration

## 🚀 Deployment Triggers

The CI/CD pipeline will trigger on:
- **Push to `main`**: Production deployment
- **Push to `develop`**: Preview deployment  
- **Pull Requests**: Preview deployment for testing

## 🌐 Live URLs

After deployment, your app will be available at:
- **Frontend**: `https://your-app.vercel.app/`
- **API Docs**: `https://your-app.vercel.app/api/docs`
- **Health Check**: `https://your-app.vercel.app/api/health`

## 🔍 Monitoring & Debugging

### Vercel Dashboard
- Monitor function execution time
- View deployment logs
- Check error rates

### GitHub Actions
- View build logs
- Monitor test results
- Debug deployment issues

### API Health Check
Your health endpoint will show:
```json
{
  "status": "healthy",
  "meilisearch": {
    "status": "available",
    "version": "1.5.0"
  },
  "service": "apollo-tire-search-backend"
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Meilisearch Connection Failed**
   - Check MEILI_URL environment variable
   - Verify Meilisearch instance is running
   - Check firewall/network settings

2. **Function Timeout**
   - Increase maxDuration in vercel.json
   - Optimize slow operations
   - Consider caching strategies

3. **Import Errors**
   - Verify all dependencies in requirements.txt
   - Check Python path in api/index.py

4. **CORS Issues**
   - Update CORS origins in FastAPI
   - Check Vercel routing configuration

### Logs and Debugging
```bash
# View Vercel function logs
vercel logs

# View deployment logs  
vercel logs --follow

# Local development
uvicorn app.main:app --reload --port 8001
```

## 📈 Performance Optimization

### Serverless Best Practices
1. **Cold Start Optimization**: Keep dependencies minimal
2. **Function Size**: Stay under 15MB limit
3. **Timeout Management**: Set appropriate function timeouts
4. **Caching**: Use Vercel Edge caching for static content

### Frontend Optimization
1. **Static Assets**: Leverage Vercel's CDN
2. **API Caching**: Implement client-side caching
3. **Lazy Loading**: Load components on demand

## 🔒 Security Considerations

1. **Environment Variables**: Never commit secrets to git
2. **API Keys**: Rotate Meilisearch keys regularly
3. **CORS**: Restrict origins in production
4. **Rate Limiting**: Consider adding rate limiting

## 📚 Additional Resources

- [Vercel Python Runtime](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Meilisearch Cloud](https://cloud.meilisearch.com/)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)

---

🎉 **You're all set!** Your Apollo Search Backend will now automatically deploy to Vercel whenever you push changes to GitHub.
