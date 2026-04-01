# Frontend UI/UX Audit Report

**Project:** Sakina - AI Wellness Platform
**Date:** 2026-03-30
**Scope:** Complete frontend analysis covering navigation, components, styling, accessibility, and screen-level UX patterns
**Files Analyzed:** 30 screens, 30 components, 8 navigation files, theme system, context providers

---

## Executive Summary

The frontend has a solid foundation with good theming, skeleton loaders, and animation patterns. However, there are **critical accessibility gaps**, **memory leaks**, **missing offline handling**, and several UX inconsistencies that need attention before production release.


| Severity | Count | Categories                                                  |
| -------- | ----- | ----------------------------------------------------------- |
| Critical | 12    | Accessibility, memory leaks, race conditions                |
| High     | 18    | Offline handling, touch targets, navigation, color contrast |
| Medium   | 30    | Refresh patterns, validation, haptics, responsive design    |
| Low      | 22    | Polish, text truncation, pagination, date formatting        |


---

## 1. ACCESSIBILITY (CRITICAL)

### 1.1 Missing Accessibility Attributes Across All Components

**Severity:** Critical

No interactive component in the codebase has `accessibilityLabel`, `accessibilityRole`, or `accessibilityHint`. This makes the app unusable for screen reader users.

**Affected files (every component):**

- `src/components/Button.js` - No accessibilityLabel or accessibilityRole="button"
- `src/components/Input.js` - TextInput has no accessibilityLabel, label not associated
- `src/components/Card.js` - No role defined
- `src/components/ProgressBar.js` - Missing accessibilityRole="progressbar"
- `src/components/VoiceInputButton.js` - No label for microphone button, no recording announcement
- `src/components/MoodSelector.js` - Mood buttons have no accessibilityLabel
- `src/components/ChipGroup.js` - No labels or roles for chips
- `src/components/ScoreGauge.js` - No aria-label equivalent for severity bands
- `src/components/CrisisButton.js` - Icon-only button with no label
- `src/components/SuggestionChip.js` - No accessibilityLabel
- `src/components/SectionHeader.js` - No accessibility attributes
- `src/components/Banner.js` - Close button has no label

### 1.2 Color Contrast Failures (WCAG AA)

**Severity:** High

File: `src/theme/colors.js`


| Token                | Value     | Background | Contrast Ratio | WCAG AA (4.5:1) |
| -------------------- | --------- | ---------- | -------------- | --------------- |
| Light `textLight`    | `#ABABAB` | `#FAF8F5`  | ~4.2:1         | FAIL            |
| Light `border`       | `#EDEBE8` | `#FAF8F5`  | ~1.4:1         | FAIL            |
| Dark `textLight`     | `#6B6B6B` | `#1A1D21`  | ~3.1:1         | FAIL            |
| Dark `textSecondary` | `#A0A0A0` | `#242830`  | ~3.4:1         | FAIL            |


**Fix:** Darken light theme text to `#808080`, lighten dark theme text to `#999999`, darken border to `#DDD8D3`.

### 1.3 Touch Targets Below 44x44 Minimum

**Severity:** High


| Component                     | Current Size                        | File:Line                                   |
| ----------------------------- | ----------------------------------- | ------------------------------------------- |
| CrisisButton                  | 36x36px                             | `src/components/CrisisButton.js:~line 36`   |
| PhotoAttachment remove button | 22x22px                             | `src/components/PhotoAttachment.js:204-206` |
| Banner close icon             | 32px effective (16px + 8px hitSlop) | `src/components/Banner.js:37-38`            |
| VoiceInputButton              | 40x40px                             | `src/components/VoiceInputButton.js`        |
| AccentPicker swatch           | 40x40px                             | Theme settings                              |


---

## 2. MEMORY LEAKS (CRITICAL)

### 2.1 Interval Timers Not Cleaned Up

**Severity:** Critical

**TwoFactorScreen.js (lines 32-45):**

- `setInterval()` started in useEffect for countdown
- If code expires, interval continues running
- `clearInterval()` only called when `remaining <= 0` but not guaranteed on unmount

