# Private Repository AWS Deployment Guide

This guide explains how to deploy your Apollo Search Backend to AWS when your repository is private.

## 🔒 Problem: Private Repository Access

When your GitHub repository is private, the AWS EC2 instance cannot directly clone the repository during deployment. The CloudFormation UserData script will fail when trying to access private code.

## 🔧 Solution: Container Registry Approach

Instead of cloning the repository on AWS, we:
1. Build Docker images in GitHub Actions
2. Push images to GitHub Container Registry (GHCR)  
3. Pull pre-built images on AWS deployment

## 📋 Prerequisites

### 1. GitHub Personal Access Token
Create a GitHub Personal Access Token with package permissions:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Set expiration and select scopes:
   - ✅ `read:packages` - Download packages from GitHub Container Registry
   - ✅ `write:packages` - Upload packages to GitHub Container Registry
4. Copy the token (you'll need it for deployment)

### 2. AWS Credentials and Key Pair
Make sure you have:
- AWS CLI configured with appropriate permissions
- EC2 Key Pair created for SSH access to instances

## 🚀 Deployment Methods

### Method 1: Automated GitHub Actions (Recommended)

This method automatically builds and deploys when you push to the main branch.

#### Setup Steps:

1. **Add GitHub Secrets** (Repository Settings → Secrets and variables → Actions):
   ```
   AWS_ACCESS_KEY_ID: Your AWS access key
   AWS_SECRET_ACCESS_KEY: Your AWS secret key
   AWS_REGION: us-east-1 (or your preferred region)
   KEY_PAIR_NAME: your-ec2-keypair-name
   MEILI_MASTER_KEY: your-meilisearch-master-key
   GITHUB_TOKEN: Your personal access token (for GHCR)
   ```

2. **Trigger Deployment**:
   ```bash
   git push origin main
   ```
   
   The GitHub Actions workflow will:
   - Run tests
   - Build Docker images
   - Push images to GHCR
   - Deploy to AWS using CloudFormation

3. **Monitor Progress**:
   - Check GitHub Actions tab for build status
   - Check AWS CloudFormation console for deployment status

### Method 2: Manual Deployment

Use this method for direct deployment control.

#### Setup Steps:

1. **Build and Push Images Manually**:
   ```bash
   # Login to GitHub Container Registry
   echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
   
   # Build and push API image
   docker buildx build --platform linux/amd64 \
     -f Dockerfile.api \
     -t ghcr.io/YOUR_USERNAME/apollo-search-api:latest \
     --push .
   
   # Build and push UI image
   docker buildx build --platform linux/amd64 \
     -f Dockerfile.ui \
     -t ghcr.io/YOUR_USERNAME/apollo-search-ui:latest \
     --push .
   ```

2. **Deploy to AWS**:
   ```bash
   ./deploy-aws-private.sh
   ```
   
   The script will prompt for:
   - Project name
   - AWS region  
   - EC2 key pair name
   - MeiliSearch master key
   - GitHub personal access token

## 📁 Key Files

### GitHub Actions Workflow
- `.github/workflows/deploy-free-tier.yml` - Complete CI/CD pipeline
- Automatically builds and pushes Docker images to GHCR
- Deploys to AWS using CloudFormation

### CloudFormation Templates
- `aws/cloudformation-private-repo.yml` - Uses pre-built images from GHCR
- No repository cloning required on AWS
- Includes comprehensive error handling and logging

### Deployment Scripts
- `deploy-aws-private.sh` - Interactive deployment script
- Handles CloudFormation deployment with private repo support

## 🛠️ Image Naming Convention

The system uses this naming pattern:
```
ghcr.io/YOUR_USERNAME/apollo-search-api:latest
ghcr.io/YOUR_USERNAME/apollo-search-ui:latest
```

Make sure your CloudFormation template matches your actual GitHub username.

## 🔍 Troubleshooting

### Image Pull Issues
If deployment fails with image pull errors:

1. **Check Image Visibility**:
   ```bash
   # List your packages
   gh api user/packages --jq '.[].name'
   
   # Make package public (if needed)
   gh api --method PATCH /user/packages/container/apollo-search-api \
     --field visibility=public
   ```

2. **Verify Token Permissions**:
   - Ensure your GitHub token has `read:packages` permission
   - Check token hasn't expired

3. **Check Image Names**:
   ```bash
   # List images in your registry
   docker images ghcr.io/YOUR_USERNAME/*
   ```

### SSH Access for Debugging
```bash
# Connect to instance
ssh -i your-keypair.pem ec2-user@INSTANCE_IP

# Check deployment logs
sudo tail -f /var/log/user-data.log

# Check container status
sudo docker ps

# Check service logs
sudo docker-compose -f /opt/apollo-search/docker-compose.yml logs -f
```

### Service Status
```bash
# Check systemd service
sudo systemctl status apollo-search

# Restart if needed
sudo systemctl restart apollo-search
```

## 💡 Benefits of This Approach

1. **Security**: No repository credentials needed on AWS
2. **Speed**: Pre-built images deploy faster than building from source  
3. **Reliability**: Consistent builds from CI environment
4. **Scalability**: Images can be reused across multiple deployments
5. **Version Control**: Tagged images provide deployment history

## 📊 Cost Considerations

- **GitHub Container Registry**: Free for public repositories, included in paid plans for private
- **AWS Free Tier**: Covers t2.micro instance for first 12 months
- **Data Transfer**: Minimal costs for image pulls

## 🔄 Updating Deployments

To update your deployment:
1. Push changes to main branch (triggers automatic rebuild/deploy)
2. Or manually build new images and run deployment script
3. CloudFormation will update the running stack with new images

## 🔐 Security Best Practices

1. **Rotate Tokens**: Regularly rotate GitHub Personal Access Tokens
2. **Minimal Permissions**: Only grant necessary permissions to tokens
3. **Environment Separation**: Use different tokens/keys for production
4. **Monitor Access**: Review package access logs regularly

This approach ensures your private repository stays secure while enabling reliable AWS deployments!
