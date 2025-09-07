#!/usr/bin/env python3
"""
Debug Docker Compose service status
Quick script to check what's actually running
"""

import subprocess
import json
import os


def get_docker_services():
    """Get status of docker compose services"""
    try:
        result = subprocess.run(
            ["docker", "compose", "ps", "--format", "json"], 
            capture_output=True, 
            text=True, 
            check=True
        )
        
        services = []
        for line in result.stdout.strip().split('\n'):
            if line:
                try:
                    services.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
        
        return services
    except Exception as e:
        print(f"Error getting services: {e}")
        return []


def check_port_bindings():
    """Check actual port bindings"""
    try:
        # Get API port
        result = subprocess.run(
            ["docker", "compose", "port", "api", "8001"], 
            capture_output=True, 
            text=True
        )
        api_port = result.stdout.strip()
        
        # Get Meilisearch port  
        result = subprocess.run(
            ["docker", "compose", "port", "meilisearch", "7700"], 
            capture_output=True, 
            text=True
        )
        meili_port = result.stdout.strip()
        
        return api_port, meili_port
    except Exception as e:
        print(f"Error checking ports: {e}")
        return None, None


def main():
    print("🐳 Docker Compose Service Debug")
    print("=" * 40)
    
    # Check if we're using the right compose command
    compose_cmd = "docker compose"
    try:
        subprocess.run([compose_cmd.split()[0], compose_cmd.split()[1], "version"], 
                      capture_output=True, check=True)
        print(f"✅ Using: {compose_cmd}")
    except:
        compose_cmd = "docker-compose"
        print(f"✅ Using: {compose_cmd}")
    
    # Get services
    print("\n📋 Services Status:")
    services = get_docker_services()
    if services:
        for service in services:
            name = service.get('Name', 'Unknown')
            state = service.get('State', 'Unknown')
            ports = service.get('Publishers', [])
            print(f"  {name}: {state}")
            if ports:
                for port in ports:
                    published = port.get('PublishedPort', 'N/A')
                    target = port.get('TargetPort', 'N/A')
                    print(f"    Port: {published} -> {target}")
    else:
        print("  No services found or error getting service info")
    
    # Check port bindings
    print("\n🔌 Port Bindings:")
    api_port, meili_port = check_port_bindings()
    print(f"  API (8001): {api_port or 'Not found'}")
    print(f"  Meilisearch (7700): {meili_port or 'Not found'}")
    
    # Environment check
    print("\n🌍 Environment Variables:")
    print(f"  API_BASE_URL: {os.getenv('API_BASE_URL', 'NOT SET')}")
    print(f"  MEILI_URL: {os.getenv('MEILI_URL', 'NOT SET')}")
    print(f"  MEILI_MASTER_KEY: {'SET' if os.getenv('MEILI_MASTER_KEY') else 'NOT SET'}")
    
    # Test connectivity
    print("\n🔗 Quick Connectivity Test:")
    
    # Test Meilisearch
    try:
        result = subprocess.run(
            ["curl", "-f", "-s", "http://localhost:7700/health"], 
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            print(f"  Meilisearch: ✅ Connected")
        else:
            print(f"  Meilisearch: ❌ Failed (curl exit code: {result.returncode})")
    except Exception as e:
        print(f"  Meilisearch: ❌ {e}")
    
    # Test API  
    try:
        result = subprocess.run(
            ["curl", "-f", "-s", "http://localhost:8001/health"], 
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            print(f"  API: ✅ Connected")
        else:
            print(f"  API: ❌ Failed (curl exit code: {result.returncode})")
    except Exception as e:
        print(f"  API: ❌ {e}")


if __name__ == "__main__":
    main()
