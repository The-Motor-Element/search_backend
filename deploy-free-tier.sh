#!/bin/bash

# Multi-Brand Tire Search Backend - FREE TIER Development Deployment
# Simple, fast deployment for AWS Free Tier development

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
STACK_NAME=""
KEY_PAIR=""
REGION="us-east-1"
MY_IP=""

usage() {
    echo -e "${BLUE}Multi-Brand Tire Search - FREE TIER Deployment${NC}"
    echo -e "${BLUE}===============================================${NC}"
    echo ""
    echo "Usage: $0 -k KEY_PAIR_NAME [-s STACK_NAME] [-r REGION]"
    echo ""
    echo "Required:"
    echo "  -k, --key-pair NAME    Your EC2 Key Pair name"
    echo ""
    echo "Optional:"
    echo "  -s, --stack NAME       Stack name [default: tire-search-dev-USERNAME]"
    echo "  -r, --region REGION    AWS region [default: us-east-1]"
    echo "  -i, --my-ip            Restrict access to your IP only"
    echo "  -h, --help             Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 -k my-keypair                    # Deploy with default settings"
    echo "  $0 -k my-keypair -s my-dev-stack    # Custom stack name"
    echo "  $0 -k my-keypair -i                 # Restrict to your IP only"
    echo ""
    echo "💡 This uses AWS Free Tier resources (t2.micro, 8GB storage)"
    echo "💰 Cost: \$0/month for first 12 months!"
    echo ""
}

# Get current username for default stack name
get_username() {
    whoami | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g'
}

# Auto-detect user's IP
get_my_ip() {
    echo "🔍 Detecting your IP..."
    MY_IP=$(curl -s --max-time 5 ifconfig.me || curl -s --max-time 5 ipinfo.io/ip || echo "")
    if [ -n "$MY_IP" ]; then
        echo -e "${GREEN}✅ Your IP: $MY_IP${NC}"
        echo "$MY_IP/32"
    else
        echo -e "${YELLOW}⚠️ Could not detect IP, using 0.0.0.0/0${NC}"
        echo "0.0.0.0/0"
    fi
}

# Validate AWS setup
validate_aws() {
    echo "🔧 Validating AWS setup..."
    
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI not found${NC}"
        echo "Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS not configured${NC}"
        echo "Run: aws configure"
        exit 1
    fi
    
    echo -e "${GREEN}✅ AWS CLI ready${NC}"
}

# Validate key pair
validate_keypair() {
    echo "🔑 Validating key pair: $KEY_PAIR"
    
    if ! aws ec2 describe-key-pairs --key-names "$KEY_PAIR" --region "$REGION" &> /dev/null; then
        echo -e "${RED}❌ Key pair '$KEY_PAIR' not found in $REGION${NC}"
        echo -e "${YELLOW}Available key pairs:${NC}"
        aws ec2 describe-key-pairs --region "$REGION" --query 'KeyPairs[].KeyName' --output table
        exit 1
    fi
    
    echo -e "${GREEN}✅ Key pair found${NC}"
}

# Deploy stack
deploy() {
    echo -e "${BLUE}🚀 Deploying Free Tier Development Environment${NC}"
    echo "=================================="
    echo "Stack: $STACK_NAME"
    echo "Region: $REGION"
    echo "Instance: t2.micro (FREE)"
    echo "Storage: 8GB (FREE)"
    echo "Key Pair: $KEY_PAIR"
    echo "Access: $ALLOWED_IP"
    echo ""
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" &> /dev/null; then
        echo -e "${YELLOW}📦 Stack exists, updating...${NC}"
        OPERATION="update-stack"
    else
        echo -e "${GREEN}📦 Creating new stack...${NC}"
        OPERATION="create-stack"
    fi
    
    # Deploy
    echo -e "${YELLOW}⏳ Starting deployment...${NC}"
    
    aws cloudformation $OPERATION \
        --stack-name "$STACK_NAME" \
        --template-body file://cloudformation-free-tier.yml \
        --parameters \
            ParameterKey=KeyPairName,ParameterValue="$KEY_PAIR" \
            ParameterKey=AllowedIPRange,ParameterValue="$ALLOWED_IP" \
        --region "$REGION" \
        --tags \
            Key=Environment,Value=development \
            Key=CostCenter,Value=free-tier \
            Key=Owner,Value="$(whoami)" \
        || {
            echo -e "${RED}❌ Deployment failed${NC}"
            exit 1
        }
    
    echo -e "${GREEN}✅ Deployment started${NC}"
    
    # Wait for completion
    echo -e "${YELLOW}⏳ Waiting for deployment (5-8 minutes)...${NC}"
    echo -e "${BLUE}💡 Perfect time for a coffee break! ☕${NC}"
    
    if [ "$OPERATION" = "create-stack" ]; then
        WAIT_CONDITION="stack-create-complete"
    else
        WAIT_CONDITION="stack-update-complete"
    fi
    
    aws cloudformation wait $WAIT_CONDITION \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        || {
            echo -e "${RED}❌ Deployment failed${NC}"
            echo "Check AWS Console: https://console.aws.amazon.com/cloudformation"
            exit 1
        }
    
    echo -e "${GREEN}🎉 Deployment completed!${NC}"
}

