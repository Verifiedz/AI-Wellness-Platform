# Notification Service - Complete Demo Script

**Service URL:** `http://localhost:5002`

This script demonstrates all features of the Notification Service for your professor.

---

## Demo Overview

The Notification Service provides:
1. ✅ **Health Monitoring** - Service and database connectivity checks
2. ✅ **User Preferences Management** - CRUD operations for notification settings
3. ✅ **Device Registration** - Push notification token management
4. ✅ **Background Scheduler** - Automated daily wellness tip delivery
5. ✅ **Wellness Tips Database** - 160+ tips across 8 categories
6. ✅ **Notification Logging** - Complete audit trail of all notifications
7. ✅ **Distributed Locking** - Prevents duplicate notifications in multi-instance deployments

---

## Part 1: Service Health & Infrastructure ✅

### 1.1 Health Check (Database Connectivity)
```bash
curl -X GET http://localhost:5002/api/health \
  -H "Content-Type: application/json" | jq
```

**Expected Response:**
```json
{
  "status": "Healthy",
  "timestamp": "2026-02-13T08:00:00Z",
  "database": "Connected",
  "version": "1.0.0.0"
}
```

**Demo Points:**
- ✅ Service is running and healthy
- ✅ Database connectivity verified
- ✅ Version information available

### 1.2 Ping Endpoint (Quick Service Check)
```bash
curl -X GET http://localhost:5002/api/ping \
  -H "Content-Type: application/json" | jq
```

**Expected Response:**
```json
{
  "message": "pong",
  "timestamp": "2026-02-13T08:00:00Z"
}
```

**Demo Points:**
- ✅ Service is responsive
- ✅ Low-latency endpoint for monitoring

---

## Part 2: User Onboarding Flow 👤

### 2.1 Create User Preferences (New User)
```bash
curl -X POST http://localhost:5002/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "X-User-Id: demo-user-001" \
  -d '{
    "isEnabled": true,
    "preferredTimeUtc": "09:00:00",
    "timezone": "America/New_York"
  }' | jq
```

**Expected Response:**
```json
{
  "userId": "demo-user-001",
  "isEnabled": true,
  "preferredTimeUtc": "09:00:00",
  "timezone": "America/New_York",
  "lastUpdated": "2026-02-13T08:00:00Z"
}
```

**Demo Points:**
- ✅ User preferences created successfully
- ✅ Timezone support for global users
- ✅ Customizable notification time

### 2.2 Get User Preferences
```bash
curl -X GET http://localhost:5002/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "X-User-Id: demo-user-001" | jq
```

**Demo Points:**
- ✅ Preferences retrieval works
- ✅ Data persistence verified

### 2.3 Register Device Token (Push Notifications)
```bash
curl -X POST http://localhost:5002/api/notifications/register-device \
  -H "Content-Type: application/json" \
  -H "X-User-Id: demo-user-001" \
  -d '{
    "deviceToken": "ExponentPushToken[DemoToken123456789]"
  }' | jq
```

**Expected Response:**
```json
{
  "userId": "demo-user-001",
  "deviceToken": "ExponentPushToken[DemoToken123456789]",
  "registeredAt": "2026-02-13T08:00:00Z",
  "message": "Device token registered successfully"
}
```

**Demo Points:**
- ✅ Device token registered
- ✅ Supports Expo Push Notifications (iOS & Android)
- ✅ Token linked to user account

### 2.4 Update Preferences (User Changes Settings)
```bash
curl -X POST http://localhost:5002/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "X-User-Id: demo-user-001" \
  -d '{
    "isEnabled": true,
    "preferredTimeUtc": "18:00:00",
    "timezone": "America/Los_Angeles"
  }' | jq
```

**Demo Points:**
- ✅ Preferences can be updated
- ✅ Time changes reflected immediately
- ✅ Timezone conversion handled

---

## Part 3: Multiple Users (Scalability Demo) 👥

