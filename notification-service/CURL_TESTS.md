# Notification Service - cURL Test Requests

The notification service is running on **port 5002** (mapped from container port 8080).

**Base URL:** `http://localhost:5002`

## Prerequisites

Most endpoints require the `X-User-Id` header for authentication (unless running in development mode without gateway). Replace `{userId}` with an actual user ID (e.g., `user-123` or a UUID).

---

## 1. Health Check Endpoints

### Health Check (with database connectivity test)
```bash
curl -X GET http://localhost:5002/api/health \
  -H "Content-Type: application/json"
```

**Expected Response (200 OK):**
```json
{
  "status": "Healthy",
  "timestamp": "2026-02-13T08:00:00Z",
  "database": "Connected",
  "version": "1.0.0.0"
}
```

### Ping Endpoint (simple service check)
```bash
curl -X GET http://localhost:5002/api/ping \
  -H "Content-Type: application/json"
```

**Expected Response (200 OK):**
```json
{
  "message": "pong",
  "timestamp": "2026-02-13T08:00:00Z"
}
```

---

## 2. Notification Preferences Endpoints

### Get User Notification Preferences
```bash
curl -X GET http://localhost:5002/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-123"
```

**Expected Response (200 OK):**
```json
{
  "userId": "user-123",
  "isEnabled": true,
  "preferredTimeUtc": "09:00:00",
  "timezone": "America/New_York",
  "lastUpdated": "2026-02-13T08:00:00Z"
}
```

**If preferences don't exist (404 Not Found):**
```json
{
  "error": "NotFound",
  "message": "User preferences not found. Please create preferences first.",
  "timestamp": "2026-02-13T08:00:00Z"
}
```

### Create/Update User Notification Preferences
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

**Expected Response (200 OK):**
```json
{
  "userId": "user-123",
  "isEnabled": true,
  "preferredTimeUtc": "09:00:00",
  "timezone": "America/New_York",
  "lastUpdated": "2026-02-13T08:00:00Z"
}
```

**Validation Error Example (400 Bad Request):**
```bash
curl -X POST http://localhost:5002/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-123" \
  -d '{
    "isEnabled": true,
    "preferredTimeUtc": "invalid-time",
    "timezone": ""
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "ValidationError",
  "message": "Invalid request data",
  "timestamp": "2026-02-13T08:00:00Z",
  "details": "PreferredTimeUtc must be in format HH:mm:ss (e.g., 09:00:00); Timezone cannot be empty"
}
```

---

## 3. Device Registration Endpoint

### Register Device Token for Push Notifications
```bash
curl -X POST http://localhost:5002/api/notifications/register-device \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-123" \
  -d '{
    "deviceToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
  }'
```

**Expected Response (200 OK):**
```json
{
  "userId": "user-123",
  "deviceToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "registeredAt": "2026-02-13T08:00:00Z",
  "message": "Device token registered successfully"
}
```

**Validation Error Example (400 Bad Request):**
```bash
curl -X POST http://localhost:5002/api/notifications/register-device \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-123" \
  -d '{
    "deviceToken": ""
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "ValidationError",
  "message": "Invalid request data",
  "timestamp": "2026-02-13T08:00:00Z",
  "details": "DeviceToken is required"
}
```

---

## 4. Testing Without Authentication (Development Mode)

If the service is configured with `Development:AllowTestingWithoutGateway: true`, you can test without the `X-User-Id` header. The development middleware will use a default test user.

**Note:** Check `appsettings.json` or environment variables to confirm if this is enabled.

---

## 5. Common Error Responses

### 401 Unauthorized (Missing User Context)
```json
{
  "error": "Unauthorized",
  "message": "User context is required. Please provide X-User-Id header.",
  "timestamp": "2026-02-13T08:00:00Z"
}
```

### 500 Internal Server Error
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred",
  "timestamp": "2026-02-13T08:00:00Z"
}
```

---

## 6. Complete Test Sequence

Here's a complete test sequence to verify all endpoints:

```bash
# 1. Health check
curl -X GET http://localhost:8082/api/health

# 2. Ping
curl -X GET http://localhost:8082/api/ping

# 3. Get preferences (should return 404 if not created yet)
curl -X GET http://localhost:5002/api/notifications/preferences \
  -H "X-User-Id: test-user-123"

# 4. Create preferences
curl -X POST http://localhost:5002/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-123" \
  -d '{
    "isEnabled": true,
    "preferredTimeUtc": "09:00:00",
    "timezone": "UTC"
  }'

# 5. Get preferences again (should return 200 with data)
curl -X GET http://localhost:5002/api/notifications/preferences \
  -H "X-User-Id: test-user-123"

# 6. Register device token
curl -X POST http://localhost:5002/api/notifications/register-device \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-123" \
  -d '{
    "deviceToken": "ExponentPushToken[test123456789]"
  }'

# 7. Update preferences
curl -X POST http://localhost:5002/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-123" \
  -d '{
    "isEnabled": false,
    "preferredTimeUtc": "18:00:00",
    "timezone": "America/Los_Angeles"
  }'
```

---

## Notes

- Replace `user-123` with actual user IDs from your authentication system
- The `preferredTimeUtc` must be in format `HH:mm:ss` (24-hour format)
- Timezone should be a valid IANA timezone identifier (e.g., `America/New_York`, `UTC`, `Europe/London`)
- Device tokens for Expo Push Notifications typically start with `ExponentPushToken[` and end with `]`
- All timestamps in responses are in UTC
