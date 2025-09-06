#!/usr/bin/env python3
"""
Apollo Tire Search Test UI - Quick Demo Guide
Interactive guide for demonstrating advanced search features
"""

import webbrowser
import time
import subprocess
import sys
import requests
from pathlib import Path

def check_api_server():
    """Check if the API server is running"""
    try:
        response = requests.get('http://localhost:8001/health', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API Server: {data.get('status', 'unknown').upper()}")
            print(f"🔍 Meilisearch: {data.get('meilisearch', {}).get('version', 'unknown')}")
            return True
    except requests.exceptions.RequestException:
        pass
    
    print("❌ API Server is not running on http://localhost:8001")
    return False

def check_ui_server():
    """Check if the UI server is running"""
    try:
        response = requests.get('http://localhost:8080', timeout=5)
        if response.status_code == 200:
            print("✅ UI Server: Running on http://localhost:8080")
            return True
    except requests.exceptions.RequestException:
        pass
    
    print("❌ UI Server is not running on http://localhost:8080")
    return False

def start_demo():
    """Start the demo presentation"""
    
    print("🎯 APOLLO TIRE SEARCH - ADVANCED FEATURES DEMO")
    print("=" * 60)
    print("Welcome to the interactive demonstration of our advanced search capabilities!")
    print()
    
    # Check prerequisites
    print("🔍 Checking Prerequisites...")
    api_running = check_api_server()
    ui_running = check_ui_server()
    
    if not api_running:
        print("\n💡 To start the API server:")
        print("   cd /path/to/search_backend")
        print("   python -m uvicorn app.main:app --host 0.0.0.0 --port 8001")
        return False
    
    if not ui_running:
        print("\n💡 To start the UI server:")
        print("   cd test_ui")
        print("   python server.py")
        return False
    
    print("\n🚀 Both servers are running! Ready for demo.")
    
    # Open browser
    print("\n🌐 Opening demo in your default browser...")
    webbrowser.open('http://localhost:8080')
    
    return True

def show_demo_script():
    """Show the demo script for presentation"""
    
    demo_steps = [
        {
            "title": "🏠 Welcome & Overview",
            "description": "Show the welcome screen highlighting all features",
            "actions": [
                "Point out the 1,557 indexed tire products",
                "Highlight the 10 advanced features listed",
                "Show the health status indicator (green)"
            ]
        },
        {
            "title": "🔍 Basic Search Demo",
            "description": "Demonstrate basic search functionality",
            "actions": [
                "Click 'Sample: LOADSTAR' button",
                "Show search results with sub-millisecond timing",
                "Point out tire-specific fields (MPN, size, ply rating)",
                "Demonstrate 'Find Similar' functionality"
            ]
        },
        {
            "title": "📊 Faceted Search & Analytics",
            "description": "Show real-time facets and analytics",
            "actions": [
                "Change search type to 'Faceted Search'",
                "Search for 'apollo' to show facet distributions",
                "Click facet values to apply filters",
                "Show how counts update in real-time"
            ]
        },
        {
            "title": "🎯 Advanced Filtering",
            "description": "Demonstrate complex filtering capabilities",
            "actions": [
                "Open the Filters accordion",
                "Select Group = 'SCV' and Record Type = 'Tyre'",
                "Show results filtering down",
                "Try custom filter: group = 'Passenger Car' AND ply_rating = '6PR'"
            ]
        },
        {
            "title": "💡 Intelligent Autocomplete",
            "description": "Show context-aware suggestions",
            "actions": [
                "Clear search box and type 'load'",
                "Show dropdown suggestions appearing",
                "Click a suggestion to search",
                "Try typing 'super' for more suggestions"
            ]
        },
        {
            "title": "✨ Search Highlighting",
            "description": "Demonstrate search term highlighting",
            "actions": [
                "Change search type to 'Highlighted Search'",
                "Search for 'SUPER'",
                "Point out highlighted terms in results",
                "Show how highlighting helps identify matches"
            ]
        },
        {
            "title": "🔗 Similar Products AI",
            "description": "Show AI-powered recommendations",
            "actions": [
                "Search for 'LOADSTAR'",
                "Click 'Find Similar' on any result",
                "Show similar products section appearing",
                "Explain similarity based on group, ply rating, pattern"
            ]
        },
        {
            "title": "🌐 Browse Mode",
            "description": "Category exploration without search",
            "actions": [
                "Click 'Browse All Categories' button",
                "Show facets with no search query",
                "Demonstrate pure category browsing",
                "Show how to filter by category"
            ]
        },
        {
            "title": "📈 Analytics Dashboard",
            "description": "Comprehensive index statistics",
            "actions": [
                "Click 'Show Analytics' button",
                "Show modal with index statistics",
                "Point out 1,557 documents, 13 groups, 3 record types",
                "Show top categories and distributions"
            ]
        },
        {
            "title": "📱 Mobile Experience",
            "description": "Responsive design demonstration",
            "actions": [
                "Open browser developer tools",
                "Switch to mobile view",
                "Show responsive layout adaptation",
                "Demonstrate touch-friendly interface"
            ]
        }
    ]
    
    print("\n📋 DEMO PRESENTATION SCRIPT")
    print("=" * 60)
    print("Follow this script to showcase all advanced features:\n")
    
    for i, step in enumerate(demo_steps, 1):
        print(f"{i:2d}. {step['title']}")
        print(f"    {step['description']}")
        for action in step['actions']:
            print(f"    • {action}")
        print()
    
    print("💡 DEMO TIPS:")
    print("   • Keep an eye on the processing times (usually 0-2ms)")
    print("   • Point out the health status indicator")
    print("   • Emphasize the 1,557 real tire products")
    print("   • Show the tire industry terminology")
    print("   • Highlight the production-ready architecture")

def main():
    """Main demo function"""
    
    if len(sys.argv) > 1 and sys.argv[1] == 'script':
        show_demo_script()
        return
    
    # Start the interactive demo
    if start_demo():
        print("\n" + "=" * 60)
        print("🎉 DEMO IS READY!")
        print("📖 For a detailed presentation script, run:")
        print("   python demo.py script")
        print("\n🔍 Try these demo highlights:")
        print("   1. Click 'Sample: LOADSTAR' for instant results")
        print("   2. Switch to 'Faceted Search' to see analytics")
        print("   3. Type 'load' to see intelligent suggestions")
        print("   4. Click 'Show Analytics' for comprehensive stats")
        print("   5. Try 'Browse All Categories' for exploration")
        print("\n🚀 Enjoy demonstrating the advanced search features!")
    else:
        print("\n❌ Demo setup incomplete. Please start required servers first.")

if __name__ == '__main__':
    main()