**VerifyEmailScreen.js (lines 33-50):**

- Cooldown interval leaks when `startCooldown()` called multiple times
- Previous interval not cleared before starting new one
- `cooldownRef.current` overwritten without cleanup

**BreathingExerciseScreen.js (lines 76-90):**

- Timer interval not properly cleaned up on pause/stop
- `stopSession()` sets phase state but doesn't clear timer ref

### 2.2 Potential Unmounted State Updates

**Severity:** Medium

- `HomeScreen.js:88-93` - useFocusEffect callback has no cleanup function
- `JournalScreen.js:109-116` - Async load can update state after unmount
- `AIChatScreen.js:134-142` - Voice input transcript listener may fire after unmount

---

## 3. NAVIGATION ISSUES

### 3.1 Unreachable Screen

**Severity:** High

`ProfessionalDirectoryScreen` is registered in `src/navigation/SettingsStack.js:63` but no menu item in `SettingsScreen.js` links to it. The screen exists at `src/screens/ProfessionalDirectoryScreen.js` but is completely unreachable by users.

### 3.2 Sakina Tab Forces New Navigation Every Press

**Severity:** Medium

`src/navigation/MainTabs.js:114-124` - Every tab press on "Sakina" navigates to `ChatDrawer > AIChatConversation` with `forceNewAt: Date.now()`, creating redundant navigation events even if the user is already on the chat screen.

### 3.3 BreathingExercise Registered in Two Stacks

**Severity:** Medium

- Registered in `MainTabs.js:46` (HomeStack)
- Also registered in `ChatStack.js:462`
- Navigation from AIChatScreen (`line 230`) calls `navigation.navigate('BreathingExercise')` expecting ChatStack, but behavior differs by context. Back button behavior inconsistent between the two stacks.

### 3.4 Missing Back Gesture Guards

**Severity:** Medium

- `OnboardingStack.js:14-18` - No `gestureEnabled: false` on WelcomeScreen; users can accidentally swipe back
- `AuthStack.js:15` - Users can swipe back from TwoFactor to Login, breaking the auth flow

### 3.5 No Deep Linking Configuration

**Severity:** Low

`AppNavigator.js` NavigationContainer has no `linking` prop. Push notification navigation works via `navigationRef` but URL-based deep linking is not supported.

### 3.6 No Navigation State Persistence

**Severity:** Low

Navigation stack state not persisted across app restarts. Users always return to the Home tab.

---

## 4. OFFLINE & ERROR HANDLING

### 4.1 No Offline Detection

**Severity:** High

No screen implements offline detection. API failures are handled inconsistently:


| Screen                  | File:Line   | Behavior on Network Failure                                |
| ----------------------- | ----------- | ---------------------------------------------------------- |
| AssessmentHistoryScreen | lines 47-48 | **Silent failure** - empty catch block                     |
| CommunityScreen         | line 30     | **Silent failure** - empty catch block                     |
| GroupFeedScreen         | line 42     | **Silent failure** - empty catch block                     |
| JournalScreen           | lines 88-92 | Generic alert, doesn't distinguish network vs server error |
| MoodCalendarScreen      | line 67     | Banner shown but no retry button                           |
| HomeScreen              | lines 66-86 | No error handling for dashboard load                       |


**Fix:** Implement a `useNetworkStatus` hook and show a persistent "No network" banner when offline. Differentiate network errors from server errors in all API calls.

### 4.2 No Global Toast/Snackbar System

**Severity:** High

All user feedback uses `Alert.alert()` modal dialogs, which are disruptive. Success messages ("Saved", "Export Ready", "Code sent") should use non-blocking toast notifications.

**Affected screens:** AIChatScreen, AssessmentScreen, ExportScreen, ForgotPasswordScreen, GroupFeedScreen, JournalScreen, LoginScreen, NotificationSettingsScreen, ProfileSettingsScreen, RegisterScreen, ResetPasswordScreen

### 4.3 Missing Retry Buttons on Error States

**Severity:** Medium


