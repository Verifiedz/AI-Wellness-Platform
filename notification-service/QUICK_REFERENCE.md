# Notification Service - Quick Reference Card

**Base URL:** `http://localhost:5002`

---

## All Available Endpoints

### 1. Health & Monitoring
- `GET /api/health` - Health check with database connectivity
- `GET /api/ping` - Simple ping endpoint

### 2. User Preferences
- `GET /api/notifications/preferences` - Get user preferences (requires `X-User-Id` header)
- `POST /api/notifications/preferences` - Create/update preferences (requires `X-User-Id` header)

### 3. Device Registration
- `POST /api/notifications/register-device` - Register device token (requires `X-User-Id` header)

---

## Request/Response Examples

### Health Check
```bash
curl -X GET http://localhost:5002/api/health
```

### Get Preferences
```bash
curl -X GET http://localhost:5002/api/notifications/preferences \
  -H "X-User-Id: user-123"
```

### Create/Update Preferences
```bash
curl -X POST http://localhost:5002/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-123" \
  -d '{
    "isEnabled": true,
    "preferredTimeUtc": "09:00:00",
    "timezone": "America/New_York"
  }'
```

### Register Device
```bash
curl -X POST http://localhost:5002/api/notifications/register-device \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-123" \
  -d '{
    "deviceToken": "ExponentPushToken[xxxxxxxxxxxxx]"
  }'
```

---

## Service Features

✅ **Health Monitoring** - Database connectivity checks  
✅ **User Preferences** - CRUD operations  
✅ **Device Registration** - Push notification tokens  
✅ **Background Scheduler** - Automated daily notifications  
✅ **Wellness Tips** - 160+ tips across 8 categories  
✅ **Notification Logging** - Complete audit trail  
✅ **Distributed Locking** - Prevents duplicate notifications  
✅ **Error Handling** - Comprehensive validation  
✅ **Timezone Support** - Global user support  

---

## Background Services

- **NotificationScheduler** - Runs every 60 minutes
  - Finds users due for notification
  - Selects random wellness tip
  - Sends via Expo Push API
  - Logs all attempts

---

## Database Tables

1. `wellness_tips` - 160+ wellness tips
2. `user_notification_preferences` - User settings
3. `notification_logs` - Audit trail
4. `notification_locks` - Distributed locking

---

## Common Commands

```bash
# Check service status
docker ps | grep notification

# View logs
docker logs notification_service_api --tail=50

# View scheduler logs
docker logs notification_service_api | grep -i scheduler

# Restart service
docker-compose restart notification-service
```

---

## Error Codes

- `200 OK` - Success
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing X-User-Id header
- `404 Not Found` - Resource not found
- `503 Service Unavailable` - Database disconnected
