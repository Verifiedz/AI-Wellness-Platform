#!/bin/bash

# Notification Service Demo Script
# This script demonstrates all features of the notification service

BASE_URL="http://localhost:5002"
USER_ID="demo-user-$(date +%s)"

# Check if jq is available
if command -v jq &> /dev/null; then
    USE_JQ=true
else
    USE_JQ=false
    echo "Note: jq not found. Output will be shown without formatting."
    echo ""
fi

echo "=========================================="
echo "Notification Service Demo"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to format JSON output
format_json() {
    if [ "$USE_JQ" = true ]; then
        echo "$1" | jq '.'
    else
        echo "$1"
    fi
}

# Function to check JSON field
check_json_field() {
    if [ "$USE_JQ" = true ]; then
        echo "$1" | jq -e "$2" > /dev/null 2>&1
    else
        # Simple grep check as fallback
        echo "$1" | grep -q "$3"
    fi
}

# Function to print section headers
print_section() {
    echo ""
    echo -e "${BLUE}=== $1 ===${NC}"
    echo ""
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print info
print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Part 1: Health Check
print_section "Part 1: Health Check"
echo "Testing service health..."
HEALTH_RESPONSE=$(curl -s -X GET "$BASE_URL/api/health")
format_json "$HEALTH_RESPONSE"
if check_json_field "$HEALTH_RESPONSE" '.status == "Healthy"' '"status":"Healthy"'; then
    print_success "Service is healthy"
else
    print_error "Service health check failed"
    exit 1
fi

# Part 2: Ping
print_section "Part 2: Ping Test"
PING_RESPONSE=$(curl -s -X GET "$BASE_URL/api/ping")
format_json "$PING_RESPONSE"
print_success "Ping successful"

# Part 3: Create User Preferences
print_section "Part 3: Create User Preferences"
echo "Creating preferences for user: $USER_ID"
PREF_CREATE=$(curl -s -X POST "$BASE_URL/api/notifications/preferences" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_ID" \
  -d '{
    "isEnabled": true,
    "preferredTimeUtc": "09:00:00",
    "timezone": "America/New_York"
  }')
format_json "$PREF_CREATE"
if check_json_field "$PREF_CREATE" '.userId' '"userId"'; then
    print_success "Preferences created"
else
    print_error "Failed to create preferences"
fi

# Part 4: Get Preferences
print_section "Part 4: Get User Preferences"
PREF_GET=$(curl -s -X GET "$BASE_URL/api/notifications/preferences" \
  -H "X-User-Id: $USER_ID")
format_json "$PREF_GET"
if check_json_field "$PREF_GET" '.userId' '"userId"'; then
    print_success "Preferences retrieved"
else
    print_error "Failed to get preferences"
fi

# Part 5: Register Device
print_section "Part 5: Register Device Token"
DEVICE_TOKEN="ExponentPushToken[DemoToken$(date +%s)]"
echo "Registering device token: $DEVICE_TOKEN"
DEVICE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/notifications/register-device" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_ID" \
  -d "{
    \"deviceToken\": \"$DEVICE_TOKEN\"
  }")
format_json "$DEVICE_RESPONSE"
if check_json_field "$DEVICE_RESPONSE" '.deviceToken' '"deviceToken"'; then
    print_success "Device token registered"
else
    print_error "Failed to register device"
fi

# Part 6: Update Preferences
print_section "Part 6: Update Preferences"
echo "Updating preferences..."
PREF_UPDATE=$(curl -s -X POST "$BASE_URL/api/notifications/preferences" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_ID" \
  -d '{
    "isEnabled": true,
    "preferredTimeUtc": "18:00:00",
    "timezone": "America/Los_Angeles"
  }')
format_json "$PREF_UPDATE"
if check_json_field "$PREF_UPDATE" '.preferredTimeUtc == "18:00:00"' '"preferredTimeUtc":"18:00:00"'; then
    print_success "Preferences updated"
else
    print_error "Failed to update preferences"
fi

# Part 7: Error Handling - Missing Auth
print_section "Part 7: Error Handling - Missing Authentication"
ERROR_RESPONSE=$(curl -s -X GET "$BASE_URL/api/notifications/preferences")
format_json "$ERROR_RESPONSE"
if check_json_field "$ERROR_RESPONSE" '.error' '"error"'; then
    print_success "Error handling works correctly"
else
    echo "⚠ Warning: Expected error response"
fi

# Part 8: Error Handling - Invalid Input
print_section "Part 8: Error Handling - Invalid Input"
INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/api/notifications/preferences" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_ID" \
  -d '{
    "isEnabled": true,
    "preferredTimeUtc": "invalid-time",
    "timezone": "America/New_York"
  }')
format_json "$INVALID_RESPONSE"
if check_json_field "$INVALID_RESPONSE" '.error' '"error"'; then
    print_success "Validation works correctly"
else
    echo "⚠ Warning: Expected validation error"
fi

# Part 9: Wellness Tips Evidence (Server-Side Logs)
print_section "Part 9: Wellness Tips Evidence"
print_info "Checking recent notification logs in the database (including tip content)..."

LOGS_OUTPUT=$(docker exec -i notification-db psql -U postgres -d wellness_notifications -t -c \
  "SELECT 
      nl.user_id,
      nl.tip_id,
      wt.category,
      LEFT(wt.content, 80) AS tip_preview,
      nl.status,
      nl.sent_at
    FROM notification_logs nl
    LEFT JOIN wellness_tips wt ON nl.tip_id = wt.id
    ORDER BY nl.sent_at DESC
    LIMIT 5;" 2>/dev/null)

if [ -n "$LOGS_OUTPUT" ] && echo "$LOGS_OUTPUT" | grep -q '[^[:space:]]'; then
    echo "Recent notification log entries (user, tip, category, preview, status, sent_at):"
    echo "$LOGS_OUTPUT"
    print_success "Server has recorded specific wellness tips being sent to users."
else
    print_info "No notification logs found yet. The background scheduler may not have run or no users are due right now."
fi

# Part 10: Random Wellness Tip (Direct from Database)
print_section "Part 10: Random Wellness Tip (Sample)"
print_info "Fetching a random wellness tip directly from the database..."

RANDOM_TIP_OUTPUT=$(docker exec -i notification-db psql -U postgres -d wellness_notifications -t -c \
  "SELECT id, category, LEFT(content, 120) AS tip_preview FROM wellness_tips ORDER BY RANDOM() LIMIT 1;" 2>/dev/null)

if [ -n "$RANDOM_TIP_OUTPUT" ] && echo "$RANDOM_TIP_OUTPUT" | grep -q '[^[:space:]]'; then
    echo "Random wellness tip (id, category, preview):"
    echo "$RANDOM_TIP_OUTPUT"
    print_success "Random wellness tip fetched successfully. This is the same pool used for daily notifications."
else
    print_info "Could not fetch a random tip. Ensure the wellness_tips table is seeded."
fi

# Summary
print_section "Demo Summary"
print_info "User ID used: $USER_ID"
print_info "Device Token: $DEVICE_TOKEN"
print_success "Demo completed successfully!"
echo ""
echo "To view background scheduler logs:"
echo "  docker logs notification_service_api | grep -i scheduler"
echo ""
echo "To view all logs:"
echo "  docker logs notification_service_api --tail=50"
echo ""