| Screen             | Issue                                                   |
| ------------------ | ------------------------------------------------------- |
| JournalScreen      | Save failure shows Alert only, no retry                 |
| GroupFeedScreen    | Post failure clears content with no retry               |
| ExportScreen       | Export failure shows Alert, user must manually re-click |
| MoodCalendarScreen | Banner says "Tap to retry" but has no onPress handler   |


---

## 5. STATE MANAGEMENT & RACE CONDITIONS

### 5.1 AIChatScreen Race Condition

**Severity:** High

`src/screens/AIChatScreen.js:131-132, 236-250`

- `historyLoadedCount` ref could race with concurrent loads during rapid navigation
- `sendMessage` callback might use stale `activeSessionId`
- Session ID from response might be null/undefined, causing silent failure

### 5.2 JournalScreen Autosave Race

**Severity:** Medium

`src/screens/JournalScreen.js:207-224`

- `handleAutoSave()` reads `existingEntry?.id` which might be stale
- Autosave fires while form is being edited
- Race condition: user edits text while autosave is in-flight, potentially overwriting newer content

### 5.3 NotificationSettings Timezone Desync

**Severity:** Medium

`src/screens/NotificationSettingsScreen.js:41-70, 75-80`

- User can change timezone but time picker doesn't adjust immediately
- Server save might use different timezone than what's displayed

---

## 6. DATA REFRESH & PAGINATION

### 6.1 Missing Pull-to-Refresh

**Severity:** Medium

`MoodCalendarScreen.js` (line 271-276) - ScrollView has no RefreshControl. Users cannot refresh calendar data without navigating away.

### 6.2 Missing useFocusEffect for Data Refresh

**Severity:** Medium

Screens that don't refresh data when returning from another screen:

- `AIChatScreen.js:172-192` - History only loads on mount, not on focus
- `JournalScreen.js:109-116` - Entry loads once, stale if user navigates away and back
- `MoodCalendarScreen.js:73-75` - Data only loads on date change, not on focus

### 6.3 No Pagination for Large Datasets

**Severity:** Low

- `AssessmentHistoryScreen.js:40` - Hardcoded `limit: 50`, no "load more"
- `MoodCalendarScreen.js:60` - Hardcoded `limit: 366`
- `SettingsScreen.js:39-42` - Loads full 365 days for streak calculation

---

## 7. RESPONSIVE DESIGN

### 7.1 No SafeAreaView Usage

**Severity:** High

No screen uses `SafeAreaView` or `useSafeAreaInsets()`. Manual padding values (e.g., `paddingTop: 80`, `paddingBottom: 40`) are fragile and device-dependent.

### 7.2 Hardcoded Dimensions

**Severity:** Medium

All spacing, padding, and sizing use hardcoded pixel values with no `Dimensions`-based scaling:

- `HomeScreen.js` - `paddingHorizontal: 32` may not fit small devices
- `AIChatScreen.js` - Message bubble `maxWidth: '85%'` not responsive
- `CrisisResourceModal.js` - `maxHeight: '85%'` doesn't account for small screens

### 7.3 No Tablet/Landscape Support

**Severity:** Low

All layouts assume portrait phone orientation. No `numColumns` adjustments or max-width constraints for tablets.

---

## 8. DARK MODE

### 8.1 No System Dark Mode Detection

**Severity:** Medium

`src/context/ThemeContext.js` defaults to `isDarkMode: false`. Should detect `Appearance.getColorScheme()` on first launch and respect system preference.

### 8.2 Theme Transitions Not Animated

**Severity:** Low

When time-of-day period changes (morning to afternoon to evening), colors change instantly without any transition animation, causing a jarring visual shift.

---

## 9. FORM VALIDATION

### 9.1 Inconsistent Validation Patterns

**Severity:** Medium


| Screen                | Pattern                  | Issue                                 |
| --------------------- | ------------------------ | ------------------------------------- |
| RegisterScreen        | onBlur validation        | No real-time feedback while typing    |
| ResetPasswordScreen   | Submit-only validation   | Code input not validated until submit |
| ProfileSettingsScreen | Alert.alert() for errors | Should use inline errors              |
| ForgotPasswordScreen  | Submit-only validation   | Email not validated until submit      |