# Show results
show_results() {
    echo -e "${BLUE}📋 Your Free Tier Development Environment${NC}"
    echo "========================================"
    
    # Get outputs
    PUBLIC_IP=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`PublicIP`].OutputValue' \
        --output text)
    
    UI_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`UIUrl`].OutputValue' \
        --output text)
    
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`APIUrl`].OutputValue' \
        --output text)
    
    ADMIN_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`AdminUrl`].OutputValue' \
        --output text)
    
    SSH_CMD=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`SSHCommand`].OutputValue' \
        --output text)
    
    echo ""
    echo -e "${GREEN}🌐 Access URLs:${NC}"
    echo "   UI:    $UI_URL"
    echo "   API:   $API_URL"
    echo "   Admin: $ADMIN_URL"
    echo ""
    echo -e "${GREEN}🔧 Management:${NC}"
    echo "   SSH:   $SSH_CMD"
    echo "   IP:    $PUBLIC_IP"
    echo ""
    
    # Save info
    cat > dev-deployment.txt << EOF
Multi-Brand Tire Search - FREE TIER Development
==============================================

Access URLs:
- UI: $UI_URL
- API: $API_URL
- Admin: $ADMIN_URL

Management:
- SSH: $SSH_CMD
- IP: $PUBLIC_IP

On the server, use:
./manage.sh status    # Check services
./manage.sh urls      # Show URLs
./manage.sh logs      # View logs
./manage.sh restart   # Restart services

Stack: $STACK_NAME
Region: $REGION
Deployed: $(date)
Cost: FREE TIER (\$0/month)
EOF
    
    echo -e "${GREEN}📄 Info saved to: dev-deployment.txt${NC}"
    
    # Wait for services
    echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
    echo -e "${BLUE}💡 The instance is loading data (2-3 minutes)${NC}"
    
    for i in {1..15}; do
        if curl -f -s "$UI_URL" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Services are ready!${NC}"
            break
        else
            echo -n "."
            sleep 10
        fi
    done
    echo ""
    
    echo -e "${GREEN}🎉 Your FREE TIER development environment is ready!${NC}"
    echo ""
    echo -e "${BLUE}📊 Multi-Brand Database:${NC}"
    echo "   • Apollo: 1,500+ products"
    echo "   • CEAT: 1,100+ products"
    echo "   • MRF: 1,700+ products"
    echo "   • Eurogrip: 100+ products"
    echo "   • Total: 4,600+ tire products"
    echo ""
    echo -e "${BLUE}💡 Try these searches:${NC}"
    echo "   • Search 'apollo' for Apollo tires"
    echo "   • Search '175/70R13' for specific size"
    echo "   • Search 'radial' for construction type"
    echo ""
    echo -e "${YELLOW}💰 Cost: \$0/month (AWS Free Tier)${NC}"
    echo -e "${GREEN}Happy developing! 🚗🔍${NC}"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -k|--key-pair)
            KEY_PAIR="$2"
            shift 2
            ;;
        -s|--stack)
            STACK_NAME="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -i|--my-ip)
            RESTRICT_IP=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$KEY_PAIR" ]; then
    echo -e "${RED}❌ Key pair is required${NC}"
    usage
    exit 1
fi

# Set defaults
if [ -z "$STACK_NAME" ]; then
    USERNAME=$(get_username)
    STACK_NAME="tire-search-dev-$USERNAME"
fi

# Handle IP restriction
if [ "$RESTRICT_IP" = true ]; then
    ALLOWED_IP=$(get_my_ip)
else
    ALLOWED_IP="0.0.0.0/0"
    echo -e "${YELLOW}⚠️ Using 0.0.0.0/0 (public access)${NC}"
fi

echo -e "${BLUE}🚗 Multi-Brand Tire Search - FREE TIER Deployment${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""

# Run deployment
validate_aws
validate_keypair
deploy
show_results
