# Sakina AI Wellness Platform — Feature Breakdown (Priority 1–4)

**Date:** March 27, 2026
**Scope:** Detailed technical breakdown of all 23 features across Priority 1–4, covering architecture, data flow, risks, and operational notes.

---

## Priority 1 — Critical (High Impact, Feasible Now)

### #1: Onboarding Flow with Personalization Quiz

**What it does:** 5-screen onboarding flow (Welcome → Goal → Frequency → TimeOfDay → FirstValue/BreathingCircle) with AsyncStorage persistence and AppNavigator gate.

**Data flow:**
- `OnboardingContext` manages state (goal, frequency, timeOfDay, completed)
- On completion, `completed` flag is written to AsyncStorage
- `AppNavigator` checks flag on mount — shows onboarding or main app

**Key files:** `frontend/src/context/OnboardingContext.js`, `frontend/src/navigation/OnboardingStack.js`, 5 screens in `frontend/src/screens/onboarding/`

**Risks:** None significant. AsyncStorage is reliable for simple flags.

---

### #2: Crisis Resource Button

**What it does:** FAB in headerRight of all stacks, opens modal with 7 Canadian crisis resources including one-tap calling.

**Data flow:**
- `CrisisButton` emits `crisis:open` via `DeviceEventEmitter`
- `CrisisResourceModal` in `MainTabs` listens and toggles visibility
- Phone numbers opened via `Linking.openURL('tel:...')`

**Key files:** `frontend/src/components/CrisisButton.js`, `frontend/src/components/CrisisResourceModal.js`

**Risks:**
- **Phone dialer:** `Linking.openURL('tel:')` fails silently on simulators; works on real devices
- **Regulatory:** Crisis numbers are Canadian-specific. Internationalization would require geolocation-based resource selection

---

### #3: Staggered Card Entry Animations

**What it does:** FadeInDown stagger on Home/Journal/Settings via `AnimatedCard`, SlideIn for chat messages, Button press scale via react-native-reanimated.

**Data flow:** Pure UI — no data persistence. Animations use `react-native-reanimated` shared values.

**Key files:** `frontend/src/components/AnimatedCard.js`, `frontend/src/components/Button.js`

**Risks:** Reanimated requires the worklet runtime — crashes on web if not polyfilled correctly.

---

### #4: Logo Asset (PARTIAL)

**What it does:** `Logo.js` supports Image source with fallback to Ionicons leaf icon.

**What's missing:** `logo-sakina.png` not added to `frontend/assets/`. Drop the PNG there to replace the fallback.

---

## Priority 2 — High Value (Competitive Differentiation)

### #5: Breathing Exercise Screen

**What it does:** Standalone screen with 3 patterns (Calm 4-2-6, Box 4-4-4-4, 4-7-8), animated BreathingCircle, cycle counter, pause/stop, completion summary.

**Data flow:**
- Pattern definitions in `frontend/src/constants/breathingPatterns.js`
- `BreathingCircle` component uses reanimated for expand/contract animation
- Accessible from Home "Breathe" quick action and as modal from ChatStack

**Key files:** `frontend/src/screens/BreathingExerciseScreen.js`, `frontend/src/components/BreathingCircle.js`, `frontend/src/constants/breathingPatterns.js`

**Risks:** Timer precision on background — exercise pauses when app is backgrounded (expected behavior).

---

### #6: AI Pattern Recognition Messages

**What it does:** Backend `PatternAnalysisService` detects 4 pattern types from journal entries: day-of-week mood patterns, energy trends, mood streaks, emotion frequency.

**Data flow:**
1. Frontend calls `GET /api/journal/insights?days=30`
2. `JournalController` fetches entries → maps to entities → calls `PatternAnalysisService.Analyze()`
3. Returns `PatternInsightsResponse` with insights array
4. Frontend `usePatternInsights` hook caches results per session
5. HomeScreen renders up to 2 insight cards

**Key files:**
- Backend: `journal-service/src/JournalService.Api/Services/PatternAnalysisService.cs`
- Frontend: `frontend/src/hooks/usePatternInsights.js`, `frontend/src/services/insightApi.js`

**Risks:**
- **Minimum data:** Requires 7+ entries. Users with fewer entries see nothing — this is by design
- **Confidence threshold:** 0.6 minimum. Low-confidence patterns are filtered out to avoid misleading insights

---

### #7: Voice Input for Chat + Journal

**What it does:** `expo-speech-recognition` with `useVoiceInput` hook and `VoiceInputButton` component with pulsing animation.