### 9.2 Missing Confirmation Dialogs

**Severity:** Medium

- `AIChatScreen.js` - No confirmation before deleting a session/conversation. Users can swipe-delete chats with no undo.

---

## 10. COMPONENT-LEVEL ISSUES

### 10.1 Haptic Feedback Underutilized

**Severity:** Medium

`useHaptic` hook exists but only used in 2 of 30+ components:

- Used: `MoodSelector.js`, `ChipGroup.js`
- Missing: `Button.js`, `Input.js` password toggle, all list item taps, navigation actions

### 10.2 Mixed Animation Libraries

**Severity:** Low

`MoodSelector.js:27-38` uses the old `Animated` API while most components use `react-native-reanimated`. Mixing libraries can cause unexpected behavior and increases bundle size.

### 10.3 Image Handling

**Severity:** Low

- No image caching strategy (no FastImage or equivalent)
- `PhotoAttachment.js:156-170` - No loading state during image processing
- No error boundary if image upload fails
- No `Image.prefetch()` for known images

---

## 11. DESTRUCTIVE ACTION PATTERNS

### 11.1 Chat Session Deletion

**Severity:** Medium

`ChatStack.js:241-255` - Swipe-to-delete on chat sessions has no confirmation dialog and no undo mechanism. Users can accidentally lose conversation history.

### 11.2 Good Patterns (Reference)

These screens handle destructive actions correctly:

- `JournalScreen.js:171-190` - Delete entry with Alert confirmation
- `SettingsScreen.js:70-86` - Logout and reset onboarding with confirmations
- `PrivacySettingsScreen.js:36-49` - Delete account with confirmation

---

## 12. TEXT & CONTENT

### 12.1 Text Overflow Handling

**Severity:** Low

- `CommunityScreen.js:97` - Group description truncated with `numberOfLines={2}` but no visual ellipsis indicator
- `GroupFeedScreen.js:132` - Post content not truncated, could break layout with long text
- `ProfessionalDirectoryScreen.js:77-84` - Professional name/specialty could overflow

### 12.2 Date Formatting Edge Cases

**Severity:** Low

- `AIChatScreen.js:44-48` - `formatMessageTime()` returns empty string on failure instead of "recent" or "unknown"
- `MoodCalendarScreen.js:99` - Week range may be ambiguous across year boundaries (e.g., "Dec 28 - Jan 3")

---

## Priority Action Plan

> **Model key:** Each task is assigned the optimal Claude model for execution.
>
> - **Sonnet** - Best coding model. Fast, high-quality code edits. Used for most implementation work.
> - **Opus** - Deepest reasoning. Used for architectural decisions, complex state logic, new system design.
> - **Haiku** - Lightweight. Used for repetitive, mechanical edits across many files.

### Phase 1: Critical Fixes


| #   | Task                                                                            | Model      | Rationale                                                                                                          |
| --- | ------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| 1   | Add `accessibilityLabel` and `accessibilityRole` to all interactive components  | **Haiku**  | Repetitive prop additions across 12+ component files. Mechanical, pattern-based edits.                             |
| 2   | Fix memory leaks in TwoFactorScreen, VerifyEmailScreen, BreathingExerciseScreen | **Sonnet** | Requires understanding useEffect cleanup, interval lifecycle, and ref patterns. Focused code fix.                  |
| 3   | Fix AIChatScreen race condition with stale sessionId                            | **Opus**   | Complex async state management with refs, callbacks, and concurrent navigation. Needs deep reasoning about timing. |
| 4   | Fix color contrast failures in theme                                            | **Haiku**  | Simple value changes in colors.js. Just updating hex codes to meet contrast ratios.                                |


### Phase 2: High Priority


