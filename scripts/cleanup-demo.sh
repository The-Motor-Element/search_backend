#!/bin/bash

# Cleanup script for Apollo Search Backend AWS Free Tier Demo
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
NC='\033[0m' # No Color

echo -e "${BLUE}🗑️  Apollo Search Backend - Demo Cleanup${NC}"
echo "============================================="

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found.${NC}"
    exit 1
fi

# Check if logged in to AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Not logged in to AWS.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${BLUE}📋 AWS Account ID: ${ACCOUNT_ID}${NC}"
echo -e "${BLUE}📍 Region: ${AWS_REGION}${NC}"

# Confirm cleanup
echo ""
echo -e "${YELLOW}⚠️  This will DELETE the following resources:${NC}"
echo "   • CloudFormation Stack: $STACK_NAME"
echo "   • EC2 Instance and all data"
echo "   • VPC and networking components"
echo "   • Security Groups"
echo "   • CloudWatch Log Groups"
echo "   • SSH Key Pair: $KEY_PAIR_NAME"
echo ""
echo -e "${RED}⚠️  All data will be permanently lost!${NC}"
echo -e "${YELLOW}🤔 Are you sure you want to continue? (type 'yes' to confirm)${NC}"
read -r response

if [[ "$response" != "yes" ]]; then
    echo -e "${BLUE}👋 Cleanup cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🗑️  Starting cleanup process...${NC}"

# Function to delete CloudFormation stack
delete_stack() {
    echo -e "${BLUE}📋 Checking CloudFormation stack...${NC}"
    
    if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION &> /dev/null; then
        echo -e "${YELLOW}🗑️  Deleting CloudFormation stack: $STACK_NAME${NC}"
        
        aws cloudformation delete-stack \
            --stack-name $STACK_NAME \
            --region $AWS_REGION
        
        echo -e "${YELLOW}⏳ Waiting for stack deletion to complete...${NC}"
        echo -e "${CYAN}   This may take 3-5 minutes...${NC}"
        
        aws cloudformation wait stack-delete-complete \
            --stack-name $STACK_NAME \
            --region $AWS_REGION
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ CloudFormation stack deleted successfully${NC}"
        else
            echo -e "${RED}❌ Stack deletion failed or timed out${NC}"
            echo -e "${YELLOW}💡 Check CloudFormation console for details${NC}"
        fi
    else
        echo -e "${BLUE}ℹ️  CloudFormation stack not found (may already be deleted)${NC}"
    fi
}

# Function to delete SSH key pair
delete_key_pair() {
    echo -e "${BLUE}🔑 Checking SSH key pair...${NC}"
    
    if aws ec2 describe-key-pairs --key-names $KEY_PAIR_NAME --region $AWS_REGION &> /dev/null; then
        echo -e "${YELLOW}🗑️  Deleting SSH key pair: $KEY_PAIR_NAME${NC}"
        
        aws ec2 delete-key-pair \
            --key-name $KEY_PAIR_NAME \
            --region $AWS_REGION
        
        echo -e "${GREEN}✅ SSH key pair deleted from AWS${NC}"
    else
        echo -e "${BLUE}ℹ️  SSH key pair not found in AWS (may already be deleted)${NC}"
    fi
    
    # Remove local key file
    if [ -f "${KEY_PAIR_NAME}.pem" ]; then
        echo -e "${YELLOW}🗑️  Removing local SSH key file: ${KEY_PAIR_NAME}.pem${NC}"
        rm -f "${KEY_PAIR_NAME}.pem"
        echo -e "${GREEN}✅ Local SSH key file removed${NC}"
    else
        echo -e "${BLUE}ℹ️  Local SSH key file not found${NC}"
    fi
}

# Function to clean up any orphaned resources
cleanup_orphaned_resources() {
    echo -e "${BLUE}🔍 Checking for orphaned resources...${NC}"
    
    # Check for any EC2 instances with our tag
    INSTANCES=$(aws ec2 describe-instances \
        --filters "Name=tag:Name,Values=${PROJECT_NAME}-instance" "Name=instance-state-name,Values=running,stopped,stopping" \
        --query 'Reservations[*].Instances[*].InstanceId' \
        --output text \
        --region $AWS_REGION)
    
    if [ ! -z "$INSTANCES" ]; then
        echo -e "${YELLOW}⚠️  Found orphaned EC2 instances: $INSTANCES${NC}"
        echo -e "${YELLOW}🗑️  Terminating orphaned instances...${NC}"
        aws ec2 terminate-instances --instance-ids $INSTANCES --region $AWS_REGION
        echo -e "${GREEN}✅ Orphaned instances marked for termination${NC}"
    fi
    
    # Check for security groups
    SECURITY_GROUPS=$(aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=${PROJECT_NAME}-ec2-sg" \
        --query 'SecurityGroups[*].GroupId' \
        --output text \
        --region $AWS_REGION)
    
    if [ ! -z "$SECURITY_GROUPS" ]; then
        echo -e "${BLUE}ℹ️  Found security groups: $SECURITY_GROUPS${NC}"
        echo -e "${CYAN}   These will be cleaned up by CloudFormation${NC}"
    fi
}

# Main cleanup process
main() {
    delete_stack
    delete_key_pair
    cleanup_orphaned_resources
    
    echo ""
    echo -e "${GREEN}🎉 Cleanup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📊 Summary:${NC}"
    echo "   ✅ CloudFormation stack deleted"
    echo "   ✅ EC2 instance terminated"
    echo "   ✅ SSH key pair removed"
    echo "   ✅ Local files cleaned up"
    echo ""
    echo -e "${GREEN}💰 Your AWS account is now clean - no more charges!${NC}"
    echo ""
    echo -e "${YELLOW}💡 Tips:${NC}"
    echo "   • Check AWS Console to verify all resources are deleted"
    echo "   • Review your AWS billing dashboard"
    echo "   • Consider setting up billing alerts for future deployments"
    echo ""
    echo -e "${BLUE}🚀 To deploy again: ./deploy-aws-free.sh${NC}"
}

# Run cleanup
main "$@"