**Data flow:**
- `useVoiceInput` wraps `expo-speech-recognition` API with graceful fallback
- Transcript appended to existing text in chat input or journal content
- Hidden on unsupported platforms

**Key files:** `frontend/src/hooks/useVoiceInput.js`, `frontend/src/components/VoiceInputButton.js`

**Risks:**
- **Expo Go:** Speech recognition requires custom dev build. Hidden in Expo Go
- **Permissions:** Microphone + speech recognition permissions required. Config in `app.config.js`

---

### #8: Inline Exercise Cards in AI Chat

**What it does:** `ChatMessageRenderer` parses AI messages for `[EXERCISE:*]` markers and renders interactive cards: breathing, grounding (5-4-3-2-1), reframing (3-step CBT).

**Data flow:**
1. AI includes `[EXERCISE:breathing]`, `[EXERCISE:grounding]`, or `[EXERCISE:reframing]` in response
2. `ChatMessageRenderer.split(MARKER_REGEX)` produces segments
3. `ExerciseCard` rendered for exercise markers; plain Markdown for text

**Key files:** `frontend/src/components/chat/ChatMessageRenderer.js`, `frontend/src/components/chat/ExerciseCard.js`, `frontend/src/components/chat/GroundingExercise.js`, `frontend/src/components/chat/ThoughtReframingCard.js`

**Risks:**
- **Marker contamination:** If a user types `[EXERCISE:breathing]` it would render as a card. Mitigated by markers only being parsed in assistant messages, not user messages.

---

### #9: Quick-Reply Mood Buttons in Chat

**What it does:** AI can include `[MOOD_CHECK]` to render 5 mood buttons. Tapping sends "I'm feeling [mood]" as user message.

**Data flow:** Same marker parsing as #8. `MoodQuickReply` renders from `MOODS` constant. Buttons disable after selection.

**Key files:** `frontend/src/components/chat/MoodQuickReply.js`

**Risks:** None significant.

---

## Priority 3 — Medium Value (Polish & Engagement)

### #10: Haptic Feedback

**What it does:** `expo-haptics` on mood/chip/energy selection with platform-safe fallback.

**Key files:** `frontend/src/hooks/useHaptic.js`

**Risks:** No-op on web and Android emulators without haptic support.

---

### #11: Skeleton Loading Screens

**What it does:** Pulse-animated skeletons for Home, Journal, Chat, Calendar screens replacing ActivityIndicator spinners.

**Key files:** `frontend/src/components/Skeleton.js`, `frontend/src/components/skeletons/` (4 files)

**Risks:** None.

---

### #12: Auto-Save for Journal

**What it does:** `useAutoSave` hook with `useDebounce` (2s), ref-based concurrency lock, pending queue. `saveDraft` in journalApi.

**Data flow:**
1. User types in journal → text debounced for 2s
2. `useAutoSave` calls `journalApi.saveDraft(entryId, payload)`
3. If entryId is null, creates new entry; otherwise updates existing
4. Concurrency lock prevents overlapping saves
5. Visual "Auto-saved" indicator in JournalScreen

**Key files:** `frontend/src/hooks/useAutoSave.js`, `frontend/src/hooks/useDebounce.js`

**Risks:**
- **Race condition:** Ref-based lock prevents but doesn't queue. Pending queue handles burst writes
- **Partial saves:** If app crashes mid-save, last debounced content is lost. Acceptable for 2s window

---

### #13: Photo Attachment in Journal

**What it does:** `expo-image-picker` with camera/library picker, permission handling, thumbnails, max 3 photos, remove buttons.

**Data flow:** Photos stored locally only. Backend upload endpoint not yet implemented — this is a known limitation.

**Key files:** `frontend/src/components/PhotoAttachment.js`

**Risks:**
- **Storage:** Photos are local only. Clearing app data loses them
- **Backend:** Server persistence requires a file upload endpoint (future work)

---

### #14: Word Count, #15: Button Micro-Animations, #16: Chat Slide-In Animations

**What they do:** Word/character display, scale(0.97) press animation, SlideIn for chat messages. All verified optimal.

**Risks:** None.

---

## Priority 4 — Competitive Edge (Newly Implemented)

### #17: Wellbeing Assessments (PHQ-9, GAD-7)

**What it does:** Validated assessment instruments with step-through questionnaire, severity scoring, history timeline, before/after comparison, and 14-day reminders.

