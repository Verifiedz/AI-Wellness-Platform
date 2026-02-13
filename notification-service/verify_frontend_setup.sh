#!/bin/bash

# Frontend Setup Verification Script
# This script helps verify that your frontend can connect to the notification service

echo "=========================================="
echo "Frontend Setup Verification"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if docker is running
echo -e "${BLUE}1. Checking Docker...${NC}"
if docker ps > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker is running${NC}"
else
    echo -e "${RED}✗ Docker is not running${NC}"
    exit 1
fi

# Check if notification service is running
echo -e "\n${BLUE}2. Checking Notification Service...${NC}"
if docker ps | grep -q notification_service_api; then
    echo -e "${GREEN}✓ Notification service is running${NC}"
    SERVICE_IP=$(docker inspect notification_service_api | grep -i "gateway" | head -1 | cut -d'"' -f4 || echo "localhost")
else
    echo -e "${RED}✗ Notification service is not running${NC}"
    echo "  Start it with: docker-compose up -d notification-service"
    exit 1
fi

# Check service health
echo -e "\n${BLUE}3. Checking Service Health...${NC}"
HEALTH=$(curl -s http://localhost:5002/api/health 2>/dev/null)
if echo "$HEALTH" | grep -q "Healthy"; then
    echo -e "${GREEN}✓ Service is healthy${NC}"
    echo "  Response: $HEALTH"
else
    echo -e "${RED}✗ Service health check failed${NC}"
    echo "  Response: $HEALTH"
fi

# Get local IP address
echo -e "\n${BLUE}4. Finding Your Local IP Address...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows Git Bash
    LOCAL_IP=$(ipconfig | grep "IPv4" | head -1 | awk '{print $NF}' | tr -d '\r')
else
    LOCAL_IP="<unknown>"
fi

if [ -n "$LOCAL_IP" ] && [ "$LOCAL_IP" != "<unknown>" ]; then
    echo -e "${GREEN}✓ Found IP: $LOCAL_IP${NC}"
else
    echo -e "${YELLOW}⚠ Could not auto-detect IP${NC}"
    echo "  Please find your IP manually:"
    echo "    Windows: ipconfig"
    echo "    Mac/Linux: ifconfig or ip addr"
    LOCAL_IP="<your-ip-here>"
fi

# Check frontend .env file
echo -e "\n${BLUE}5. Checking Frontend Configuration...${NC}"
if [ -f "../frontend/.env" ]; then
    echo -e "${GREEN}✓ Frontend .env file exists${NC}"
    ENV_API_URL=$(grep "EXPO_PUBLIC_API_URL" ../frontend/.env | cut -d'=' -f2)
    if [ -n "$ENV_API_URL" ]; then
        echo "  Current API URL: $ENV_API_URL"
        if echo "$ENV_API_URL" | grep -q "localhost\|127.0.0.1"; then
            echo -e "${YELLOW}⚠ Warning: Using localhost/127.0.0.1${NC}"
            echo "  Mobile devices need your network IP, not localhost"
            echo "  Update frontend/.env with: EXPO_PUBLIC_API_URL=http://$LOCAL_IP:5002"
        elif echo "$ENV_API_URL" | grep -q "$LOCAL_IP"; then
            echo -e "${GREEN}✓ API URL uses your local IP${NC}"
        else
            echo -e "${YELLOW}⚠ API URL doesn't match detected IP${NC}"
            echo "  Detected IP: $LOCAL_IP"
            echo "  Configured URL: $ENV_API_URL"
        fi
    fi
else
    echo -e "${YELLOW}⚠ Frontend .env file not found${NC}"
    echo "  Create frontend/.env with:"
    echo "    EXPO_PUBLIC_API_URL=http://$LOCAL_IP:5002"
    echo "    EXPO_PUBLIC_DEV_MODE=true"
fi

# Test API accessibility
echo -e "\n${BLUE}6. Testing API Accessibility...${NC}"
if [ -n "$LOCAL_IP" ] && [ "$LOCAL_IP" != "<unknown>" ] && [ "$LOCAL_IP" != "<your-ip-here>" ]; then
    TEST_URL="http://$LOCAL_IP:5002/api/health"
    echo "  Testing: $TEST_URL"
    TEST_RESPONSE=$(curl -s "$TEST_URL" 2>/dev/null)
    if echo "$TEST_RESPONSE" | grep -q "Healthy"; then
        echo -e "${GREEN}✓ API is accessible from network IP${NC}"
    else
        echo -e "${RED}✗ API not accessible from network IP${NC}"
        echo "  This means your mobile device won't be able to connect"
        echo "  Check firewall settings and ensure port 5002 is open"
    fi
else
    echo -e "${YELLOW}⚠ Skipping network test (IP not detected)${NC}"
fi

# Summary
echo -e "\n${BLUE}=========================================="
echo "Summary"
echo "==========================================${NC}"
echo ""
echo "To test the complete notification cycle:"
echo ""
echo "1. Update frontend/.env:"
echo "   EXPO_PUBLIC_API_URL=http://$LOCAL_IP:5002"
echo "   EXPO_PUBLIC_DEV_MODE=true"
echo ""
echo "2. Start frontend:"
echo "   cd ../frontend"
echo "   npx expo start"
echo ""
echo "3. Open Expo Go on your device and scan QR code"
echo ""
echo "4. Login with any User ID"
echo ""
echo "5. Configure notification preferences in Settings"
echo ""
echo "6. Monitor backend logs:"
echo "   docker logs notification_service_api -f | grep -i scheduler"
echo ""
echo "For detailed testing guide, see: FRONTEND_TESTING_GUIDE.md"
echo ""
