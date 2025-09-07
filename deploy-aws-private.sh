#!/bin/bash

# Deploy Apollo Search Backend to AWS with Private Repo Support
# This script handles deployment using pre-built Docker images

set -e

echo "🚀 Apollo Search Backend - AWS Deployment with Private Repo Support"
echo "================================================================="

# Configuration
STACK_NAME="apollo-search-private"
TEMPLATE_FILE="aws/cloudformation-private-repo.yml"

# Check if required files exist
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "❌ Error: CloudFormation template not found: $TEMPLATE_FILE"
    exit 1
fi

# Function to get user input with default
get_input() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " value
        if [ -z "$value" ]; then
            value="$default"
        fi
    else
        read -p "$prompt: " value
        while [ -z "$value" ]; do
            echo "This field is required."
            read -p "$prompt: " value
        done
    fi
    
    eval "$var_name=\"$value\""
}

echo
echo "📋 Deployment Configuration"
echo "=============================="

# Get deployment parameters
get_input "Project Name" "apollo-search-demo" PROJECT_NAME
get_input "AWS Region" "us-east-1" AWS_REGION
get_input "EC2 Key Pair Name (for SSH access)" "" KEY_PAIR_NAME
get_input "MeiliSearch Master Key" "demo-key-change-in-production" MEILI_KEY
get_input "GitHub Personal Access Token (for private images)" "" GITHUB_TOKEN

echo
echo "📝 Deployment Summary"
echo "===================="
echo "Stack Name: $STACK_NAME"
echo "Project Name: $PROJECT_NAME"
echo "AWS Region: $AWS_REGION"
echo "Key Pair: $KEY_PAIR_NAME"
echo "Template: $TEMPLATE_FILE"
echo

# Confirm deployment
read -p "Do you want to proceed with deployment? (y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo
echo "🏗️  Deploying CloudFormation Stack..."
echo "======================================"

# Deploy CloudFormation stack
aws cloudformation deploy \
    --template-file "$TEMPLATE_FILE" \
    --stack-name "$STACK_NAME" \
    --parameter-overrides \
        ProjectName="$PROJECT_NAME" \
        KeyPairName="$KEY_PAIR_NAME" \
        MeiliMasterKey="$MEILI_KEY" \
        GitHubToken="$GITHUB_TOKEN" \
    --region "$AWS_REGION" \
    --no-fail-on-empty-changeset

if [ $? -eq 0 ]; then
    echo
    echo "✅ Deployment completed successfully!"
    echo
    echo "🔍 Getting deployment information..."
    
    # Get stack outputs
    OUTPUTS=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query 'Stacks[0].Outputs' \
        --output table)
    
    echo
    echo "📊 Deployment Details"
    echo "===================="
    echo "$OUTPUTS"
    
    # Extract specific URLs
    PUBLIC_IP=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`PublicIP`].OutputValue' \
        --output text)
    
    INSTANCE_ID=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`InstanceId`].OutputValue' \
        --output text)
    
    echo
    echo "🌐 Quick Access URLs"
    echo "==================="
    echo "🖥️  UI:           http://$PUBLIC_IP:8080"
    echo "📡 API Docs:      http://$PUBLIC_IP:8001/docs"
    echo "🔍 MeiliSearch:   http://$PUBLIC_IP:7700"
    echo
    echo "🔧 Management"
    echo "============="
    echo "SSH: ssh -i $KEY_PAIR_NAME.pem ec2-user@$PUBLIC_IP"
    echo "Instance ID: $INSTANCE_ID"
    echo
    echo "⏱️  Note: The instance may take 5-10 minutes to fully initialize."
    echo "   Use SSH to check deployment status: tail -f /var/log/user-data.log"
    echo
    echo "💰 Cost: FREE for first 12 months (AWS Free Tier)"
    
else
    echo
    echo "❌ Deployment failed!"
    echo "Check the CloudFormation console for details:"
    echo "https://console.aws.amazon.com/cloudformation/home?region=$AWS_REGION"
    exit 1
fi
