#!/usr/bin/env python3
"""
Simple HTTP Server for Multi-Brand Tire Search Test UI
Serves static files with proper CORS headers for API integration
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler with CORS support"""
    
    def end_headers(self):
        """Add CORS headers to all responses"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle preflight OPTIONS requests"""
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        """Override to provide cleaner logging"""
        print(f"[{self.address_string()}] {format % args}")

def main():
    """Start the HTTP server"""
    
    # Configuration
    PORT = int(os.getenv('PORT', 8080))
    HOST = os.getenv('HOST', '0.0.0.0')  # Bind to all interfaces for Docker
    
    # Ensure we're in the correct directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    print("🚀 Starting Multi-Brand Tire Search Test UI Server")
    print("=" * 50)
    print(f"📁 Serving files from: {script_dir}")
    print(f"🌐 Server URL: http://{HOST}:{PORT}")
    print(f"📋 API Backend: http://localhost:8001 (must be running)")
    print("=" * 50)
    
    # Check if required files exist
    required_files = ['index.html', 'styles.css', 'script.js']
    missing_files = [f for f in required_files if not Path(f).exists()]
    
    if missing_files:
        print(f"❌ Missing required files: {', '.join(missing_files)}")
        sys.exit(1)
    
    try:
        # Create server
        with socketserver.TCPServer((HOST, PORT), CORSHTTPRequestHandler) as httpd:
            print(f"✅ Server started successfully!")
            print(f"🔗 Open your browser to: http://{HOST}:{PORT}")
            print("\n💡 Tips:")
            print("   • Make sure the API server is running on port 8001")
            print("   • Try the sample searches to explore features")
            print("   • Use Ctrl+C to stop the server")
            print("\n🎯 Ready to demonstrate advanced search features!")
            print("-" * 50)
            
            # Start serving
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped by user")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use")
            print("💡 Try stopping other servers or use a different port")
        else:
            print(f"❌ Server error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
