#!/bin/bash

# Manual deployment script for Vercel
echo "🚀 Deploying Apollo Search Backend to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel@latest
fi

# Check if project is linked
if [ ! -f ".vercel/project.json" ]; then
    echo "🔗 Linking project to Vercel..."
    vercel link
fi

# Run tests before deployment
echo "🧪 Running tests..."
python -m pytest tests/ -v

if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Deployment aborted."
    exit 1
fi

# Deploy to Vercel
echo "📦 Deploying to production..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at your Vercel URL"
echo "📚 API docs will be at: https://your-app.vercel.app/api/docs"
