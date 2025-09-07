# AWS ECS Deployment Guide - Apollo Search Backend

This guide walks you through deploying the Apollo Search Backend to AWS using ECS Fargate, Application Load Balancer, and supporting infrastructure.

## 🏗️ Architecture Overview

The deployment creates:
- **VPC** with public/private subnets across 2 AZs
- **ECS Fargate Cluster** for container orchestration
- **Application Load Balancer** for traffic routing
- **ECR Repositories** for Docker images
- **EFS Storage** for Meilisearch data persistence
- **CloudWatch Logs** for monitoring
- **Security Groups** for network access control

## 📋 Prerequisites

### 1. AWS CLI Configuration
```bash
# Install AWS CLI
pip install awscli

# Configure with your credentials
aws configure
```

### 2. Docker
```bash
# Install Docker Desktop or Docker Engine
# Ensure Docker daemon is running
docker --version
```

### 3. Environment Variables
```bash
export MEILI_MASTER_KEY="your-secure-master-key-16-chars-min"
export AWS_REGION="us-east-1"  # Optional, defaults to us-east-1
export ENVIRONMENT="production"  # Optional, defaults to production
```

## 🚀 Quick Deployment

### One-Command Deployment
```bash
# Set your Meilisearch master key
export MEILI_MASTER_KEY="your-secure-master-key-here"

# Run the deployment script
./deploy-aws.sh
```

This script will:
1. ✅ Deploy AWS infrastructure via CloudFormation
2. 🐳 Build and push Docker images to ECR
3. 🚀 Deploy ECS services with load balancing
4. 🌐 Provide you with the application URL

## 📝 Manual Step-by-Step Deployment

### Step 1: Deploy Infrastructure
```bash
# Create the CloudFormation stack
aws cloudformation create-stack \
  --stack-name apollo-search-infrastructure \
  --template-body file://aws/cloudformation-infrastructure.yml \
  --parameters ParameterKey=ProjectName,ParameterValue=apollo-search \
               ParameterKey=Environment,ParameterValue=production \
               ParameterKey=MeiliMasterKey,ParameterValue=$MEILI_MASTER_KEY \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name apollo-search-infrastructure \
  --region us-east-1
```

### Step 2: Build and Push Docker Images
```bash
# Get your AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push API image
docker build -f Dockerfile.api -t $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/apollo-search-api:latest .
docker push $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/apollo-search-api:latest

# Build and push UI image
docker build -f Dockerfile.ui -t $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/apollo-search-ui:latest .
docker push $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/apollo-search-ui:latest
```

### Step 3: Deploy ECS Services
```bash
# Register task definitions and create services
# (This is complex - use the deployment script instead)
./deploy-aws.sh
```

## 🔧 Configuration

### Environment Variables for ECS Tasks

**Meilisearch Service:**
- `MEILI_MASTER_KEY`: Your secure master key
- `MEILI_ENV`: production
- `MEILI_HTTP_ADDR`: 0.0.0.0:7700

**API Service:**
- `MEILI_URL`: http://meilisearch:7700
- `MEILI_MASTER_KEY`: Your secure master key
- `PRODUCTS_INDEX`: products
- `PYTHONPATH`: /app

**UI Service:**
- `HOST`: 0.0.0.0
- `API_URL`: http://your-alb-endpoint

### Resource Allocation

**Meilisearch:**
- CPU: 512 (0.5 vCPU)
- Memory: 1024 MB
- Storage: EFS for persistence

**API Service:**
- CPU: 512 (0.5 vCPU)
- Memory: 1024 MB

**UI Service:**
- CPU: 256 (0.25 vCPU)
- Memory: 512 MB

## 🌐 Load Balancer Configuration

The Application Load Balancer routes traffic:

- **UI**: `/*` → UI Service (port 8080)
- **API**: `/api/*`, `/docs*`, `/health` → API Service (port 8001)

## 💾 Data Persistence

Meilisearch data is persisted using **Amazon EFS** (Elastic File System):
- Mounted at `/meili_data` in the Meilisearch container
- Shared across container restarts and deployments
- Automatic backups available

