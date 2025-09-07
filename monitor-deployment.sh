#!/bin/bash

# Apollo Search Deployment Monitor
# Usage: ./monitor-deployment.sh <instance-ip> [instance-id] [stack-name]

set -e

IP="$1"
INSTANCE_ID="$2"
STACK_NAME="$3"

if [ -z "$IP" ]; then
    echo "Usage: $0 <instance-ip> [instance-id] [stack-name]"
    echo "Example: $0 34.220.155.33 i-0e2929cb6a064a8dc apollo-search-demo-simple"
    exit 1
fi

echo "=== Apollo Search Deployment Monitor ==="
echo "IP: $IP"
echo "Instance ID: $INSTANCE_ID"
echo "Stack: $STACK_NAME"
echo "Started at: $(date)"
echo "========================================="

# Function to check instance state
check_instance_state() {
    if [ -n "$INSTANCE_ID" ]; then
        STATE=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --query "Reservations[0].Instances[0].State.Name" --output text 2>/dev/null || echo "unknown")
        echo "[$(date +%H:%M:%S)] Instance state: $STATE"
        if [ "$STATE" != "running" ]; then
            echo "⚠️ Instance is no longer running!"
            return 1
        fi
    fi
    return 0
}

# Function to check services
check_services() {
    echo -n "[$(date +%H:%M:%S)] Services: "
    
    # Check API
    if curl -s -m 5 "http://$IP:8001/health" > /dev/null 2>&1; then
        echo -n "API✅ "
    else
        echo -n "API❌ "
    fi
    
    # Check MeiliSearch
    if curl -s -m 5 "http://$IP:7700/health" > /dev/null 2>&1; then
        echo -n "Search✅ "
    else
        echo -n "Search❌ "
    fi
    
    # Check UI
    if curl -s -m 5 "http://$IP:8080" > /dev/null 2>&1; then
        echo -n "UI✅"
    else
        echo -n "UI❌"
    fi
    
    echo ""
}

# Function to check SSH
check_ssh() {
    if timeout 10 ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i apollo-demo-key.pem ec2-user@"$IP" "echo 'SSH OK'" 2>/dev/null; then
        echo "[$(date +%H:%M:%S)] SSH: ✅ Available"
        
        # If SSH works, get system info
        echo "[$(date +%H:%M:%S)] System info:"
        ssh -o StrictHostKeyChecking=no -i apollo-demo-key.pem ec2-user@"$IP" "uptime && free -h | head -2 && docker ps --format 'table {{.Names}}\t{{.Status}}'" 2>/dev/null || echo "Failed to get system info"
        
        return 0
    else
        echo "[$(date +%H:%M:%S)] SSH: ❌ Not available"
        return 1
    fi
}

# Function to check CloudFormation stack
check_stack() {
    if [ -n "$STACK_NAME" ]; then
        STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].StackStatus" --output text 2>/dev/null || echo "NOT_FOUND")
        echo "[$(date +%H:%M:%S)] Stack status: $STATUS"
        
        if [ "$STATUS" = "DELETE_IN_PROGRESS" ] || [ "$STATUS" = "DELETE_COMPLETE" ]; then
            echo "⚠️ Stack is being deleted!"
            return 1
        fi
    fi
    return 0
}

# Main monitoring loop
echo "Starting monitoring... (Press Ctrl+C to stop)"
echo ""

# Initial connectivity test
echo "Testing initial connectivity..."
ping -c 2 "$IP" > /dev/null 2>&1 && echo "✅ Ping successful" || echo "❌ Ping failed (normal for EC2)"

# Wait for initial SSH availability
echo "Waiting for SSH to become available..."
for i in {1..12}; do
    if check_ssh; then
        break
    fi
    sleep 10
done

echo ""
echo "Starting continuous monitoring..."

# Continuous monitoring
COUNTER=1
while true; do
    echo "--- Check #$COUNTER ---"
    
    # Check instance state
    if ! check_instance_state; then
        echo "💥 Instance is no longer running. Stopping monitor."
        break
    fi
    
    # Check services
    check_services
    
    # Check SSH every 5th iteration
    if [ $((COUNTER % 5)) -eq 0 ]; then
        check_ssh
    fi
    
    # Check stack
    if ! check_stack; then
        echo "💥 Stack issue detected. Stopping monitor."
        break
    fi
    
    echo ""
    sleep 30
    COUNTER=$((COUNTER + 1))
done

echo "Monitoring ended at: $(date)"

# Final status check
echo ""
echo "=== Final Status Check ==="
check_instance_state
check_services
if [ -n "$STACK_NAME" ]; then
    echo "Final stack status: $(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].StackStatus" --output text 2>/dev/null || echo "NOT_FOUND")"
fi
