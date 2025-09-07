#!/usr/bin/env python3
"""
Test Docker Compose command compatibility for CI/CD
Verifies that the correct docker compose command is available
"""

import subprocess
import sys
import os


def test_docker_compose_command():
    """
    Test which docker compose command is available
    """
    print("🐳 Testing Docker Compose Command Compatibility")
    print("=" * 55)
    
    # Test Docker Compose V2 (preferred for GitHub Actions)
    try:
        result = subprocess.run(
            ["docker", "compose", "version"], 
            capture_output=True, 
            text=True, 
            timeout=10
        )
        if result.returncode == 0:
            print("✅ Docker Compose V2 (docker compose) is available")
            print(f"   Version: {result.stdout.strip()}")
            return "docker compose"
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        print("❌ Docker Compose V2 (docker compose) not available")
    
    # Test Docker Compose V1 (legacy)
    try:
        result = subprocess.run(
            ["docker-compose", "--version"], 
            capture_output=True, 
            text=True, 
            timeout=10
        )
        if result.returncode == 0:
            print("✅ Docker Compose V1 (docker-compose) is available")
            print(f"   Version: {result.stdout.strip()}")
            return "docker-compose"
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        print("❌ Docker Compose V1 (docker-compose) not available")
    
    print("💥 No Docker Compose command found!")
    return None


def test_compose_file():
    """
    Test if docker-compose.yml exists and is valid
    """
    print("\n📄 Testing Docker Compose File")
    print("=" * 35)
    
    compose_file = "docker-compose.yml"
    if not os.path.exists(compose_file):
        print(f"❌ {compose_file} not found in current directory")
        return False
    
    print(f"✅ {compose_file} found")
    
    # Get the docker compose command
    compose_cmd = test_docker_compose_command()
    if not compose_cmd:
        return False
    
    # Test config validation
    try:
        if compose_cmd == "docker compose":
            result = subprocess.run(
                ["docker", "compose", "config", "--quiet"], 
                capture_output=True, 
                text=True, 
                timeout=10
            )
        else:
            result = subprocess.run(
                ["docker-compose", "config", "--quiet"], 
                capture_output=True, 
                text=True, 
                timeout=10
            )
        
        if result.returncode == 0:
            print("✅ Docker Compose file is valid")
            return True
        else:
            print(f"❌ Docker Compose file validation failed: {result.stderr}")
            return False
            
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
        print(f"❌ Error validating compose file: {e}")
        return False


def main():
    """
    Main test routine
    """
    print("🧪 Docker Compose CI/CD Compatibility Test")
    print("=" * 50)
    print("This script tests Docker Compose command compatibility")
    print("for both local development and GitHub Actions.\n")
    
    # Test Docker Compose commands
    compose_cmd = test_docker_compose_command()
    
    # Test compose file
    compose_valid = test_compose_file()
    
    print("\n" + "=" * 50)
    
    if compose_cmd and compose_valid:
        print("🎉 All tests passed!")
        print(f"\n📋 Recommended command: {compose_cmd}")
        print("\n🔧 Usage examples:")
        if compose_cmd == "docker compose":
            print("  - Start services: docker compose up -d")
            print("  - Stop services: docker compose down")
            print("  - View logs: docker compose logs")
        else:
            print("  - Start services: docker-compose up -d")
            print("  - Stop services: docker-compose down")
            print("  - View logs: docker-compose logs")
        
        print("\n✅ This should work in GitHub Actions!")
        sys.exit(0)
    else:
        print("💥 Tests failed!")
        print("\n🔧 Troubleshooting:")
        print("  1. Install Docker Desktop or Docker Engine")
        print("  2. Ensure Docker daemon is running")
        print("  3. Check docker-compose.yml syntax")
        sys.exit(1)


if __name__ == "__main__":
    main()