**Data flow:**
1. User selects assessment type (PHQ-9 or GAD-7) from HomeScreen quick action or reminder card
2. `AssessmentScreen` presents one question per page with 4 radio options (0-3 points each)
3. On submit: `POST /api/journal/assessments` → `AssessmentService.SubmitAsync()`:
   - Validates response count (9 for PHQ-9, 7 for GAD-7)
   - Validates each score is 0-3
   - Computes total score
   - Maps to severity band (exact published algorithms)
   - Persists to `assessments` table via stored procedure
4. Result shown on `AssessmentResultScreen` with `ScoreGauge` visualization
5. History available via `GET /api/journal/assessments?type=PHQ9`
6. Comparison via `GET /api/journal/assessments/comparison?type=PHQ9` (first vs. latest)
7. `useAssessmentReminder` hook checks every screen focus if 14+ days since last assessment

**Database:** `assessments` table with user_id, type, score, severity, responses (JSONB), completed_at. Indexed on (user_id, type, completed_at DESC).

**Scoring (exact published bands):**
- PHQ-9: 0-4 Minimal, 5-9 Mild, 10-14 Moderate, 15-19 Moderately Severe, 20-27 Severe
- GAD-7: 0-4 Minimal, 5-9 Mild, 10-14 Moderate, 15-21 Severe

**Risks:**
- **Clinical liability:** CRITICAL. Every screen shows: "This is a screening tool, not a clinical diagnosis." Never uses language like "You have depression."
- **Scoring accuracy:** Must exactly match published algorithms. Static methods `GetSeverity()` are testable in isolation
- **Question #9 (PHQ-9):** "Thoughts that you would be better off dead" — if score is 1+, the system should display crisis resources. Currently handled by AI escalation (#23) but could be enhanced with direct detection

---

### #18: Therapist-Ready Export

**What it does:** CSV export of wellness data (mood summaries, assessment scores, journal entry summaries) with configurable date range and section toggles.

**Data flow:**
1. User navigates to Settings → Export for Therapist
2. `ExportScreen` shows date range chips (30/90/180/365 days) and section toggles
3. Preview: `POST /api/journal/export/preview` returns JSON summary
4. Export: `POST /api/journal/export` → `ExportService`:
   - Fetches journal entries for date range
   - Computes mood counts, most common mood, average energy
   - Fetches assessment history filtered by date range
   - Generates CSV with sections: header, mood summary, assessments, journal summaries, disclaimer
   - Returns as `FileContentResult` with `text/csv` content type

**What's NOT included:** Raw journal text content — only date, mood, energy level, and word count. This is intentional for privacy.

**Risks:**
- **PDF generation:** Deferred. QuestPDF NuGet package needed. CSV is the Phase 1 format
- **File download on mobile:** `expo-file-system` + `expo-sharing` needed for proper download/share. Current implementation shows a confirmation alert; full download requires these packages
- **Cross-service data:** Chat session data lives in chat-service. Export currently only includes journal + assessment data. Adding chat summaries requires cross-service HTTP call or a dedicated chat export endpoint

---

### #19: Wearable Integration

**What it does:** On-device health data from Apple HealthKit (iOS) and Health Connect (Android). Shows steps, heart rate, and sleep on HomeScreen.

**Data flow:**
1. User enables wearable integration in Settings → Health Data
2. `requestPermissions()` calls platform-specific API
3. `useWearableData` hook fetches today's data on screen focus:
   - `getSteps()` → today's step count
   - `getHeartRate()` → today's average heart rate
   - `getSleepHours()` → last night's sleep duration
4. `WearableMetricsCard` renders on HomeScreen when enabled and data available

**Architecture:** `wearableService.js` uses dynamic `require()` to load native modules. If modules not installed (web, Expo Go), all functions return null gracefully.

**Risks:**
- **Expo Go incompatibility:** HealthKit and Health Connect are native modules requiring custom dev build. `isWearableAvailable()` returns false in Expo Go
- **Platform fragmentation:** HealthKit API (callback-based) vs Health Connect API (promise-based) have different data formats. `wearableService.js` normalizes both
- **Privacy:** All data stays on device in Phase 1. No server sync. Clear opt-in flow with Settings redirect for permissions
- **No server persistence:** If user switches devices, health data history is lost. Phase 2 would add optional server sync

---

### #20: Dynamic Time-of-Day UI

**What it does:** App colors shift automatically based on time of day. Morning (6am-12pm) gets warm gold/amber tones, Afternoon (12pm-6pm) stays default sage, Evening (6pm-6am) shifts to cool indigo.

**Data flow:**
1. `useTimeOfDay` hook runs `getTimePeriod()` every 60 seconds
2. Returns `{ period, overrides }` where overrides contains light/dark color maps
3. `ThemeContext.resolveColors()` layers: base palette → time-of-day overrides → accent overrides
4. All components using `useTheme().colors` automatically reflect the change