### 3.1 Create Second User
```bash
curl -X POST http://localhost:5002/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "X-User-Id: demo-user-002" \
  -d '{
    "isEnabled": true,
    "preferredTimeUtc": "14:00:00",
    "timezone": "UTC"
  }' | jq

curl -X POST http://localhost:5002/api/notifications/register-device \
  -H "Content-Type: application/json" \
  -H "X-User-Id: demo-user-002" \
  -d '{
    "deviceToken": "ExponentPushToken[DemoToken987654321]"
  }' | jq
```

**Demo Points:**
- ✅ Multiple users supported
- ✅ Each user has independent preferences
- ✅ Scalable architecture

### 3.2 Create Third User (Different Timezone)
```bash
curl -X POST http://localhost:5002/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "X-User-Id: demo-user-003" \
  -d '{
    "isEnabled": true,
    "preferredTimeUtc": "07:00:00",
    "timezone": "Europe/London"
  }' | jq

curl -X POST http://localhost:5002/api/notifications/register-device \
  -H "Content-Type: application/json" \
  -H "X-User-Id: demo-user-003" \
  -d '{
    "deviceToken": "ExponentPushToken[DemoToken555666777]"
  }' | jq
```

**Demo Points:**
- ✅ Global timezone support
- ✅ UTC time conversion handled automatically

---

## Part 4: Error Handling & Validation 🛡️

### 4.1 Missing User ID (401 Unauthorized)
```bash
curl -X GET http://localhost:5002/api/notifications/preferences \
  -H "Content-Type: application/json" | jq
```

**Expected Response:**
```json
{
  "error": "Unauthorized",
  "message": "User context is required. Please provide X-User-Id header.",
  "timestamp": "2026-02-13T08:00:00Z"
}
```

**Demo Points:**
- ✅ Authentication enforced
- ✅ Clear error messages
- ✅ Proper HTTP status codes

### 4.2 Invalid Time Format (400 Bad Request)
```bash
curl -X POST http://localhost:5002/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "X-User-Id: demo-user-001" \
  -d '{
    "isEnabled": true,
    "preferredTimeUtc": "invalid-time",
    "timezone": "America/New_York"
  }' | jq
```

**Expected Response:**
```json
{
  "error": "ValidationError",
  "message": "Invalid request data",
  "timestamp": "2026-02-13T08:00:00Z",
  "details": "PreferredTimeUtc must be in format HH:mm:ss (e.g., 09:00:00)"
}
```

**Demo Points:**
- ✅ Input validation
- ✅ Detailed error messages
- ✅ Prevents invalid data

### 4.3 Empty Device Token (400 Bad Request)
```bash
curl -X POST http://localhost:5002/api/notifications/register-device \
  -H "Content-Type: application/json" \
  -H "X-User-Id: demo-user-001" \
  -d '{
    "deviceToken": ""
  }' | jq
```

**Demo Points:**
- ✅ Required field validation
- ✅ Prevents empty tokens

### 4.4 Get Preferences for Non-Existent User (404 Not Found)
```bash
curl -X GET http://localhost:5002/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "X-User-Id: non-existent-user" | jq
```

**Expected Response:**
```json
{
  "error": "NotFound",
  "message": "User preferences not found. Please create preferences first.",
  "timestamp": "2026-02-13T08:00:00Z"
}
```

**Demo Points:**
- ✅ Proper 404 handling
- ✅ Helpful error messages

---

## Part 5: Background Scheduler Demonstration ⏰

### 5.1 Check Scheduler Logs
```bash
docker logs notification_service_api --tail=50 | grep -i "NotificationScheduler"
```

**What to Show:**
- ✅ Scheduler runs automatically every 60 minutes (configurable)
- ✅ Processes users due for notification at current hour
- ✅ Uses distributed locking to prevent duplicates
- ✅ Logs success/failure for each notification

### 5.2 Scheduler Features to Highlight:

