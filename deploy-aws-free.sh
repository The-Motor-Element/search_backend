#!/bin/bash

# AWS Free Tier Demo Deployment Script for Apollo Search Backend
set -e

# Configuration
PROJECT_NAME="apollo-search-demo"
AWS_REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="${PROJECT_NAME}-free-tier"
KEY_PAIR_NAME="${KEY_PAIR_NAME:-apollo-demo-key}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Apollo Search Backend - FREE TIER Demo Deployment${NC}"
echo "======================================================"
echo -e "${GREEN}💰 This deployment uses AWS FREE TIER resources only!${NC}"
echo -e "${GREEN}💰 Estimated cost: \$0.00 for first 12 months${NC}"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI first.${NC}"
    echo "   Installation: pip install awscli"
    exit 1
fi

# Check if logged in to AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Not logged in to AWS. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${BLUE}📋 AWS Account ID: ${ACCOUNT_ID}${NC}"
echo -e "${BLUE}📍 Region: ${AWS_REGION}${NC}"

# Function to create SSH key pair if it doesn't exist
create_key_pair() {
    echo -e "${YELLOW}🔑 Checking SSH key pair...${NC}"
    
    if aws ec2 describe-key-pairs --key-names $KEY_PAIR_NAME --region $AWS_REGION &> /dev/null; then
        echo -e "${GREEN}✅ SSH key pair '$KEY_PAIR_NAME' already exists${NC}"
    else
        echo -e "${BLUE}🆕 Creating SSH key pair '$KEY_PAIR_NAME'...${NC}"
        aws ec2 create-key-pair \
            --key-name $KEY_PAIR_NAME \
            --region $AWS_REGION \
            --query 'KeyMaterial' \
            --output text > ./${KEY_PAIR_NAME}.pem
        
        if [ $? -eq 0 ]; then
            chmod 400 ./${KEY_PAIR_NAME}.pem
            echo -e "${GREEN}✅ SSH key pair created: ${KEY_PAIR_NAME}.pem${NC}"
            echo -e "${YELLOW}⚠️  Keep this file safe! You'll need it to SSH into your instance.${NC}"
        else
            echo -e "${RED}❌ Failed to create SSH key pair${NC}"
            exit 1
        fi
    fi
}

# Function to wait for stack completion
wait_for_stack() {
    local stack_name=$1
    local operation=$2
    
    echo -e "${YELLOW}⏳ Waiting for stack ${operation} to complete...${NC}"
    echo -e "${CYAN}   This may take 3-5 minutes...${NC}"
    
    aws cloudformation wait stack-${operation}-complete --stack-name $stack_name --region $AWS_REGION
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Stack ${operation} completed successfully${NC}"
    else
        echo -e "${RED}❌ Stack ${operation} failed${NC}"
        echo -e "${YELLOW}💡 Check CloudFormation console for details: https://console.aws.amazon.com/cloudformation${NC}"
        exit 1
    fi
}

# Function to deploy free tier infrastructure
deploy_free_tier() {
    echo -e "${YELLOW}🏗️  Deploying FREE TIER infrastructure...${NC}"
    echo -e "${CYAN}   Resources: t2.micro EC2, VPC, Security Groups, CloudWatch${NC}"
    
    # Set default master key if not provided
    if [ -z "$MEILI_MASTER_KEY" ]; then
        MEILI_MASTER_KEY="demo-key-$(openssl rand -hex 8)"
        echo -e "${BLUE}🔑 Generated demo master key: $MEILI_MASTER_KEY${NC}"
    fi
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION &> /dev/null; then
        echo -e "${BLUE}📝 Updating existing stack...${NC}"
        aws cloudformation update-stack \
            --stack-name $STACK_NAME \
            --template-body file://aws/cloudformation-free-tier-no-iam.yml \
            --parameters ParameterKey=ProjectName,ParameterValue=$PROJECT_NAME \
                        ParameterKey=MeiliMasterKey,ParameterValue=$MEILI_MASTER_KEY \
                        ParameterKey=KeyPairName,ParameterValue=$KEY_PAIR_NAME \
            --region $AWS_REGION
        
        wait_for_stack $STACK_NAME "update"
    else
        echo -e "${BLUE}🆕 Creating new stack...${NC}"
        aws cloudformation create-stack \
            --stack-name $STACK_NAME \
            --template-body file://aws/cloudformation-free-tier-no-iam.yml \
            --parameters ParameterKey=ProjectName,ParameterValue=$PROJECT_NAME \
                        ParameterKey=MeiliMasterKey,ParameterValue=$MEILI_MASTER_KEY \
                        ParameterKey=KeyPairName,ParameterValue=$KEY_PAIR_NAME \
            --region $AWS_REGION
        
        wait_for_stack $STACK_NAME "create"
    fi
}

