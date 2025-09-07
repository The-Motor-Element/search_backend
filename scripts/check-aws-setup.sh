#!/bin/bash
echo "🔧 Pre-deployment AWS Setup Check"
echo "=================================="

# Check AWS CLI configuration
echo "1. Checking AWS CLI configuration..."
aws sts get-caller-identity || { echo "❌ AWS CLI not configured properly"; exit 1; }

# Check region
echo -e "\n2. Checking AWS region..."
REGION=$(aws configure get region)
echo "Current region: $REGION"

# Check CloudFormation template validity
echo -e "\n3. Validating CloudFormation template..."
aws cloudformation validate-template --template-body file://aws/cloudformation-free-tier.yml --region $REGION || { echo "❌ CloudFormation template invalid"; exit 1; }

# Check if we can create key pairs (basic EC2 permissions test)
echo -e "\n4. Testing EC2 permissions..."
aws ec2 describe-key-pairs --region $REGION > /dev/null || { echo "❌ No EC2 permissions"; exit 1; }

# Check IAM permissions (basic test)
echo -e "\n5. Testing IAM permissions..."
aws iam get-user > /dev/null 2>&1 || echo "⚠️  Limited IAM permissions (might be OK)"

echo -e "\n✅ Pre-deployment checks passed!"
echo "You can now run the GitHub Actions deployment."