**Color resolution order:** `base (Light/DarkColors) → timeOfDay overrides → accent overrides`. Each layer only overrides keys it defines; unset keys fall through from previous layers.

**Risks:**
- **Re-render cascade:** Period changes trigger context update → all themed components re-render. This happens at most 3x/day, which is negligible
- **Testing:** Manual testing required across all 3 periods. `getTimePeriod()` accepts a Date parameter for unit testing edge cases
- **Dark mode interaction:** Each period has separate dark overrides, so morning-dark and evening-dark look distinct

---

### #21: Theme/Accent Customization

**What it does:** 6 preset accent colors (Sage, Ocean, Sunset, Lavender, Rose, Forest) that override primary/primaryDark/primaryLight across the entire app.

**Data flow:**
1. User selects accent in Settings → Appearance → Accent Color
2. `setAccentId(id)` persists to AsyncStorage key `accent_id_v1`
3. `ThemeContext.resolveColors()` applies accent overrides as the final layer
4. Every component using `colors.primary`, `colors.primaryDark`, or `colors.primaryLight` reflects the change

**Key files:** `frontend/src/theme/accents.js`, `frontend/src/components/AccentPicker.js`

**Risks:**
- **Color accessibility:** Each accent has been chosen with sufficient contrast against both light and dark backgrounds, but some edge cases (e.g., Lavender on dark grey) should be manually verified
- **Brand dilution:** Sage green is Sakina's brand color. User customization means screenshots may not look "on brand." This is acceptable for a wellness app where personalization is valued

---

### #22: Community/Peer Support

**What it does:** Anonymous peer support groups organized by topic. Users can post messages, react with supportive emoji, and report inappropriate content.

**Architecture:**
- New `community-service` microservice (PostgreSQL backend)
- YARP gateway route added in `auth-service/appsettings.json`
- 6 default groups: Anxiety, Depression, Stress, Sleep, Relationships, Academic
- Anonymous identities: each user gets a unique name per group (e.g., "Brave Owl") via `anonymous_identities` table
- New Community tab in MainTabs navigation

**Data flow:**
1. `CommunityScreen` fetches `GET /api/community/groups` → shows group cards
2. User taps group → `GroupFeedScreen` fetches `GET /api/community/groups/:slug/posts`
3. User writes post → `POST /api/community/groups/:slug/posts`:
   - Server assigns anonymous identity (or retrieves existing one for this user+group)
   - Content moderation check (AI-based, calls AI Wrapper — Phase 2)
   - Post saved with anonymous_name, never exposes real user_id in response
4. Reactions: `POST /api/community/posts/:id/reactions` with type (hug/heart/strength/relate)
5. Reports: `POST /api/community/posts/:id/report` with reason

**Database tables:** support_groups, posts, reactions, reports, anonymous_identities

**Risks:**
- **CRITICAL — Harmful content:** Pre-publish AI moderation not yet wired (Phase 2). Currently posts go live immediately. The report mechanism is the primary safety net
- **De-anonymization:** Content analysis could reveal identity. Mitigation: never expose real user_id; anonymous names are per-group
- **Scope creep:** Phase 1 is intentionally limited: no DMs, no real-time, no images, no user profiles
- **New service deployment:** community-service needs its own Docker container, PostgreSQL database, and health checks. Currently only the database schema and frontend are implemented; the service `Program.cs` and controllers need to be fleshed out
- **Moderation backlog:** With no automated moderation, reported posts pile up. Admin review dashboard is future work

---

### #23: AI + Human Hybrid Escalation

**What it does:** Multi-tier escalation system that suggests human support when appropriate. The AI includes escalation markers in responses, and assessment scores trigger proactive recommendations.

**Architecture:**
- **AI-driven (chat):** System prompt includes `[ESCALATE:CRISIS]`, `[ESCALATE:PROFESSIONAL]`, `[ESCALATE:PEER]` marker instructions
- **Score-driven (assessment):** `EscalationService` checks PHQ-9/GAD-7 scores:
  - PHQ-9 ≥ 20 or GAD-7 ≥ 15 → PROFESSIONAL
  - PHQ-9 ≥ 10 or GAD-7 ≥ 10 → PEER
- **Audit log:** `escalation_events` table records type, source, timestamp — no PII

