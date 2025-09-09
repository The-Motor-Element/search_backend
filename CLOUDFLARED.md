# 🌐 Cloudflare Tunnel Setup for Multi-Brand Tire Search

This directory contains scripts to share your multi-brand tire search application with your team using Cloudflare Tunnels.

## 🚀 Quick Start (Recommended)

For rapid sharing with temporary URLs:

```bash
./quick-share.sh
```

This will:
- ✅ Check if services are running (starts them if needed)
- ✅ Install cloudflared if missing
- ✅ Create temporary tunnels for all 3 services
- ✅ Automatically configure UI to connect to cloudflared API
- ✅ Provide team access URLs
- ✅ Create a stop script for cleanup

## 🛠️ Advanced Setup (Persistent Tunnels)

For permanent tunnels with custom domains:

```bash
./cloudflared-setup.sh
```

This will:
- ✅ Authenticate with Cloudflare
- ✅ Create a named tunnel
- ✅ Configure DNS routing
- ✅ Set up persistent configuration
- ✅ Provide management commands

## 📋 Services Exposed

| Service | Port | Purpose |
|---------|------|---------|
| **UI** | 8080 | Main application interface |
| **API** | 8001 | Backend API and documentation |
| **MeiliSearch** | 7700 | Search engine dashboard |

## 🌍 What Your Team Gets

### Main Application (UI)
- Complete tire search interface
- Browse 4,600+ products across 4 brands
- Advanced filtering and search capabilities
- Responsive design for mobile/desktop

### API Access
- Interactive documentation at `/docs`
- Health monitoring at `/health`
- Direct API access for developers
- Real-time search statistics

### Admin Dashboard
- MeiliSearch administration interface
- Search index management
- Performance monitoring
- Data exploration tools

## 🔧 Management Commands

### Quick Share
```bash
# Start sharing
./quick-share.sh

# Stop all tunnels
./stop-tunnels.sh  # (auto-generated)

# View tunnel logs
tail -f *tunnel.log
```

### Advanced Setup
```bash
# View tunnel status
cloudflared tunnel list

# Stop specific tunnel
cloudflared tunnel delete <tunnel-name>

# View configuration
cat ~/.cloudflared/config.yml
```

## 🔒 Security Considerations

### Public Access
- Tunnels create **public URLs** accessible to anyone with the link
- Consider implementing authentication for production use
- Monitor access through Cloudflare dashboard

### Data Protection
- MeiliSearch dashboard has admin access - share carefully
- API endpoints are read-only by default
- No sensitive data exposed in tire catalog

## 🐛 Troubleshooting

### Services Not Starting
```bash
# Check if Docker is running
docker ps

# Restart all services
./run.sh

# Check service health
curl http://localhost:8080  # UI
curl http://localhost:8001/health  # API
curl http://localhost:7700/health  # MeiliSearch
```

### Tunnel Issues
```bash
# Check cloudflared status
ps aux | grep cloudflared

# View tunnel logs
tail -f *tunnel.log

# Restart tunnels
./stop-tunnels.sh
./quick-share.sh
```

### UI Not Loading API Data
- The UI automatically configures for cloudflared
- Check browser console for errors
- Verify API tunnel is running and accessible

## 💡 Tips

1. **Quick Testing**: Use `quick-share.sh` for demos and testing
2. **Production**: Use `cloudflared-setup.sh` for persistent team access  
3. **Monitoring**: Keep an eye on tunnel logs for issues
4. **Performance**: Cloudflared adds minimal latency (~50-100ms)
5. **Sharing**: URLs are shareable - send them via email/Slack

## 📊 Example Team Workflow

1. **Developer** runs `./quick-share.sh`
2. **Team** gets 3 URLs:
   - Product manager uses UI for testing
   - Developers use API for integration
   - DevOps uses MeiliSearch for monitoring
3. **Collaboration** happens in real-time
4. **Cleanup** with `./stop-tunnels.sh` when done

## 🆘 Support

- **Cloudflare Docs**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **MeiliSearch Docs**: https://docs.meilisearch.com/
- **FastAPI Docs**: https://fastapi.tiangolo.com/

---

🎉 **Ready to share your multi-brand tire search with the world!**
