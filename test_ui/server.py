#!/usr/bin/env python3
"""
Simple HTTP Server for Apollo Tire Search Test UI
Serves static files with proper CORS headers for API integration
"""

import http.server
import socketserver
import os
import sys
import re
import urllib.request
import urllib.parse
import json
from pathlib import Path

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler with CORS support and dynamic API URL injection"""
    
    def do_GET(self):
        """Handle GET requests with dynamic API URL injection for HTML files"""
        print(f"🌍 GET request for path: {self.path}")
        
        if self.path == '/' or self.path == '/index.html' or self.path.startswith('/?'):
            print(f"🎯 Serving index.html with API URL injection for path: {self.path}")
            self.serve_index_with_api_url()
        elif self.path.startswith('/api/'):
            print(f"🔄 Proxying API request: {self.path}")
            self.proxy_api_request(self.path)
        else:
            print(f"📁 Serving static file: {self.path}")
            super().do_GET()
    
    def do_POST(self):
        """Handle POST requests for API proxying"""
        print(f"🌍 POST request for path: {self.path}")
        
        if self.path.startswith('/api/'):
            print(f"🔄 Proxying API POST request: {self.path}")
            self.proxy_api_request(self.path)
        else:
            self.send_error(405, "Method not allowed")
    
    def proxy_api_request(self, api_path):
        """Proxy API requests to the backend service"""
        try:
            print(f"🔄 Proxying API request: {api_path}")
            print(f"📱 User-Agent: {self.headers.get('User-Agent', 'Unknown')}")
            print(f"🌐 Host: {self.headers.get('Host', 'Unknown')}")
            print(f"🔧 Referer: {self.headers.get('Referer', 'None')}")
            print(f"📍 Client IP: {self.client_address[0]}")
            
            # Remove /api prefix from the path since backend doesn't expect it
            backend_path = api_path[4:] if api_path.startswith('/api') else api_path
            
            # Try Docker service name first (api), then localhost
            backend_urls = [
                f"http://api:8001{backend_path}",
                f"http://localhost:8001{backend_path}"
            ]
            
            last_error = None
            for backend_url in backend_urls:
                try:
                    print(f"🎯 Forwarding to backend: {backend_url}")
                    
                    # Forward the request to the backend
                    import urllib.request
                    import urllib.parse
                    
                    # Parse query string if present
                    if '?' in backend_path:
                        path_part, query_part = backend_path.split('?', 1)
                    else:
                        query_part = None
                    
                    full_url = backend_url
                    if query_part and '?' not in backend_url:
                        full_url += f"?{query_part}"
                    
                    print(f"🌐 Full backend URL: {full_url}")
                    
                    req = urllib.request.Request(full_url)
                    req.add_header('User-Agent', self.headers.get('User-Agent', 'Apollo-UI-Proxy/1.0'))
                    
                    # Handle POST data if present
                    if self.command == 'POST':
                        content_length = int(self.headers.get('Content-Length', 0))
                        if content_length > 0:
                            post_data = self.rfile.read(content_length)
                            req.data = post_data
                            req.add_header('Content-Type', self.headers.get('Content-Type', 'application/json'))
                            req.add_header('Content-Length', str(content_length))
                    
                    with urllib.request.urlopen(req, timeout=30) as response:
                        print(f"✅ Backend responded with status: {response.status}")
                        
                        # Send response status
                        self.send_response(response.status)
                        
                        # Forward response headers
                        for header, value in response.headers.items():
                            if header.lower() not in ['server', 'date']:
                                self.send_header(header, value)
                        
                        # Add CORS headers
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                        self.end_headers()
                        
                        # Forward response body
                        response_data = response.read()
                        print(f"📦 Response size: {len(response_data)} bytes")
                        self.wfile.write(response_data)
                        return
                        
                except Exception as e:
                    print(f"❌ Error connecting to {backend_url}: {e}")
                    last_error = e
                    continue
            
            # If all backends failed
            print(f"🚨 All backend URLs failed. Last error: {last_error}")
            self.send_error(502, f"Backend API unavailable: {last_error}")
            
        except Exception as e:
            print(f"🚨 Proxy error: {e}")
            import traceback
            traceback.print_exc()
            self.send_error(500, f"Proxy error: {e}")
    
    def serve_index_with_api_url(self):
        """Serve index.html with dynamic API URL injection"""
        try:
            # Detect environment and set appropriate API URL
            api_url = self.detect_api_url()
            
            # Read the index.html file
            index_path = Path("index.html")
            if not index_path.exists():
                self.send_error(404, "Index file not found")
                return
            
            with open(index_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            # Inject the API URL into the HTML
            # Look for the pattern: window.APOLLO_API_URL = 'some_url';
            pattern = r"window\.APOLLO_API_URL\s*=\s*['\"]([^'\"]*)['\"]"
            replacement = f"window.APOLLO_API_URL = '{api_url}'"
            
            if re.search(pattern, html_content):
                html_content = re.sub(pattern, replacement, html_content)
                print(f"✅ Injected API URL into HTML: {api_url}")
            else:
                print(f"⚠️ Could not find API URL pattern in HTML")
            
            # Send the modified HTML
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.send_header('Content-Length', str(len(html_content.encode('utf-8'))))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.end_headers()
            self.wfile.write(html_content.encode('utf-8'))
            
        except Exception as e:
            print(f"🚨 Error serving index.html: {e}")
            import traceback
            traceback.print_exc()
            self.send_error(500, f"Error serving index: {e}")
    
    def detect_api_url(self):
        """Detect the appropriate API URL based on the environment"""
        try:
            client_ip = self.client_address[0]
            host_header = self.headers.get('Host', '')
            
            print(f"🔍 API URL Detection:")
            print(f"   📍 Client IP: {client_ip}")
            print(f"   🌐 Host Header: {host_header}")
            print(f"   🔧 All Headers: {dict(self.headers)}")
            
            # Check for AWS/cloud environment indicators
            aws_indicators = [
                os.environ.get('AWS_REGION'),
                os.environ.get('AWS_EXECUTION_ENV'),
                os.environ.get('AWS_LAMBDA_FUNCTION_NAME'),
                os.environ.get('ECS_CLUSTER'),
                os.environ.get('KUBERNETES_SERVICE_HOST')
            ]
            
            is_aws_env = any(aws_indicators)
            print(f"🏭 AWS environment detected: {is_aws_env}")
            
            if is_aws_env:
                # In AWS/cloud environment, use internal service communication
                api_url = "http://api:8001"
                print(f"☁️ Using cloud internal API URL: {api_url}")
                print(f"   📋 Environment Type: Cloud/Container")
                return api_url
            
            # Check if it's a Cloudflare tunnel or external access
            if host_header and not host_header.startswith('localhost'):
                # External access - use relative URLs so browsers go through our proxy
                if 'trycloudflare.com' in host_header:
                    # For Cloudflare tunnels, use relative URL so browser uses proxy
                    api_url = "/api"
                    print(f"🌩️ Cloudflare tunnel detected, using relative API URL: {api_url}")
                    print(f"   📋 Environment Type: Cloudflare Tunnel (Browser Proxy)")
                else:
                    # Generic external access - also use relative URL
                    api_url = "/api"
                    print(f"🌍 External access detected, using relative API URL: {api_url}")
                    print(f"   📋 Environment Type: External Access (Browser Proxy)")
                return api_url
            
            # Default to localhost for local development
            api_url = "http://localhost:8001"
            print(f"🏠 Using default local API URL: {api_url}")
            print(f"   📋 Environment Type: Local Development")
            return api_url
            
        except Exception as e:
            print(f"🚨 Error detecting API URL: {e}")
            # Fallback to localhost
            return "http://localhost:8001"
    
    def end_headers(self):
        """Override to add CORS headers to all responses"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def main():
    """Main entry point"""
    try:
        # Change to the directory containing this script
        script_dir = Path(__file__).parent
        os.chdir(script_dir)
        print(f"📁 Changed working directory to: {script_dir}")
        
        port = 8080
        
        print(f"""
🚀 Starting Apollo Tire Search UI Server
📂 Serving from: {script_dir}
🌐 Server: http://localhost:{port}
🔄 API Proxy: Enabled (auto-detection)
✨ CORS: Enabled
📱 Mobile: Optimized
        """)
        
        with socketserver.TCPServer(("", port), CORSHTTPRequestHandler) as httpd:
            print(f"🎯 Server running on port {port}")
            print(f"🔗 Access the UI at: http://localhost:{port}")
            print(f"🛑 Press Ctrl+C to stop the server")
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print(f"\n🛑 Server stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"🚨 Server error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
