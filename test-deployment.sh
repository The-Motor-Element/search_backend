#!/bin/bash

# Quick test deployment script with better error handling
set -e

echo "🧪 Testing CloudFormation deployment with improved error handling..."

STACK_NAME="apollo-test-error-handling"
KEY_PAIR_NAME="apollo-test-key"
REGION="us-east-1"

echo "🔧 Creating test SSH key pair..."
aws ec2 delete-key-pair --key-name $KEY_PAIR_NAME --region $REGION 2>/dev/null || echo "Key pair didn't exist"
aws ec2 create-key-pair --key-name $KEY_PAIR_NAME --region $REGION --query 'KeyMaterial' --output text > ${KEY_PAIR_NAME}.pem
chmod 400 ${KEY_PAIR_NAME}.pem

echo "🚀 Deploying test stack..."
aws cloudformation deploy \
  --template-file aws/cloudformation-free-tier-no-iam.yml \
  --stack-name $STACK_NAME \
  --parameter-overrides \
    ProjectName=apollo-test \
    MeiliMasterKey=test-key-$(openssl rand -hex 8) \
    KeyPairName=$KEY_PAIR_NAME \
  --region $REGION \
  --no-fail-on-empty-changeset

echo "✅ Deployment completed! Getting instance info..."

PUBLIC_IP=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query "Stacks[0].Outputs[?OutputKey=='PublicIP'].OutputValue" \
  --output text)

echo "📊 Instance IP: $PUBLIC_IP"
echo "🔗 UI: http://$PUBLIC_IP:8080"
echo "🔗 API: http://$PUBLIC_IP:8001/docs"

echo "⏳ Waiting 2 minutes for services to start..."
sleep 120

echo "🧪 Testing services..."
curl -s "http://$PUBLIC_IP:8001/health" && echo " ✅ API is healthy"
curl -s "http://$PUBLIC_IP:7700/health" && echo " ✅ MeiliSearch is healthy"

echo "🔍 SSH command: ssh -i ${KEY_PAIR_NAME}.pem ec2-user@$PUBLIC_IP"
echo "📄 View logs: ssh -i ${KEY_PAIR_NAME}.pem ec2-user@$PUBLIC_IP 'tail -f /var/log/user-data.log'"

echo ""
echo "🗑️  To cleanup:"
echo "aws cloudformation delete-stack --stack-name $STACK_NAME --region $REGION"
echo "aws ec2 delete-key-pair --key-name $KEY_PAIR_NAME --region $REGION"
echo "rm -f ${KEY_PAIR_NAME}.pem"