**Data flow (chat):**
1. AI generates response with `[ESCALATE:PROFESSIONAL]` marker
2. `ChatMessageRenderer` detects marker via updated `MARKER_REGEX`
3. `EscalationCard` renders with icon, description, and action button
4. User taps → `handleEscalationAction()`:
   - `crisis` → opens `CrisisResourceModal`
   - `professional` → navigates to `ProfessionalDirectoryScreen`
   - `peer` → navigates to `CommunityScreen`

**Data flow (assessment-based):**
1. `GET /api/journal/escalation/status` → `EscalationService.GetStatusAsync()`
2. Checks latest PHQ-9 and GAD-7 scores
3. Returns recommendation: PROFESSIONAL, PEER, or NONE

**Professional directory:** 7 Canadian mental health resources (CMHA, BetterHelp, Psychology Today, Crisis Services Canada, Kids Help Phone, Hope for Wellness, Wellness Together Canada). Static data in `constants/professionals.js`. Filterable by type (hotline, platform, organization, directory).

**Risks:**
- **False positives:** AI may over-escalate when user is fine. Mitigation: markers are always gentle suggestions ("Would you like..."), never alarming
- **False negatives:** AI may fail to escalate when it should. Mitigation: assessment-based escalation acts as independent safety net
- **Static directory:** Professional resources are hardcoded. Need periodic manual updates. Phase 2: API-integrated directory
- **Marker visibility:** If AI wraps a marker in markdown formatting (e.g., `**[ESCALATE:CRISIS]**`), parsing fails. Mitigated by system prompt instruction "include them verbatim"

---

## Cross-Cutting Concerns

### New Backend Services Registered
```csharp
// journal-service/Program.cs
builder.Services.AddScoped<AssessmentService>();    // Feature 17
builder.Services.AddScoped<ExportService>();         // Feature 18
builder.Services.AddScoped<EscalationService>();     // Feature 23
```

### New API Endpoints
| Method | Path | Feature | Service |
|--------|------|---------|---------|
| POST | `/api/journal/assessments` | #17 | journal-service |
| GET | `/api/journal/assessments` | #17 | journal-service |
| GET | `/api/journal/assessments/latest` | #17 | journal-service |
| GET | `/api/journal/assessments/comparison` | #17 | journal-service |
| POST | `/api/journal/export/preview` | #18 | journal-service |
| POST | `/api/journal/export` | #18 | journal-service |
| GET | `/api/journal/escalation/status` | #23 | journal-service |
| POST | `/api/journal/escalation/log` | #23 | journal-service |
| GET | `/api/community/groups` | #22 | community-service |
| GET | `/api/community/groups/:slug/posts` | #22 | community-service |
| POST | `/api/community/groups/:slug/posts` | #22 | community-service |
| POST | `/api/community/posts/:id/reactions` | #22 | community-service |
| DELETE | `/api/community/posts/:id/reactions/:type` | #22 | community-service |
| POST | `/api/community/posts/:id/report` | #22 | community-service |

### New Database Tables
| Table | Database | Feature |
|-------|----------|---------|
| `assessments` | journal-service | #17 |
| `escalation_events` | journal-service | #23 |
| `support_groups` | community-service | #22 |
| `posts` | community-service | #22 |
| `reactions` | community-service | #22 |
| `reports` | community-service | #22 |
| `anonymous_identities` | community-service | #22 |

### Navigation Changes
- **New tab:** Community (between Journal and Sakina)
- **HomeStack additions:** Assessment, AssessmentResult, AssessmentHistory screens
- **SettingsStack additions:** ExportData, WearableSettings, ProfessionalDirectory screens
- **Tab icons updated:** Added `Community: { focused: "people", default: "people-outline" }`

### ThemeContext Changes
- Now resolves colors in 3 layers: base → time-of-day → accent
- New context values: `isDynamicTheme`, `accentId`, `timePeriod`, `setDynamicTheme`, `setAccentId`
- New AsyncStorage keys: `dynamic_theme_v1`, `accent_id_v1`

---

## Known Limitations & Future Work

1. **Logo asset** (#4) — Code ready, PNG not provided
2. **PDF export** (#18) — CSV only; PDF requires QuestPDF NuGet package
3. **Wearable server sync** (#19) — Phase 1 is on-device only
4. **Community backend** (#22) — Schema and frontend complete; `community-service/Program.cs` needs full scaffolding
5. **AI content moderation** (#22) — Pre-publish moderation not yet wired; relies on user reports
6. **Chat data in export** (#18) — Chat sessions live in separate service; cross-service aggregation deferred
7. **File download** (#18) — Full mobile file download needs `expo-file-system` + `expo-sharing`
8. **Assessment question #9** (#17) — PHQ-9 suicidal ideation question could trigger direct crisis alert
