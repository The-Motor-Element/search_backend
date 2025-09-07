# 🆓 AWS Free Tier Demo Deployment - Apollo Search Backend

Deploy a **completely FREE** demo of the Apollo Search Backend using AWS Free Tier resources. Perfect for testing, demos, and development!

## 💰 **Cost: $0.00** 
*Valid for first 12 months with AWS Free Tier*

## 🎯 **What You Get**

- ✅ **Complete Apollo Search Backend** running on AWS
- ✅ **Meilisearch** with 1,557 tire products indexed
- ✅ **Interactive Test UI** for search and analytics
- ✅ **REST API** with full documentation
- ✅ **Persistent storage** for search data
- ✅ **CloudWatch monitoring** and logging
- ✅ **SSH access** for server management

## 🏗️ **Free Tier Resources Used**

| Resource | Free Tier Limit | Usage |
|----------|----------------|-------|
| EC2 (t2.micro) | 750 hours/month | 1 instance |
| EBS Storage | 30 GB | 8 GB |
| CloudWatch Logs | 5 GB ingestion | ~100 MB/month |
| Data Transfer | 15 GB/month | ~1-5 GB/month |
| **Total Cost** | **$0.00** | **First 12 months** |

## 🚀 **Quick Deploy (2 minutes)**

### Option 1: One-Command Deployment
```bash
# Clone the repository
git clone https://github.com/The-Motor-Element/search_backend.git
cd search_backend

# Deploy to AWS Free Tier
./deploy-aws-free.sh
```

### Option 2: GitHub Actions (No Local Setup)
1. Fork this repository
2. Go to **Actions** → **Deploy Demo to AWS Free Tier**
3. Click **Run workflow**
4. Enter your preferred SSH key name and AWS region
5. Wait 3-5 minutes for deployment

## 📋 **Prerequisites**