| #   | Task                                                                  | Model      | Rationale                                                                                                                                             |
| --- | --------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5   | Implement offline detection and error handling across all screens     | **Opus**   | New cross-cutting system (hook + provider + per-screen integration). Architectural decision on error taxonomy.                                        |
| 6   | Fix touch targets below 44x44 (CrisisButton, PhotoAttachment, Banner) | **Haiku**  | Simple dimension/hitSlop value changes in 3 files.                                                                                                    |
| 7   | Add SafeAreaView/useSafeAreaInsets to all screens                     | **Haiku**  | Repetitive import + wrapper addition across many screen files. Mechanical pattern.                                                                    |
| 8   | Link ProfessionalDirectoryScreen in SettingsScreen menu               | **Haiku**  | Single menu item addition in one file.                                                                                                                |
| 9   | Implement global toast notification system                            | **Opus**   | New system: context provider, toast component, animation, auto-dismiss, then replacing Alert.alert() across 11+ screens. Architectural design needed. |
| 10  | Add retry buttons to all error states                                 | **Sonnet** | Moderate complexity. Needs to understand each screen's error flow and wire up retry callbacks.                                                        |


### Phase 3: Medium Priority


| #   | Task                                                       | Model      | Rationale                                                                                                                  |
| --- | ---------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| 11  | Fix Sakina tab double-navigation issue                     | **Sonnet** | Navigation logic fix. Needs to check current route before navigating. Focused but requires React Navigation understanding. |
| 12  | Add useFocusEffect for data refresh in stale screens       | **Sonnet** | Moderate refactor across 3-4 screens. Needs to understand existing data flow per screen.                                   |
| 13  | Add pull-to-refresh to MoodCalendarScreen                  | **Haiku**  | Simple RefreshControl addition to existing ScrollView.                                                                     |
| 14  | Implement system dark mode detection                       | **Sonnet** | Integrate Appearance API into ThemeContext. Moderate logic change in one file.                                             |
| 15  | Expand haptic feedback to all interactive components       | **Haiku**  | Repetitive hook import + trigger call additions across many components.                                                    |
| 16  | Add confirmation dialog for chat session deletion          | **Sonnet** | Needs to understand swipe-to-delete flow in ChatStack and add Alert.alert before executing delete.                         |
| 17  | Fix form validation consistency (inline errors everywhere) | **Sonnet** | Refactor validation patterns across 4 form screens. Needs to understand each form's state.                                 |
| 18  | Guard back gestures on onboarding and auth screens         | **Haiku**  | Simple `gestureEnabled: false` prop additions on specific navigator screens.                                               |


### Phase 4: Polish


| #   | Task                                                    | Model      | Rationale                                                                                                                |
| --- | ------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| 19  | Add deep linking configuration                          | **Opus**   | New linking config with route mapping for entire app. Architectural decision on URL scheme and path structure.           |
| 20  | Implement pagination for large datasets                 | **Sonnet** | Moderate refactor. Needs cursor/offset logic per screen and "load more" UI.                                              |
| 21  | Add navigation state persistence                        | **Sonnet** | React Navigation state persistence setup in AppNavigator. Moderate complexity.                                           |
| 22  | Fix text truncation indicators                          | **Haiku**  | Simple `numberOfLines` and `ellipsizeMode` prop additions.                                                               |
| 23  | Consolidate animation library (remove old Animated API) | **Sonnet** | Rewrite MoodSelector animation from Animated to Reanimated. Needs animation API knowledge.                               |
| 24  | Add image caching strategy                              | **Sonnet** | Evaluate and integrate caching library, update image components.                                                         |
| 25  | Animate theme transitions                               | **Sonnet** | Add interpolation/transition logic to ThemeContext color changes.                                                        |
| 26  | Add tablet/landscape support                            | **Opus**   | Responsive layout system design across entire app. Architectural decision on breakpoints, grid, and adaptive components. |


### Model Usage Summary


| Model      | Tasks                                         | Percentage                                   |
| ---------- | --------------------------------------------- | -------------------------------------------- |
| **Haiku**  | 1, 4, 6, 7, 8, 13, 15, 18, 22                 | 9/26 (35%) - Mechanical/repetitive edits     |
| **Sonnet** | 2, 10, 11, 12, 14, 16, 17, 20, 21, 23, 24, 25 | 12/26 (46%) - Focused implementation         |
| **Opus**   | 3, 5, 9, 19, 26                               | 5/26 (19%) - Architectural/complex reasoning |


