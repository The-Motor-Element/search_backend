#!/bin/bash
echo "🔍 AWS EC2 Instance Troubleshooting Script"
echo "=========================================="

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS CLI not configured. Run 'aws configure' first."
    exit 1
fi

# Get region
REGION=$(aws configure get region)
echo "🌍 Region: $REGION"

# Find recent Apollo instances
echo -e "\n📱 Finding recent Apollo instances..."
INSTANCES=$(aws ec2 describe-instances \
    --region $REGION \
    --filters "Name=tag:Name,Values=*apollo*" \
    --query "Reservations[].Instances[].[InstanceId,State.Name,LaunchTime,StateTransitionReason]" \
    --output text | sort -k3 -r | head -5)

if [ -z "$INSTANCES" ]; then
    echo "No Apollo instances found."
    exit 1
fi

echo "$INSTANCES"

# Get the most recent instance
LATEST_INSTANCE=$(echo "$INSTANCES" | head -1 | awk '{print $1}')
INSTANCE_STATE=$(echo "$INSTANCES" | head -1 | awk '{print $2}')

echo -e "\n🔧 Latest instance: $LATEST_INSTANCE (State: $INSTANCE_STATE)"

# Get console output if instance is terminated or stopping
if [[ "$INSTANCE_STATE" == "terminated" || "$INSTANCE_STATE" == "stopping" || "$INSTANCE_STATE" == "stopped" ]]; then
    echo -e "\n📋 Console output (last 50 lines):"
    aws ec2 get-console-output \
        --region $REGION \
        --instance-id $LATEST_INSTANCE \
        --query 'Output' \
        --output text 2>/dev/null | tail -50 || echo "Console output not available"
fi

# If instance is running, try to get system logs
if [[ "$INSTANCE_STATE" == "running" ]]; then
    echo -e "\n✅ Instance is running!"
    
    # Get public IP
    PUBLIC_IP=$(aws ec2 describe-instances \
        --region $REGION \
        --instance-ids $LATEST_INSTANCE \
        --query "Reservations[0].Instances[0].PublicIpAddress" \
        --output text)
    
    echo "🌐 Public IP: $PUBLIC_IP"
    echo "🔗 UI URL: http://$PUBLIC_IP:8080"
    echo "🔗 MeiliSearch URL: http://$PUBLIC_IP:7700"
    
    # Test connectivity
    echo -e "\n🧪 Testing connectivity..."
    if timeout 5 curl -s http://$PUBLIC_IP:8080/ &>/dev/null; then
        echo "✅ UI is accessible"
    else
        echo "❌ UI is not accessible"
    fi
    
    if timeout 5 curl -s http://$PUBLIC_IP:7700/health &>/dev/null; then
        echo "✅ MeiliSearch is accessible"
    else
        echo "❌ MeiliSearch is not accessible"
    fi
fi

echo -e "\n💡 Troubleshooting tips:"
echo "1. Check console output above for error messages"
echo "2. Look for 'Error:', 'Failed', or 'fatal' messages"
echo "3. Common issues:"
echo "   - Network timeouts during package installation"
echo "   - Out of memory during Docker builds"
echo "   - Syntax errors in UserData script"
echo "   - Missing permissions"
echo "4. To debug further, SSH into a running instance:"
echo "   ssh -i apollo-demo-key.pem ec2-user@$PUBLIC_IP"
echo "   sudo tail -f /var/log/user-data.log"
echo "   sudo journalctl -u apollo-search -f"
