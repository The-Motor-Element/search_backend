#!/bin/bash

# AWS ECS Deployment Script for Apollo Search Backend
set -e

# Configuration
PROJECT_NAME="apollo-search"
AWS_REGION="${AWS_REGION:-us-east-1}"
ENVIRONMENT="${ENVIRONMENT:-production}"
STACK_NAME="${PROJECT_NAME}-infrastructure"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Apollo Search Backend - AWS ECS Deployment${NC}"
echo "=================================================="

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI first.${NC}"
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

# Function to wait for stack completion
wait_for_stack() {
    local stack_name=$1
    local operation=$2
    
    echo -e "${YELLOW}⏳ Waiting for stack ${operation} to complete...${NC}"
    aws cloudformation wait stack-${operation}-complete --stack-name $stack_name --region $AWS_REGION
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Stack ${operation} completed successfully${NC}"
    else
        echo -e "${RED}❌ Stack ${operation} failed${NC}"
        exit 1
    fi
}

# Function to deploy infrastructure
deploy_infrastructure() {
    echo -e "${YELLOW}🏗️  Deploying infrastructure...${NC}"
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION &> /dev/null; then
        echo -e "${BLUE}📝 Updating existing stack...${NC}"
        aws cloudformation update-stack \
            --stack-name $STACK_NAME \
            --template-body file://aws/cloudformation-infrastructure.yml \
            --parameters ParameterKey=ProjectName,ParameterValue=$PROJECT_NAME \
                        ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
                        ParameterKey=MeiliMasterKey,ParameterValue=$MEILI_MASTER_KEY \
            --capabilities CAPABILITY_NAMED_IAM \
            --region $AWS_REGION
        
        wait_for_stack $STACK_NAME "update"
    else
        echo -e "${BLUE}🆕 Creating new stack...${NC}"
        aws cloudformation create-stack \
            --stack-name $STACK_NAME \
            --template-body file://aws/cloudformation-infrastructure.yml \
            --parameters ParameterKey=ProjectName,ParameterValue=$PROJECT_NAME \
                        ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
                        ParameterKey=MeiliMasterKey,ParameterValue=$MEILI_MASTER_KEY \
            --capabilities CAPABILITY_NAMED_IAM \
            --region $AWS_REGION
        
        wait_for_stack $STACK_NAME "create"
    fi
}

# Function to build and push Docker images
build_and_push_images() {
    echo -e "${YELLOW}🐳 Building and pushing Docker images...${NC}"
    
    # Get ECR login token
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Get ECR repository URIs
    ECR_API_URI=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='ECRRepositoryAPIURI'].OutputValue" --output text)
    ECR_UI_URI=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='ECRRepositoryUIURI'].OutputValue" --output text)
    
    echo -e "${BLUE}📦 Building API image...${NC}"
    docker build -f Dockerfile.api -t $ECR_API_URI:latest -t $ECR_API_URI:$(git rev-parse --short HEAD) .
    docker push $ECR_API_URI:latest
    docker push $ECR_API_URI:$(git rev-parse --short HEAD)
    
    echo -e "${BLUE}📦 Building UI image...${NC}"
    docker build -f Dockerfile.ui -t $ECR_UI_URI:latest -t $ECR_UI_URI:$(git rev-parse --short HEAD) .
    docker push $ECR_UI_URI:latest
    docker push $ECR_UI_URI:$(git rev-parse --short HEAD)
    
    echo -e "${GREEN}✅ Images pushed successfully${NC}"
}