# Function to display connection information
show_connection_info() {
    echo -e "${YELLOW}📊 Getting deployment information...${NC}"
    
    # Get stack outputs
    PUBLIC_IP=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='PublicIP'].OutputValue" --output text)
    UI_URL=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='UIUrl'].OutputValue" --output text)
    API_URL=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='APIUrl'].OutputValue" --output text)
    SSH_COMMAND=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='SSHCommand'].OutputValue" --output text)
    
    echo ""
    echo -e "${GREEN}🎉 FREE TIER Demo Deployment Completed!${NC}"
    echo -e "${GREEN}💰 Monthly Cost: \$0.00 (Free Tier - first 12 months)${NC}"
    echo ""
    echo -e "${BLUE}🌐 Access Your Application:${NC}"
    echo -e "   📱 Search UI:       ${UI_URL}"
    echo -e "   📚 API Docs:        ${API_URL}"
    echo -e "   🔍 Meilisearch:     http://${PUBLIC_IP}:7700"
    echo ""
    echo -e "${BLUE}🔧 Server Management:${NC}"
    echo -e "   🖥️  SSH Access:      ${SSH_COMMAND}"
    echo -e "   📁 Project Dir:     /opt/apollo-search"
    echo -e "   📋 Instance IP:     ${PUBLIC_IP}"
    echo ""
    echo -e "${YELLOW}⏳ Please wait 2-3 minutes for services to fully start up${NC}"
    echo ""
    echo -e "${CYAN}📝 To load demo data:${NC}"
    echo "   1. SSH into the instance: ${SSH_COMMAND}"
    echo "   2. cd /opt/apollo-search"
    echo "   3. sudo docker-compose exec api python scripts/docker_load_data.py"
    echo ""
    echo -e "${CYAN}🛠️  Service Management Commands:${NC}"
    echo "   • Start:    sudo systemctl start apollo-search"
    echo "   • Stop:     sudo systemctl stop apollo-search"
    echo "   • Restart:  sudo systemctl restart apollo-search"
    echo "   • Logs:     sudo docker-compose -f /opt/apollo-search/docker-compose.yml logs -f"
    echo ""
    echo -e "${YELLOW}⚠️  Demo Limitations:${NC}"
    echo "   • Single t2.micro instance (1 vCPU, 1GB RAM)"
    echo "   • No auto-scaling or load balancing"
    echo "   • Basic monitoring with CloudWatch"
    echo "   • Suitable for testing and demos only"
    echo ""
}

# Function to cleanup
cleanup() {
    echo -e "${YELLOW}🗑️  To delete this demo deployment later:${NC}"
    echo "   aws cloudformation delete-stack --stack-name $STACK_NAME --region $AWS_REGION"
    echo "   aws ec2 delete-key-pair --key-name $KEY_PAIR_NAME --region $AWS_REGION"
    echo "   rm -f ${KEY_PAIR_NAME}.pem"
}

# Main deployment flow
main() {
    echo -e "${BLUE}🎯 Demo Deployment Configuration:${NC}"
    echo -e "   Project: $PROJECT_NAME"
    echo -e "   Region: $AWS_REGION"
    echo -e "   Account: $ACCOUNT_ID"
    echo -e "   SSH Key: $KEY_PAIR_NAME"
    echo ""
    
    # Confirm deployment
    echo -e "${YELLOW}🤔 This will create FREE TIER AWS resources. Continue? (y/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}👋 Deployment cancelled${NC}"
        exit 0
    fi
    
    # Run deployment steps
    create_key_pair
    deploy_free_tier
    show_connection_info
    cleanup
    
    echo -e "${GREEN}🚀 Enjoy your FREE Apollo Search Backend demo!${NC}"
}

# Run main function
main "$@"