### AWS Account Setup
1. **AWS Account**: [Create free account](https://aws.amazon.com/free/) if you don't have one
2. **AWS CLI**: Install and configure
   ```bash
   pip install awscli
   aws configure
   ```

### GitHub Actions Setup (if using Option 2)
Add these secrets to your GitHub repository:
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

## 🎮 **After Deployment**

### Access Your Demo
Once deployed, you'll get these URLs:
- **🌐 Search UI**: `http://YOUR-IP:8080`
- **📚 API Docs**: `http://YOUR-IP:8001/docs`
- **🔍 Meilisearch**: `http://YOUR-IP:7700`

### Load Demo Data
```bash
# SSH into your instance
ssh -i apollo-demo-key.pem ec2-user@YOUR-INSTANCE-IP

# Load the Apollo tire catalog (1,557 products)
cd /opt/apollo-search
sudo docker-compose exec api python scripts/docker_load_data.py
```

### Test the Search
1. Open the Search UI in your browser
2. Try these sample searches:
   - `LOADSTAR` - Search tire patterns
   - `155/80` - Search by tire size
   - `Apollo` - Brand search
   - Empty query with facets for browsing

## 🛠️ **Server Management**

### Service Control
```bash
# Start services
sudo systemctl start apollo-search

# Stop services  
sudo systemctl stop apollo-search

# Restart services
sudo systemctl restart apollo-search

# Check status
sudo systemctl status apollo-search
```

### View Logs
```bash
# View all service logs
sudo docker-compose -f /opt/apollo-search/docker-compose.yml logs -f

# View specific service logs
sudo docker-compose -f /opt/apollo-search/docker-compose.yml logs -f api
sudo docker-compose -f /opt/apollo-search/docker-compose.yml logs -f meilisearch
```

### Container Management
```bash
# Check running containers
sudo docker ps

# Restart a specific service
sudo docker-compose -f /opt/apollo-search/docker-compose.yml restart api

# Update containers (pull latest images)
cd /opt/apollo-search
sudo docker-compose pull
sudo docker-compose up -d
```

## 📊 **Monitoring**

### CloudWatch Logs
- Log Group: `/aws/ec2/apollo-search`
- Retention: 3 days (to stay within free tier)
- Access via AWS Console → CloudWatch → Logs

### System Monitoring
```bash
# Check system resources
top
htop  # if installed
df -h  # disk usage
free -h  # memory usage

# Check service health
curl http://localhost:8001/health
curl http://localhost:7700/health
```

## 🔧 **Customization**

### Environment Variables
Located in `/opt/apollo-search/docker-compose.yml`:
```yaml
environment:
  - MEILI_MASTER_KEY=your-demo-key
  - MEILI_ENV=development
  - API_URL=http://localhost:8001
```

### Port Configuration
Default ports:
- **UI**: 8080
- **API**: 8001  
- **Meilisearch**: 7700

To change ports, edit the docker-compose.yml file and restart services.

### Security Groups
The deployment creates security group rules for:
- SSH (port 22)
- HTTP (port 80)
- API (port 8001)
- UI (port 8080)
- Meilisearch (port 7700)

## 🚨 **Limitations & Considerations**

### Demo Limitations
- ⚠️ **Single Instance**: No high availability or auto-scaling
- ⚠️ **Basic Security**: Open ports for demo purposes
- ⚠️ **Limited Resources**: 1 vCPU, 1GB RAM (t2.micro)
- ⚠️ **No SSL**: HTTP only (suitable for demos)
- ⚠️ **No Backups**: Basic EBS storage without snapshots

### Free Tier Limits
- ⏰ **750 hours/month**: Covers 1 instance running 24/7
- 💾 **30 GB EBS**: Shared across all volumes
- 📊 **5 GB CloudWatch**: Logs and metrics
- 🌐 **15 GB Transfer**: Outbound data transfer

### Production Considerations
For production use, consider:
- Multiple availability zones
- Application load balancer
- RDS for data persistence
- Auto-scaling groups
- SSL certificates
- VPC with private subnets
- Regular backups

## 📈 **Scaling Beyond Free Tier**

When ready for production, you can:

1. **Upgrade to larger EC2 instances**:
   - Switch from t2.micro to t3.small or larger
   - Add more instances behind a load balancer

2. **Migrate to managed services**:
   - Amazon OpenSearch for search
   - RDS for application data
   - ElastiCache for caching
   - CloudFront for CDN

3. **Use container orchestration**:
   - Deploy with AWS ECS or EKS
   - Implement auto-scaling policies

## 🗑️ **Cleanup**

### Delete Demo Resources
```bash
# Delete CloudFormation stack
aws cloudformation delete-stack \
  --stack-name apollo-search-demo-free-tier \
  --region us-east-1

# Delete SSH key pair
aws ec2 delete-key-pair \
  --key-name apollo-demo-key \
  --region us-east-1

# Remove local key file
rm -f apollo-demo-key.pem
```

### Automated Cleanup Script
```bash
# Clean up everything
./scripts/cleanup-demo.sh
```

## 🆘 **Troubleshooting**

### Common Issues

**Services won't start**
```bash
# Check Docker status
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker

# Restart Apollo services
sudo systemctl restart apollo-search
```

**Can't access from browser**
- Check security group allows inbound traffic
- Verify instance has public IP
- Wait 2-3 minutes for services to start

**Out of disk space**
```bash
# Check disk usage
df -h

# Clean up Docker
sudo docker system prune -f

# Clean up logs
sudo truncate -s 0 /var/log/messages
```

**Instance stopped unexpectedly**
- Check if you exceeded free tier limits
- Verify instance type is t2.micro
- Check CloudWatch for system events

### Get Help
- Check AWS Free Tier usage: [AWS Console → Billing → Free Tier](https://console.aws.amazon.com/billing/home#/freetier)
- Review CloudFormation events: [AWS Console → CloudFormation](https://console.aws.amazon.com/cloudformation)
- Monitor CloudWatch logs: [AWS Console → CloudWatch → Logs](https://console.aws.amazon.com/cloudwatch/home#logs:)

## 🎉 **What's Next?**

1. **Explore the API**: Try all endpoints at `http://YOUR-IP:8001/docs`
2. **Test Search Features**: Use the UI to test faceted search, autocomplete, and analytics
3. **Load Your Data**: Replace demo data with your own product catalog
4. **Customize UI**: Modify the test UI for your specific use case
5. **Plan Production**: When ready, scale to larger instances or managed services

---

**🚀 Enjoy your FREE Apollo Search Backend demo!**

*Perfect for showcasing search capabilities, testing integrations, and learning modern search architecture.*
