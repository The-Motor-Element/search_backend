#!/usr/bin/env python3
"""
Validate Docker port configuration for CI testing
Ensures services are running on expected ports
"""

import subprocess
import sys
import json
from typing import Dict, List


def get_docker_ports() -> Dict[str, List[str]]:
    """
    Get port mappings for running Docker containers
    """
    try:
        result = subprocess.run(
            ["docker", "ps", "--format", "json"], 
            capture_output=True, 
            text=True, 
            check=True
        )
        
        containers = []
        for line in result.stdout.strip().split('\n'):
            if line:
                containers.append(json.loads(line))
        
        port_mappings = {}
        for container in containers:
            name = container.get('Names', '')
            ports = container.get('Ports', '')
            if name and ports:
                port_mappings[name] = ports.split(', ')
        
        return port_mappings
        
    except subprocess.CalledProcessError as e:
        print(f"Error getting Docker info: {e}")
        return {}
    except json.JSONDecodeError as e:
        print(f"Error parsing Docker output: {e}")
        return {}


def validate_ports():
    """
    Validate that required services are running on expected ports
    """
    print("🔍 Validating Docker port configuration...")
    
    port_mappings = get_docker_ports()
    
    if not port_mappings:
        print("❌ No Docker containers running or unable to get port info")
        return False
    
    print("\n📋 Current Docker containers and ports:")
    for name, ports in port_mappings.items():
        print(f"  {name}: {', '.join(ports)}")
    
    # Expected port mappings
    expected_services = {
        'meilisearch': '7700',
        'api': '8001',  # Note: Docker Compose maps to 8001, not 8000
    }
    
    print("\n✅ Validating expected services:")
    all_valid = True
    
    for service, expected_port in expected_services.items():
        found = False
        for container_name, ports in port_mappings.items():
            if service in container_name.lower():
                for port_mapping in ports:
                    if f":{expected_port}->" in port_mapping or f"0.0.0.0:{expected_port}" in port_mapping:
                        print(f"  ✅ {service}: Found on port {expected_port}")
                        found = True
                        break
                if found:
                    break
        
        if not found:
            print(f"  ❌ {service}: NOT found on expected port {expected_port}")
            all_valid = False
    
    return all_valid


def main():
    """
    Main validation routine
    """
    print("🐳 Docker Port Configuration Validator")
    print("=" * 50)
    
    if validate_ports():
        print("\n🎉 All services are running on expected ports!")
        print("\n📝 Test configuration:")
        print("  - Meilisearch: http://localhost:7700")
        print("  - API Service: http://localhost:8001")
        print("  - Set API_BASE_URL=http://localhost:8001 for tests")
        sys.exit(0)
    else:
        print("\n💥 Port validation failed!")
        print("\n🔧 Try:")
        print("  1. docker compose up -d (or docker-compose up -d)")
        print("  2. docker compose ps (or docker-compose ps)")
        print("  3. Check docker-compose.yml port mappings")
        sys.exit(1)


if __name__ == "__main__":
    main()
