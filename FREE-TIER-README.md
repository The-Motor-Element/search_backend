# 🚗 Multi-Brand Tire Search - FREE TIER Development

Deploy your multi-brand tire search backend on AWS **completely FREE** using AWS Free Tier resources!

## 💰 Cost: $0/month (First 12 months)

- **Instance**: t2.micro (750 hours/month FREE)
- **Storage**: 8GB EBS (30GB/month FREE)
- **Transfer**: 1GB outbound/month FREE
- **Total**: **$0** for development use

## 🚀 One-Command Deployment

```bash
# Quick deploy with your key pair
./deploy-free-tier.sh -k your-keypair-name

# Deploy with restricted access (recommended)
./deploy-free-tier.sh -k your-keypair-name -i
```

## 📋 Prerequisites

1. **AWS Account** with Free Tier eligibility
2. **AWS CLI** installed and configured
3. **EC2 Key Pair** created in your region

### Quick Setup
```bash
# Install AWS CLI (if needed)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Configure AWS credentials
aws configure

# Create key pair (if needed)
aws ec2 create-key-pair --key-name dev-keypair --query 'KeyMaterial' --output text > dev-keypair.pem
chmod 400 dev-keypair.pem
```

## 🏗️ What Gets Deployed

```
📦 AWS Free Tier Resources:
├── 🖥️  t2.micro EC2 instance (FREE)
├── 💾 8GB EBS storage (FREE)
├── 🌐 VPC with public subnet (FREE)
├── 🔒 Security group (FREE)
└── 🚀 Multi-brand tire search app

🔍 Application Stack:
├── 🖥️  UI on port 8080
├── 📡 FastAPI on port 8001
├── 🔍 MeiliSearch on port 7700
└── 📊 4,600+ tire products from 4 brands
```

## 📊 Multi-Brand Database

| Brand | Products | Categories |
|-------|----------|------------|
| **Apollo** | 1,500+ | Passenger, Commercial, Two-Wheeler |
| **CEAT** | 1,100+ | Farm, Industrial, BHL |
| **MRF** | 1,700+ | Radial, Rally, Farm |
| **Eurogrip** | 100+ | Agriculture, Forklift |
| **Total** | **4,600+** | All vehicle types |

## 🎯 Usage Examples

### Deploy
```bash
# Basic deployment
./deploy-free-tier.sh -k my-keypair

# Secure deployment (restrict to your IP)
./deploy-free-tier.sh -k my-keypair -i

# Custom stack name
./deploy-free-tier.sh -k my-keypair -s my-dev-environment
```

### Test
```bash
# Test your deployment
./test-free-tier.sh http://YOUR-EC2-IP

# Should output:
# 🧪 Testing Free Tier Deployment
# Testing UI... ✅
# Testing API Health... ✅
# Testing Search... ✅
# 🎉 All tests passed!
```

### Manage (on EC2)
```bash
# SSH to your instance
ssh -i your-keypair.pem ec2-user@YOUR-EC2-IP

# Use the management script
./manage.sh status    # Check service status
./manage.sh urls      # Show access URLs
./manage.sh logs      # View application logs
./manage.sh restart   # Restart services
./manage.sh data      # Reload tire data
```

## 🔍 Sample Searches

Once deployed, try these searches in the UI:

```bash
# Via UI (http://YOUR-IP:8080)
"apollo"           # Apollo brand tires
"175/70R13"        # Specific tire size
"radial"           # Construction type
"farm"             # Agricultural tires

# Via API (http://YOUR-IP:8001/docs)
curl "http://YOUR-IP:8001/search?q=apollo&limit=5"
curl "http://YOUR-IP:8001/search?q=tire&filters=brand=CEAT"
curl "http://YOUR-IP:8001/search/filters/brands"
```

## 🛠️ Development Workflow

```bash
# 1. Deploy
./deploy-free-tier.sh -k my-keypair -i

# 2. Get your URLs (saved to dev-deployment.txt)
cat dev-deployment.txt

# 3. Test
./test-free-tier.sh http://YOUR-EC2-IP

# 4. Develop
# Edit code locally, then:
git push
# SSH to EC2 and:
cd /opt/tire-search
git pull
./manage.sh restart

# 5. Clean up when done
aws cloudformation delete-stack --stack-name tire-search-dev-USERNAME
```

## 🔒 Security

### Default Security Group
- **Port 22**: SSH (your IP or 0.0.0.0/0)
- **Port 8080**: UI (public access)
- **Port 8001**: API (public access)
- **Port 7700**: MeiliSearch admin (public access)

### Recommended: Restrict Access
```bash
# Deploy with IP restriction
./deploy-free-tier.sh -k keypair -i

# Or update security group after deployment
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 7700 \
  --cidr $(curl -s ifconfig.me)/32
```

## 🐛 Troubleshooting

### Services not starting?
```bash
# SSH to instance
ssh -i keypair.pem ec2-user@YOUR-IP

# Check services
./manage.sh status

# View logs
./manage.sh logs

# Restart if needed
./manage.sh restart
```

### Can't access the application?
```bash
# Check security groups in AWS Console
# Verify your IP hasn't changed
curl ifconfig.me

# Test from instance itself
curl http://localhost:8080
```

### Data not loading?
```bash
# Reload data manually
./manage.sh data

# Or via SSH:
cd /opt/tire-search
sudo docker-compose exec api python scripts/load_all_tire_data.py
```

## 📈 Scaling Up

When you outgrow free tier:

```bash
# Use the full production template
./deploy-aws.sh -s production-stack -k keypair -e production -i t3.medium
```

## 🧹 Cleanup

```bash
# Delete the stack when done
aws cloudformation delete-stack --stack-name tire-search-dev-USERNAME

# Verify deletion
aws cloudformation describe-stacks --stack-name tire-search-dev-USERNAME
# Should show: "does not exist"
```

## 📚 Files Overview

- `cloudformation-free-tier.yml` - Simplified CloudFormation template
- `deploy-free-tier.sh` - One-command deployment script  
- `test-free-tier.sh` - Simple validation script
- `dev-deployment.txt` - Generated deployment info

## 🎉 Ready to Deploy?

```bash
# Just run this with your key pair:
./deploy-free-tier.sh -k your-keypair-name -i

# Wait 5-8 minutes, then access your URLs!
```

**Perfect for**: Development, learning, demos, POCs, testing
**Cost**: $0/month (AWS Free Tier)
**Effort**: One command deployment
**Result**: Full-featured multi-brand tire search in the cloud! 🚗🔍
