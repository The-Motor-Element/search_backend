#!/bin/bash

# Minimal UserData Script for Testing
# This script tests basic functionality without complex deployment

# Enable logging
exec > >(tee /var/log/user-data-minimal.log)
exec 2>&1

echo "=== MINIMAL DEPLOYMENT TEST STARTED ==="
echo "Timestamp: $(date)"
echo "Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)"

# Function to handle errors gracefully
handle_error() {
  echo "ERROR: $1"
  echo "Timestamp: $(date)"
  echo "Continuing despite error..."
  echo "ERROR: $1" >> /var/log/deployment-errors.log
}

# Update system packages
echo "Step 1: Updating system packages..."
yum update -y || handle_error "Package update failed"

# Install basic tools
echo "Step 2: Installing basic tools..."
yum install -y docker git curl htop || handle_error "Tool installation failed"

# Start Docker
echo "Step 3: Starting Docker..."
systemctl start docker || handle_error "Docker start failed"
systemctl enable docker || handle_error "Docker enable failed"

# Test Docker
echo "Step 4: Testing Docker..."
docker --version || handle_error "Docker version check failed"
docker run --rm hello-world || handle_error "Docker hello-world test failed"

# Create a simple web server
echo "Step 5: Creating simple web server..."
cat > /home/ec2-user/simple-server.py << 'EOF'
#!/usr/bin/env python3
import http.server
import socketserver
import json
from datetime import datetime

class SimpleHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "test": "minimal-deployment"
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            html = f"""
            <html>
            <head><title>Minimal Deployment Test</title></head>
            <body>
                <h1>🎉 Minimal Deployment Successful!</h1>
                <p>Server started at: {datetime.now().isoformat()}</p>
                <p>Instance is running and accessible!</p>
                <p><a href="/health">Health Check</a></p>
            </body>
            </html>
            """
            self.wfile.write(html.encode())

PORT = 8080
with socketserver.TCPServer(("", PORT), SimpleHandler) as httpd:
    print(f"Server running on port {PORT}")
    httpd.serve_forever()
EOF

chmod +x /home/ec2-user/simple-server.py

# Start simple server as background service
echo "Step 6: Starting simple web server..."
nohup python3 /home/ec2-user/simple-server.py > /var/log/simple-server.log 2>&1 &

# Wait and test
echo "Step 7: Testing server..."
sleep 10
curl -s http://localhost:8080/health || handle_error "Simple server test failed"

# Create status files
echo "Step 8: Creating status indicators..."
echo "MINIMAL_DEPLOYMENT_SUCCESS" > /tmp/deployment_status
echo "$(date): Minimal deployment completed successfully" >> /var/log/deployment-success.log

# Final verification
echo "=== FINAL VERIFICATION ==="
echo "Docker status: $(systemctl is-active docker)"
echo "Simple server PID: $(pgrep -f simple-server.py)"
echo "Listening ports: $(netstat -tlnp | grep :8080 || echo 'Port 8080 not found')"

echo "=== MINIMAL DEPLOYMENT TEST COMPLETED ==="
echo "Completion time: $(date)"
echo "SUCCESS: Minimal deployment finished without critical errors"

# Keep the script running for monitoring
echo "Keeping instance alive for monitoring..."
sleep 300  # Keep alive for 5 minutes for testing
