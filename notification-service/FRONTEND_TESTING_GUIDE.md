# Complete Notification Cycle Testing Guide - Frontend Integration

This guide walks you through testing the **complete notification cycle** from frontend to backend, including push notification delivery.

---

## Prerequisites

✅ **Backend Services Running:**
- Notification Service: `http://localhost:5002`
- Notification Database: Running on port 5433

✅ **Frontend Setup:**
- Node.js 18+ installed
- Expo CLI available (`npx expo`)
- Physical device (iOS or Android) - **Required for push notifications**
- Expo Go app installed on your device

---

## Step 1: Configure Frontend API Connection

### 1.1 Update Frontend Environment

The frontend needs to connect to your notification service. Update `frontend/.env`:

```bash
# Use your machine's local IP address (not localhost!)
# Find your IP:
# Windows: ipconfig
# Mac/Linux: ifconfig or ip addr

EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5002
EXPO_PUBLIC_DEV_MODE=true
```

**Example:**
```bash
EXPO_PUBLIC_API_URL=http://192.168.1.100:5002
EXPO_PUBLIC_DEV_MODE=true
```

**Important:** Use your **local network IP**, not `localhost` or `127.0.0.1`, because the mobile device needs to reach your computer over the network.

### 1.2 Verify Backend is Accessible

Test that your device can reach the backend:

```bash
# From your computer, verify the service is running
curl http://localhost:5002/api/health

# Test from your device's browser (use your local IP)
# Open: http://YOUR_LOCAL_IP:5002/api/health
```

---

## Step 2: Start the Frontend

### 2.1 Install Dependencies (if not done)

```bash
cd frontend
npm install
```

### 2.2 Start Expo Dev Server

```bash
npx expo start
```

This will:
- Start the Metro bundler
- Show a QR code
- Open Expo DevTools in your browser

### 2.3 Connect Your Device

**Option A: Expo Go (Recommended for Testing)**
1. Open Expo Go app on your phone
2. Scan the QR code from the terminal
3. The app will load on your device

**Option B: Development Build**
```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

---

## Step 3: Complete User Flow Testing

### 3.1 Login Flow

1. **Open the app** on your device
2. **Login Screen:**
   - Enter any User ID (e.g., `test-user-123`)
   - Optionally enter an email
   - Tap "Login"

**What Happens Automatically:**
- ✅ App requests notification permissions from OS
- ✅ Gets Expo Push Token from device
- ✅ Calls `POST /api/notifications/register-device` with token
- ✅ Device token saved to database

**Verify in Backend Logs:**
```bash
docker logs notification_service_api --tail=20 | grep -i "register"
```

You should see:
```
Registering device token for user test-user-123
Device token registered successfully
```

### 3.2 Configure Notification Preferences

1. **Navigate to Settings:**
   - Tap "Settings" tab (bottom navigation)
   - Tap "Notification Settings"

2. **Configure Preferences:**
   - Toggle "Daily Wellness Tips" **ON**
   - Select preferred time (e.g., 9:00 AM)
   - Timezone is auto-detected from device
   - Tap "Save Preferences"

**What Happens:**
- ✅ Calls `GET /api/notifications/preferences` (loads existing)
- ✅ Calls `POST /api/notifications/preferences` (saves)
- ✅ Time converted from local timezone to UTC
- ✅ Preferences saved to database

**Verify in Backend Logs:**
```bash
docker logs notification_service_api --tail=20 | grep -i "preferences"
```

You should see:
```
Getting preferences for user test-user-123
Updating preferences for user test-user-123
Successfully updated preferences
```

### 3.3 Verify Database State

Check that everything is saved correctly:

```bash
# Connect to notification database
docker exec -it notification-db psql -U postgres -d wellness_notifications

# Check user preferences
SELECT user_id, is_enabled, preferred_time_utc, timezone, device_token 
FROM user_notification_preferences;