## 📊 Monitoring

### CloudWatch Logs
- `/ecs/apollo-search-api` - API service logs
- `/ecs/apollo-search-ui` - UI service logs  
- `/ecs/meilisearch` - Meilisearch logs

### Health Checks
- **API**: `GET /health` every 30 seconds
- **UI**: `GET /` every 30 seconds
- **Meilisearch**: `GET /health` every 30 seconds

### ECS Container Insights
Enabled by default for cluster-level monitoring.

## 🔒 Security

### Network Security
- **Public Subnets**: Load balancer only
- **Private Subnets**: All ECS tasks
- **Security Groups**: Restrict access between services
- **NAT Gateways**: Internet access for private subnets

### IAM Roles
- **Task Execution Role**: ECR and CloudWatch access
- **Task Role**: EFS access for Meilisearch

### ECR Security
- **Image Scanning**: Enabled on push
- **Lifecycle Policy**: Keep last 10 images

## 💰 Cost Optimization

### Fargate Pricing
- **API**: ~$15/month (0.5 vCPU, 1GB RAM)
- **UI**: ~$8/month (0.25 vCPU, 0.5GB RAM)
- **Meilisearch**: ~$15/month (0.5 vCPU, 1GB RAM)

### Additional Costs
- **Application Load Balancer**: ~$16/month
- **EFS Storage**: ~$0.30/GB/month
- **NAT Gateways**: ~$32/month (2 AZs)
- **CloudWatch Logs**: Minimal

**Total Estimated Cost: ~$86/month**

### Cost Savings
- Use **FARGATE_SPOT** for 70% savings (configured in cluster)
- Enable **EFS Intelligent Tiering** for storage savings
- Set **CloudWatch log retention** to 7 days

## 🔄 CI/CD with GitHub Actions

The included GitHub Actions workflow automatically:
1. Runs tests on pull requests
2. Builds and pushes images on main branch pushes
3. Updates ECS services with new images

### Required GitHub Secrets
```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key  
AWS_REGION=us-east-1
```

## 🚦 Scaling

### Auto Scaling (Optional)
```bash
# Enable auto scaling for API service
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/apollo-search-cluster/apollo-search-api-service \
  --min-capacity 1 \
  --max-capacity 10
```

### Manual Scaling
```bash
# Scale API service to 3 instances
aws ecs update-service \
  --cluster apollo-search-cluster \
  --service apollo-search-api-service \
  --desired-count 3
```

## 🛠️ Troubleshooting

### Common Issues

**Services Won't Start**
```bash
# Check service events
aws ecs describe-services --cluster apollo-search-cluster --services apollo-search-api-service

# Check task logs
aws logs get-log-events --log-group-name /ecs/apollo-search-api --log-stream-name <stream-name>
```

**Load Balancer Health Checks Failing**
```bash
# Check target group health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>

# Verify security group rules allow ALB → ECS communication
```

**Can't Push to ECR**
```bash
# Re-authenticate with ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

### Useful Commands

```bash
# Check all stack outputs
aws cloudformation describe-stacks --stack-name apollo-search-infrastructure

# View ECS service status
aws ecs describe-services --cluster apollo-search-cluster --services apollo-search-api-service

# Follow logs in real-time
aws logs tail /ecs/apollo-search-api --follow

# Force new deployment
aws ecs update-service --cluster apollo-search-cluster --service apollo-search-api-service --force-new-deployment
```

## 🗑️ Cleanup

### Delete Everything
```bash
# Delete the CloudFormation stack (this removes all resources)
aws cloudformation delete-stack --stack-name apollo-search-infrastructure

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name apollo-search-infrastructure

# Manually delete ECR images if needed
aws ecr batch-delete-image --repository-name apollo-search-api --image-ids imageTag=latest
aws ecr batch-delete-image --repository-name apollo-search-ui --image-ids imageTag=latest
```

## 📞 Support

For issues with this deployment:
1. Check the CloudFormation stack events
2. Review ECS service events and logs
3. Verify security group and networking configuration
4. Ensure Docker images are built and pushed correctly

The deployment script provides detailed logging to help diagnose issues.
