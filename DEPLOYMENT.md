# Deployment Guide - Automatic API Detection

This application now automatically detects the correct API endpoint based on your deployment environment, eliminating the "system offline" warnings on mobile devices.

## How It Works

The frontend automatically detects the correct API URL using multiple strategies:

### 1. Server-Side Detection
The UI server analyzes incoming requests and injects the appropriate API URL based on:
- **Host headers** - Detects cloudflare tunnels, AWS domains, ngrok, etc.
- **Protocol detection** - Automatically uses HTTP/HTTPS as appropriate
- **Environment variables** - Respects `API_URL` if explicitly set

### 2. Client-Side Fallback
If server detection fails, the JavaScript frontend:
- **Analyzes current URL** - Detects cloud services by domain patterns
- **Tests multiple endpoints** - Tries different API URLs until one works
- **Auto-switches** - Updates to working endpoint if primary fails

### 3. Multi-Endpoint Health Checking
The system tries multiple API endpoints in order:
1. Server-detected URL (priority)
2. Environment variable `API_URL`
3. Same domain with `:8001` port
4. `localhost:8001` (local fallback)

## Deployment Methods

### Local Development
```bash
docker-compose up
# ✅ Automatically uses http://localhost:8001
```

### Cloudflare Tunnel
```bash
# Start your services
docker-compose up

# In another terminal, start cloudflare tunnel
cloudflared tunnel --url http://localhost:8080

# ✅ Mobile access automatically detects correct API endpoint
```

### AWS Deployment
```bash
# Deploy with docker-compose on EC2
docker-compose up

# ✅ Automatically detects AWS environment and uses public IP/domain
```

### Manual Override (Optional)
If you need to manually specify the API URL:

```bash
# Set environment variable
export API_URL=https://your-custom-api-domain.com
docker-compose up
```

Or modify your `.env` file:
```env
API_URL=https://your-custom-api-domain.com
```

## Features

- ✅ **Zero Configuration** - Works out of the box
- ✅ **Multi-Environment** - Local, cloud, tunnel support
- ✅ **Mobile Friendly** - No more "system offline" warnings
- ✅ **Fault Tolerant** - Automatic fallback to working endpoints
- ✅ **Real-time Detection** - Adapts to environment changes

## Supported Platforms

- **Local Development** - localhost
- **Cloudflare Tunnels** - *.trycloudflare.com
- **AWS** - *.amazonaws.com, *.compute.amazonaws.com
- **Ngrok** - *.ngrok.io
- **Custom Domains** - Any domain with manual override

## Troubleshooting

If you see "System Offline" warnings:

1. **Check API Health**: Ensure your API service is running on port 8001
2. **Check Logs**: Look at browser console for API detection logs
3. **Manual Override**: Set `API_URL` environment variable explicitly
4. **Network Issues**: Ensure firewall allows port 8001 (for non-tunneled access)

## Console Logs

The system provides detailed logging for debugging:
```javascript
🎯 Using server-injected API URL: https://example.trycloudflare.com/api
🔍 Checking health at: https://example.trycloudflare.com/api
✅ Found working API at: https://example.trycloudflare.com/api
```

This eliminates the guesswork and ensures your application works across all deployment scenarios!