**Distributed Locking:**
- Uses PostgreSQL advisory locks
- Prevents duplicate notifications in multi-instance deployments
- Ensures exactly-once delivery

**Smart Tip Selection:**
- Avoids sending same tip within 30 days
- Random selection from 160+ wellness tips
- 8 categories: sleep, study, exercise, nutrition, mental_health, social, organization, mindfulness

**Retry Logic:**
- Automatic retries for failed notifications
- Configurable retry attempts and delays
- Comprehensive error logging

---

## Part 6: Database Architecture & Features 🗄️

### 6.1 Database Tables (Explain Structure)

**Tables:**
1. **wellness_tips** - 160+ pre-generated tips across 8 categories
2. **user_notification_preferences** - User settings and device tokens
3. **notification_logs** - Complete audit trail of all notifications
4. **notification_locks** - Distributed locking mechanism

### 6.2 Stored Procedures (Explain Benefits)

**Key Procedures:**
- `sp_get_user_preferences` - Retrieve user settings
- `sp_upsert_user_preferences` - Create/update preferences
- `sp_get_random_wellness_tip` - Smart tip selection (excludes recent tips)
- `sp_get_users_due_for_notification` - Find users ready for notifications
- `sp_log_notification_attempt` - Log all notification attempts

**Benefits:**
- ✅ Performance optimization
- ✅ Business logic in database
- ✅ Security (SQL injection prevention)
- ✅ Maintainability

### 6.3 Wellness Tips Database

**Categories:**
- Sleep & Rest (20 tips)
- Study Habits & Productivity (25 tips)
- Physical Exercise & Movement (20 tips)
- Nutrition & Hydration (20 tips)
- Mental Health & Stress Management (25 tips)
- Social Connection (15 tips)
- Time Management & Organization (15 tips)
- Mindfulness & Self-Care (20 tips)

**Total: 160 wellness tips**

---

## Part 7: Complete User Journey Demo 🎯

### Step-by-Step Complete Flow:

```bash
# 1. Health Check
echo "=== Step 1: Health Check ==="
curl -X GET http://localhost:5002/api/health | jq

# 2. New User Onboarding
echo -e "\n=== Step 2: Create User Preferences ==="
curl -X POST http://localhost:5002/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "X-User-Id: professor-demo-user" \
  -d '{
    "isEnabled": true,
    "preferredTimeUtc": "10:00:00",
    "timezone": "America/New_York"
  }' | jq

# 3. Register Device
echo -e "\n=== Step 3: Register Device Token ==="
curl -X POST http://localhost:5002/api/notifications/register-device \
  -H "Content-Type: application/json" \
  -H "X-User-Id: professor-demo-user" \
  -d '{
    "deviceToken": "ExponentPushToken[ProfessorDemoToken123]"
  }' | jq

# 4. Verify Preferences
echo -e "\n=== Step 4: Verify Preferences ==="
curl -X GET http://localhost:5002/api/notifications/preferences \
  -H "X-User-Id: professor-demo-user" | jq

# 5. Update Preferences
echo -e "\n=== Step 5: Update Preferences ==="
curl -X POST http://localhost:5002/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "X-User-Id: professor-demo-user" \
  -d '{
    "isEnabled": true,
    "preferredTimeUtc": "20:00:00",
    "timezone": "America/Los_Angeles"
  }' | jq

# 6. Final Verification
echo -e "\n=== Step 6: Final Verification ==="
curl -X GET http://localhost:5002/api/notifications/preferences \
  -H "X-User-Id: professor-demo-user" | jq
```

---

## Part 8: Architecture Highlights 🏗️

### 8.1 Key Features to Highlight:

**1. Microservices Architecture**
- ✅ Independent service
- ✅ Database isolation
- ✅ Scalable design

**2. Background Processing**
- ✅ Scheduled notifications
- ✅ Distributed locking
- ✅ Retry mechanisms

