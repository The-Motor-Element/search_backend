#!/bin/bash
echo "🔍 Apollo Search Backend Investigation Script"
echo "============================================="

echo -e "\n📁 1. Checking deployment directory:"
ls -la /opt/apollo-search/

echo -e "\n🐳 2. Checking Docker status:"
sudo systemctl status docker --no-pager

echo -e "\n📦 3. Checking Docker containers:"
sudo docker ps -a

echo -e "\n🔄 4. Checking Apollo Search service status:"
sudo systemctl status apollo-search --no-pager

echo -e "\n📋 5. Recent Apollo Search service logs:"
sudo journalctl -u apollo-search --no-pager -n 20

echo -e "\n🐳 6. Docker Compose services status:"
cd /opt/apollo-search && sudo docker-compose ps

echo -e "\n📊 7. Checking if services are responding:"
echo "Testing Meilisearch..."
curl -s http://localhost:7700/health | head -c 200 && echo ""

echo "Testing API..."
curl -s http://localhost:8001/health | head -c 200 && echo ""

echo "Testing UI..."
curl -s http://localhost:8080/ | head -c 200 && echo ""

echo -e "\n🔧 8. System resources:"
echo "Memory usage:"
free -h

echo "Disk usage:"
df -h

echo "CPU info:"
top -bn1 | head -5

echo -e "\n📝 9. Recent system logs (errors):"
sudo journalctl --priority=err --no-pager -n 10

echo -e "\n🌐 10. Network connections:"
sudo netstat -tulpn | grep -E ':(7700|8001|8080|80)'

echo -e "\n✅ Investigation complete!"