# Check notification logs
SELECT * FROM notification_logs ORDER BY sent_at DESC LIMIT 5;
```

---

## Step 4: Test Notification Delivery

### 4.1 Understanding the Scheduler

The background scheduler runs **every 60 minutes** and:
1. Checks current UTC hour
2. Finds users whose `preferred_time_utc` matches current hour
3. Sends wellness tips to those users

**Note:** By default, it checks every hour, so you might need to wait up to 60 minutes for a notification.

### 4.2 Manual Testing (Trigger Notification Immediately)

For testing purposes, you can manually trigger a notification:

**Option A: Adjust User's Preferred Time**

1. Set user's preferred time to **current UTC hour**:
   ```bash
   # Get current UTC hour
   date -u +%H
   
   # Example: If current UTC hour is 14 (2 PM), set preferred time to 14:00:00
   ```

2. Update preferences in the app to match current hour

3. Wait for next scheduler run (or manually trigger - see below)

**Option B: Check Scheduler Logs**

Monitor when scheduler runs:
```bash
docker logs notification_service_api -f | grep -i "NotificationScheduler"
```

You'll see:
```
NotificationScheduler: Starting notification processing cycle
NotificationScheduler: Found X users due for notification at hour Y
Processing notification for user test-user-123
Successfully sent notification to user test-user-123 with tip X
```

### 4.3 Testing Notification Reception

**Foreground (App Open):**
1. Keep app open on Home screen
2. When notification arrives:
   - ✅ Notification banner appears
   - ✅ Tip automatically displayed on Home screen
   - ✅ "Tip of the Day" card shows the wellness tip

**Background (App Minimized):**
1. Minimize the app (press home button)
2. When notification arrives:
   - ✅ Notification appears in notification tray
   - ✅ Tap notification
   - ✅ App opens
   - ✅ Navigates to Home screen
   - ✅ Tip displayed in "Tip of the Day" card

**Killed (App Closed):**
1. Force close the app
2. When notification arrives:
   - ✅ Notification appears in notification tray
   - ✅ Tap notification
   - ✅ App launches
   - ✅ Navigates to Home screen
   - ✅ Tip displayed

---

## Step 5: End-to-End Test Checklist

Use this checklist to verify everything works:

### ✅ Setup Phase
- [ ] Backend services running (`docker-compose ps`)
- [ ] Frontend `.env` configured with correct IP
- [ ] Expo dev server started
- [ ] App loaded on physical device

### ✅ Login & Device Registration
- [ ] User can login with any User ID
- [ ] Notification permissions requested
- [ ] Device token obtained
- [ ] Device token registered with backend
- [ ] Backend logs show successful registration

### ✅ Preferences Configuration
- [ ] Can navigate to Notification Settings
- [ ] Preferences screen loads (or shows "not configured")
- [ ] Can toggle notifications ON/OFF
- [ ] Can select preferred time
- [ ] Timezone auto-detected correctly
- [ ] Can save preferences
- [ ] Success message shown
- [ ] Preferences persist after app restart

### ✅ Notification Delivery
- [ ] User preferences saved with correct UTC time
- [ ] Background scheduler running (check logs)
- [ ] Notification sent at correct time
- [ ] Notification received on device
- [ ] Tip displayed correctly in app
- [ ] Notification logged in database

### ✅ Error Handling
- [ ] App handles network errors gracefully
- [ ] App handles missing preferences (404)
- [ ] App shows error messages clearly
- [ ] App recovers from errors

---

## Step 6: Debugging Common Issues

### Issue: Device Token Not Registered

**Symptoms:**
- No device token in database
- Backend logs show registration failure

**Solutions:**
1. Check API URL is correct in `.env`
2. Verify device can reach backend (test in browser)
3. Check backend logs: `docker logs notification_service_api`
4. Ensure `EXPO_PUBLIC_DEV_MODE=true` is set
5. Check network connectivity (device and computer on same network)

### Issue: Preferences Not Saving

**Symptoms:**
- Save button doesn't work
- Error message shown

**Solutions:**
1. Check backend is running: `docker ps | grep notification`
2. Check API URL configuration
3. Verify user is logged in
4. Check backend logs for errors
5. Verify database is accessible

### Issue: Notifications Not Received

**Symptoms:**
- Preferences saved but no notifications arrive

**Solutions:**
1. **Check scheduler is running:**
   ```bash
   docker logs notification_service_api | grep -i scheduler
   ```

2. **Verify preferred time matches current UTC hour:**
   - Check user's `preferred_time_utc` in database
   - Compare with current UTC hour
   - Adjust preferred time to match current hour for testing

3. **Check notification logs:**
   ```bash
   docker exec -it notification-db psql -U postgres -d wellness_notifications \
     -c "SELECT * FROM notification_logs ORDER BY sent_at DESC LIMIT 5;"
   ```

4. **Verify device token is valid:**
   - Check token format: `ExponentPushToken[...]`
   - Ensure token is registered in database

5. **Check Expo Push API:**
   - Verify Expo project ID is configured
   - Check Expo Push service status

### Issue: App Can't Connect to Backend

**Symptoms:**
- Network errors in app
- API calls fail

**Solutions:**
1. **Verify IP address:**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   # or
   ip addr
   ```

2. **Test connectivity from device:**
   - Open browser on device
   - Navigate to: `http://YOUR_IP:5002/api/health`
   - Should see JSON response

