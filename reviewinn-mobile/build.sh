#!/bin/bash

# ReviewInn Mobile - Build Script
# This script helps build the app for different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ReviewInn Mobile - Build Script    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# Function to display usage
usage() {
    echo -e "${YELLOW}Usage:${NC}"
    echo "  ./build.sh [environment] [platform]"
    echo ""
    echo -e "${YELLOW}Environments:${NC}"
    echo "  dev         - Development (with mock data)"
    echo "  dev-api     - Development (with real API)"
    echo "  staging     - Staging environment"
    echo "  prod        - Production environment"
    echo ""
    echo -e "${YELLOW}Platforms:${NC}"
    echo "  android     - Build APK"
    echo "  ios         - Build iOS"
    echo "  web         - Build web"
    echo "  all         - Build all platforms"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  ./build.sh dev android"
    echo "  ./build.sh prod all"
    exit 1
}

# Check arguments
if [ $# -lt 2 ]; then
    usage
fi

ENVIRONMENT=$1
PLATFORM=$2

# Set API URL based on environment
case $ENVIRONMENT in
    dev)
        API_URL="http://localhost:8000/api/v1"
        USE_MOCK="true"
        echo -e "${GREEN}📱 Building for: Development (Mock Data)${NC}"
        ;;
    dev-api)
        # Replace with your computer's IP address
        API_URL="http://192.168.1.100:8000/api/v1"
        USE_MOCK="false"
        ENVIRONMENT="dev"
        echo -e "${GREEN}📱 Building for: Development (Real API)${NC}"
        echo -e "${YELLOW}⚠️  Make sure to update the IP address in this script${NC}"
        ;;
    staging)
        API_URL="https://staging-api.reviewinn.com/api/v1"
        USE_MOCK="false"
        echo -e "${GREEN}📱 Building for: Staging${NC}"
        ;;
    prod)
        API_URL="https://api.reviewinn.com/api/v1"
        USE_MOCK="false"
        echo -e "${GREEN}📱 Building for: Production${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
        usage
        ;;
esac

echo -e "${BLUE}🔗 API URL: $API_URL${NC}"
echo -e "${BLUE}📊 Mock Data: $USE_MOCK${NC}"
echo ""

# Build command base
BUILD_ARGS="--dart-define=ENVIRONMENT=$ENVIRONMENT --dart-define=API_URL=$API_URL --dart-define=USE_MOCK_DATA=$USE_MOCK"

# Build based on platform
case $PLATFORM in
    android)
        echo -e "${YELLOW}🤖 Building Android APK...${NC}"
        flutter build apk $BUILD_ARGS --release
        echo -e "${GREEN}✅ Android build complete!${NC}"
        echo -e "${BLUE}📦 APK location: build/app/outputs/flutter-apk/app-release.apk${NC}"
        ;;
    ios)
        echo -e "${YELLOW}🍎 Building iOS...${NC}"
        flutter build ios $BUILD_ARGS --release
        echo -e "${GREEN}✅ iOS build complete!${NC}"
        ;;
    web)
        echo -e "${YELLOW}🌐 Building Web...${NC}"
        flutter build web $BUILD_ARGS --release
        echo -e "${GREEN}✅ Web build complete!${NC}"
        echo -e "${BLUE}📦 Web files location: build/web/${NC}"
        ;;
    all)
        echo -e "${YELLOW}🚀 Building all platforms...${NC}"
        echo ""
        
        echo -e "${YELLOW}🤖 Building Android...${NC}"
        flutter build apk $BUILD_ARGS --release
        
        echo ""
        echo -e "${YELLOW}🌐 Building Web...${NC}"
        flutter build web $BUILD_ARGS --release
        
        echo ""
        echo -e "${GREEN}✅ All builds complete!${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid platform: $PLATFORM${NC}"
        usage
        ;;
esac

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Build Completed! 🎉           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