# Function to deploy ECS services
deploy_ecs_services() {
    echo -e "${YELLOW}🚀 Deploying ECS services...${NC}"
    
    # Get stack outputs
    VPC_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='VPCId'].OutputValue" --output text)
    CLUSTER_NAME=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='ECSClusterName'].OutputValue" --output text)
    PRIVATE_SUBNETS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='PrivateSubnets'].OutputValue" --output text)
    SECURITY_GROUP=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='ECSSecurityGroupId'].OutputValue" --output text)
    EFS_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='EFSFileSystemId'].OutputValue" --output text)
    ECR_API_URI=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='ECRRepositoryAPIURI'].OutputValue" --output text)
    ECR_UI_URI=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='ECRRepositoryUIURI'].OutputValue" --output text)
    ALB_ENDPOINT=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='ALBEndpoint'].OutputValue" --output text)
    
    # Create task definitions with actual values
    sed "s/{{ACCOUNT_ID}}/$ACCOUNT_ID/g; s/{{AWS_REGION}}/$AWS_REGION/g; s/{{ECR_REGISTRY}}/$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/g; s/{{MEILI_MASTER_KEY}}/$MEILI_MASTER_KEY/g; s/{{EFS_FILE_SYSTEM_ID}}/$EFS_ID/g" aws/ecs-meilisearch-task-definition.json > /tmp/meilisearch-task-def.json
    
    sed "s/{{ACCOUNT_ID}}/$ACCOUNT_ID/g; s/{{AWS_REGION}}/$AWS_REGION/g; s/{{ECR_REGISTRY}}/$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/g; s/{{MEILI_MASTER_KEY}}/$MEILI_MASTER_KEY/g" aws/ecs-api-task-definition.json > /tmp/api-task-def.json
    
    sed "s/{{ACCOUNT_ID}}/$ACCOUNT_ID/g; s/{{AWS_REGION}}/$AWS_REGION/g; s/{{ECR_REGISTRY}}/$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/g; s|{{API_URL}}|http://$ALB_ENDPOINT|g" aws/ecs-ui-task-definition.json > /tmp/ui-task-def.json
    
    # Register task definitions
    echo -e "${BLUE}📝 Registering Meilisearch task definition...${NC}"
    aws ecs register-task-definition --cli-input-json file:///tmp/meilisearch-task-def.json --region $AWS_REGION
    
    echo -e "${BLUE}📝 Registering API task definition...${NC}"
    aws ecs register-task-definition --cli-input-json file:///tmp/api-task-def.json --region $AWS_REGION
    
    echo -e "${BLUE}📝 Registering UI task definition...${NC}"
    aws ecs register-task-definition --cli-input-json file:///tmp/ui-task-def.json --region $AWS_REGION
    
    # Create or update services
    create_or_update_service() {
        local service_name=$1
        local task_definition=$2
        local target_group_arn=$3
        local container_name=$4
        local container_port=$5
        
        if aws ecs describe-services --cluster $CLUSTER_NAME --services $service_name --region $AWS_REGION &> /dev/null; then
            echo -e "${BLUE}🔄 Updating service: $service_name${NC}"
            aws ecs update-service \
                --cluster $CLUSTER_NAME \
                --service $service_name \
                --task-definition $task_definition \
                --region $AWS_REGION
        else
            echo -e "${BLUE}🆕 Creating service: $service_name${NC}"
            aws ecs create-service \
                --cluster $CLUSTER_NAME \
                --service-name $service_name \
                --task-definition $task_definition \
                --desired-count 1 \
                --launch-type FARGATE \
                --network-configuration "awsvpcConfiguration={subnets=[$PRIVATE_SUBNETS],securityGroups=[$SECURITY_GROUP],assignPublicIp=DISABLED}" \
                --load-balancers targetGroupArn=$target_group_arn,containerName=$container_name,containerPort=$container_port \
                --region $AWS_REGION
        fi
    }
    
    # Get target group ARNs
    API_TARGET_GROUP=$(aws elbv2 describe-target-groups --names "$PROJECT_NAME-api-tg" --region $AWS_REGION --query 'TargetGroups[0].TargetGroupArn' --output text)
    UI_TARGET_GROUP=$(aws elbv2 describe-target-groups --names "$PROJECT_NAME-ui-tg" --region $AWS_REGION --query 'TargetGroups[0].TargetGroupArn' --output text)
    
    # Deploy Meilisearch service (no load balancer)
    if aws ecs describe-services --cluster $CLUSTER_NAME --services meilisearch-service --region $AWS_REGION &> /dev/null; then
        echo -e "${BLUE}🔄 Updating Meilisearch service${NC}"
        aws ecs update-service \
            --cluster $CLUSTER_NAME \
            --service meilisearch-service \
            --task-definition meilisearch \
            --region $AWS_REGION
    else
        echo -e "${BLUE}🆕 Creating Meilisearch service${NC}"
        aws ecs create-service \
            --cluster $CLUSTER_NAME \
            --service-name meilisearch-service \
            --task-definition meilisearch \
            --desired-count 1 \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[$PRIVATE_SUBNETS],securityGroups=[$SECURITY_GROUP],assignPublicIp=DISABLED}" \
            --region $AWS_REGION
    fi
    
    # Deploy API and UI services
    create_or_update_service "apollo-search-api-service" "apollo-search-api" "$API_TARGET_GROUP" "apollo-search-api" "8001"
    create_or_update_service "apollo-search-ui-service" "apollo-search-ui" "$UI_TARGET_GROUP" "apollo-search-ui" "8080"
    
    echo -e "${GREEN}✅ ECS services deployed${NC}"
}

# Main deployment flow
main() {
    # Check required environment variables
    if [ -z "$MEILI_MASTER_KEY" ]; then
        echo -e "${RED}❌ MEILI_MASTER_KEY environment variable is required${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🎯 Deployment Configuration:${NC}"
    echo -e "   Project: $PROJECT_NAME"
    echo -e "   Environment: $ENVIRONMENT"
    echo -e "   Region: $AWS_REGION"
    echo -e "   Account: $ACCOUNT_ID"
    echo ""
    
    # Run deployment steps
    deploy_infrastructure
    build_and_push_images
    deploy_ecs_services
    
    # Get final endpoint
    ALB_ENDPOINT=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='ALBEndpoint'].OutputValue" --output text)
    
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}🌐 Application URL: http://$ALB_ENDPOINT${NC}"
    echo -e "${BLUE}📚 API Documentation: http://$ALB_ENDPOINT/docs${NC}"
    echo -e "${BLUE}❤️  Health Check: http://$ALB_ENDPOINT/health${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Note: It may take a few minutes for services to become healthy${NC}"
}

# Run main function
main "$@"