3. **Check firewall:**
   - Ensure port 5002 is not blocked
   - Windows: Check Windows Firewall
   - Mac: Check System Preferences > Security & Privacy

4. **Verify same network:**
   - Device and computer must be on same Wi-Fi network

---

## Step 7: Advanced Testing Scenarios

### 7.1 Multiple Users

Test with multiple users to verify scalability:

1. **User 1:** Login as `user-001`, set time to 09:00
2. **User 2:** Login as `user-002`, set time to 14:00
3. **User 3:** Login as `user-003`, set time to 18:00

Verify each user receives notifications at their preferred time.

### 7.2 Timezone Testing

Test timezone conversion:

1. **User in EST (UTC-5):**
   - Set preferred time to 9:00 AM EST
   - Should convert to 14:00 UTC
   - Receives notification at 2 PM UTC

2. **User in PST (UTC-8):**
   - Set preferred time to 9:00 AM PST
   - Should convert to 17:00 UTC
   - Receives notification at 5 PM UTC

### 7.3 Notification Disabling

Test that disabled users don't receive notifications:

1. Toggle notifications OFF in settings
2. Verify `is_enabled = false` in database
3. Verify scheduler skips this user
4. Toggle back ON
5. Verify notifications resume

### 7.4 App State Testing

Test notifications in all app states:

1. **Foreground:** App open, notification appears
2. **Background:** App minimized, notification in tray
3. **Killed:** App closed, notification launches app
4. **Cold start:** App opened from notification

---

## Step 8: Monitoring & Verification

### 8.1 Backend Monitoring

**Watch scheduler logs in real-time:**
```bash
docker logs notification_service_api -f | grep -i scheduler
```

**Check notification logs:**
```bash
docker exec -it notification-db psql -U postgres -d wellness_notifications \
  -c "SELECT user_id, tip_id, status, sent_at, error_message 
      FROM notification_logs 
      ORDER BY sent_at DESC 
      LIMIT 10;"
```

### 8.2 Frontend Monitoring

**Check Expo logs:**
- Open Expo DevTools (usually opens automatically)
- Check console for API calls
- Look for errors or warnings

**Check device logs:**
```bash
# Android
adb logcat | grep -i "expo\|notification"

# iOS (requires Xcode)
# Open Xcode > Window > Devices and Simulators
# Select device > View Device Logs
```

### 8.3 Database Verification

**Check user preferences:**
```bash
docker exec -it notification-db psql -U postgres -d wellness_notifications \
  -c "SELECT user_id, is_enabled, preferred_time_utc, timezone, 
      LEFT(device_token, 30) as device_token_preview,
      updated_at 
      FROM user_notification_preferences;"
```

**Check notification history:**
```bash
docker exec -it notification-db psql -U postgres -d wellness_notifications \
  -c "SELECT 
      nl.id,
      nl.user_id,
      nl.tip_id,
      wt.category,
      nl.status,
      nl.sent_at,
      nl.error_message
      FROM notification_logs nl
      LEFT JOIN wellness_tips wt ON nl.tip_id = wt.id
      ORDER BY nl.sent_at DESC
      LIMIT 20;"
```

---

## Step 9: Quick Test Script

For rapid testing, use this sequence:

```bash
# 1. Verify backend is running
curl http://localhost:5002/api/health

# 2. Check current UTC hour
date -u +%H

# 3. Set user's preferred time to current UTC hour (via app or direct DB update)

# 4. Monitor scheduler
docker logs notification_service_api -f | grep -i "NotificationScheduler\|Processing notification"

# 5. Check notification logs
docker exec -it notification-db psql -U postgres -d wellness_notifications \
  -c "SELECT * FROM notification_logs ORDER BY sent_at DESC LIMIT 5;"
```

---

## Summary

The complete notification cycle:

1. **User logs in** → Device token registered
2. **User configures preferences** → Saved to database
3. **Background scheduler runs** → Checks for users due
4. **Notification sent** → Via Expo Push API
5. **Device receives notification** → Displayed to user
6. **App shows tip** → In "Tip of the Day" card
7. **Notification logged** → In database for audit

**Key Points:**
- ✅ Use physical device (not emulator) for push notifications
- ✅ Use local network IP (not localhost) for API URL
- ✅ Scheduler runs every 60 minutes by default
- ✅ Set preferred time to current UTC hour for immediate testing
- ✅ Monitor logs to verify each step

---

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Can't connect to backend | Check IP address, firewall, same network |
| Device token not registered | Verify API URL, check backend logs |
| Preferences not saving | Check backend running, verify API URL |
| No notifications received | Check scheduler logs, verify preferred time matches UTC hour |
| Notification received but not displayed | Check app logs, verify notification listeners |

---

**Happy Testing! 🚀**