**3. Push Notification Support**
- ✅ Expo Push API (iOS & Android)
- ✅ Firebase support (optional)
- ✅ Device token management

**4. Data Persistence**
- ✅ PostgreSQL database
- ✅ Stored procedures for business logic
- ✅ Complete audit trail

**5. Error Handling**
- ✅ Comprehensive validation
- ✅ Clear error messages
- ✅ Proper HTTP status codes

**6. Security**
- ✅ User authentication via headers
- ✅ SQL injection prevention
- ✅ Input validation

**7. Observability**
- ✅ Health check endpoints
- ✅ Structured logging
- ✅ Notification logs

---

## Part 9: Testing Scenarios Checklist ✅

Use this checklist during your demo:

- [ ] Service health check returns "Healthy"
- [ ] Database connectivity verified
- [ ] Create user preferences successfully
- [ ] Retrieve user preferences
- [ ] Register device token
- [ ] Update preferences
- [ ] Multiple users supported
- [ ] Different timezones handled
- [ ] Missing authentication returns 401
- [ ] Invalid input returns 400 with details
- [ ] Non-existent user returns 404
- [ ] Background scheduler running (check logs)
- [ ] Wellness tips database populated (160 tips)
- [ ] Notification logs created
- [ ] Error handling works correctly

---

## Part 10: Quick Demo Script (5 Minutes) ⚡

If you have limited time, run this condensed version:

```bash
# 1. Health Check
curl -X GET http://localhost:5002/api/health | jq

# 2. Create User & Register Device
curl -X POST http://localhost:5002/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "X-User-Id: quick-demo-user" \
  -d '{"isEnabled":true,"preferredTimeUtc":"09:00:00","timezone":"UTC"}' | jq

curl -X POST http://localhost:5002/api/notifications/register-device \
  -H "Content-Type: application/json" \
  -H "X-User-Id: quick-demo-user" \
  -d '{"deviceToken":"ExponentPushToken[QuickDemo123]"}' | jq

# 3. Verify & Update
curl -X GET http://localhost:5002/api/notifications/preferences \
  -H "X-User-Id: quick-demo-user" | jq

# 4. Show Error Handling
curl -X GET http://localhost:5002/api/notifications/preferences | jq

# 5. Show Scheduler Logs
docker logs notification_service_api --tail=20 | grep -i scheduler
```

---

## Additional Talking Points 🎤

### For Your Presentation:

1. **Scalability:**
   - "The service supports unlimited users with independent preferences"
   - "Background scheduler handles thousands of users efficiently"
   - "Distributed locking ensures no duplicate notifications"

2. **Reliability:**
   - "Comprehensive error handling and retry mechanisms"
   - "Complete audit trail via notification logs"
   - "Health checks for monitoring and alerting"

3. **User Experience:**
   - "Users can customize notification time and timezone"
   - "160+ wellness tips prevent repetition"
   - "Smart tip selection avoids sending same tip within 30 days"

4. **Technical Excellence:**
   - "Uses stored procedures for performance"
   - "PostgreSQL advisory locks for distributed systems"
   - "RESTful API design with proper HTTP status codes"
   - "Structured logging for observability"

---

## Notes for Demo Day 📝

1. **Before Demo:**
   - Ensure notification service is running: `docker-compose ps`
   - Test health endpoint to verify connectivity
   - Have terminal ready with curl commands

2. **During Demo:**
   - Explain each step as you execute it
   - Show the JSON responses
   - Highlight error handling examples
   - Mention background scheduler (show logs)

3. **If Something Fails:**
   - Check service logs: `docker logs notification_service_api`
   - Verify database is running: `docker ps | grep notification-db`
   - Restart if needed: `docker-compose restart notification-service`

4. **Key Metrics to Mention:**
   - 160+ wellness tips
   - 8 categories
   - Supports all timezones
   - Background scheduler runs every 60 minutes
   - Distributed locking prevents duplicates

---

**Good luck with your demo! 🚀**
