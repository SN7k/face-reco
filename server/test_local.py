#!/usr/bin/env python3
"""
Local test script for the Face Recognition Attendance System
Run this to test the service locally before deploying to Cloud Run
"""

import requests
import time
import subprocess
import sys
import os

def test_service():
    """Test the service endpoints"""
    base_url = "http://localhost:8000"
    
    print("Testing Face Recognition Attendance System...")
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        if response.status_code == 200:
            print("✅ Health check passed")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check failed: {e}")
        return False
    
    # Test readiness endpoint
    try:
        response = requests.get(f"{base_url}/ready", timeout=10)
        if response.status_code == 200:
            print("✅ Readiness check passed")
        else:
            print(f"❌ Readiness check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Readiness check failed: {e}")
        return False
    
    # Test root endpoint
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        if response.status_code == 200:
            print("✅ Root endpoint working")
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Root endpoint failed: {e}")
        return False
    
    print("🎉 All tests passed! Service is ready for deployment.")
    return True

def main():
    """Main function"""
    print("Starting local test...")
    
    # Check if service is running
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("Service is already running on port 8000")
        else:
            print("Service responded but with unexpected status")
    except requests.exceptions.RequestException:
        print("Service is not running. Please start it first with:")
        print("  python main.py")
        print("  or")
        print("  uvicorn main:app --host 0.0.0.0 --port 8000")
        return False
    
    # Run tests
    return test_service()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
