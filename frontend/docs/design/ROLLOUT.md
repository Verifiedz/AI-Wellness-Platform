# Rollout plan

Staged rollout of the Sakina Lantern UI transformation (plan §8.4). Flags live
in `frontend/src/config/featureFlags.js` and default `false`. Flip in this order
over ~2 weeks with Sentry-observed dwell between each gate.

## Flag order

1. `USE_EDITORIAL_TYPOGRAPHY` — Fraunces loaded on App boot.
   - Gate: fonts ≤150KB total budget (400, 400-italic, 600 only). Verify
     `expo-splash-screen` holds until fonts load.
2. **Token migration** — already merged as the default in the current build
   (no flag needed). Verify `node scripts/check-antipatterns.js` returns zero.
3. `USE_SKIA_BREATHING` — BreathingLantern replaces BreathingCircle.
   - Gate: 60fps on Pixel 5a; haptics audit passes (per-phase `triggerSoft`);
     summary paragraph renders.
4. `USE_LANTERN_HOME_V2` — HomeScreenV2 with bento + MeshGradient.
   - Gate: time-to-first-value regression ≤10% vs. V1, no Sentry crash
     increase on Home route.
5. `USE_EMPATHY_ONBOARDING_V2` — Recognition / InitialCheckIn / Privacy /
   AccountCreation sequence.
   - Gate: Day-2 return rate not worse than current onboarding (baseline
     collected over 14 days prior). AccountCreation anonymous path must
     succeed end-to-end.
6. `USE_VALENCE_ENERGY_MOOD` — 2D mood grid on Home and Journal.
   - Gate: first-time tutorial hint rendered; mood legend reads as the
     expected mood id at all 6 region anchors; API payload shape unchanged
     when projected via `coordsToMood(v, e)`.
7. `USE_KEYS_ECONOMY` — sanctuary-shelf + seeded migration sheet.
   - Gate: migration sheet shows exactly once; `floor(streak/3)` seed count
     matches expected per-user value; no user sees a visible streak counter.
8. `USE_GROUNDING_HOLD` — 3-second long-press Home → 30-second hold.
   - Gate: gesture does not conflict with ScrollView or refresh pull; flame
     amplification stays on UI thread; per-second haptic honored by the
     accessibility `hapticsEnabled` preference.

## Sentry watchpoints

Add alerts on these metrics before flipping any flag:

- Crash-rate delta by route (`Home`, `Breathing`, `Journal`, `AIChat`, `Onboarding`)
- JS errors containing `Fraunces` or `@shopify/react-native-skia`
- Bridgeless-mode related errors (New Architecture is on — see app.config.js)

## A11y checklist

Before every flag flip, walk the newly-enabled screen with:

- [ ] **Contrast**: spot-check each new surface against WCAG 2.2 AA at 13pt
      using the declared tokens (`textLight` on background at 13pt is the
      most likely offender).
- [ ] **Labels**: every interactive element has `accessibilityLabel` + `accessibilityRole`.
- [ ] **Reduced motion**: enable in iOS Settings / Android Developer options,
      confirm Skia primitives use their reduced-motion fallback and no
      spring animations run.
- [ ] **VoiceOver / TalkBack**: read the full screen once. The lantern hero
      should announce as an image, not as a button.
- [ ] **Haptics off**: flip the Settings → Accessibility → Haptics switch,
      verify the entire app is silent.

## Performance budgets

- **Startup**: Expo splash holds until fonts load. Add no more than +80ms
  cold start beyond current baseline.
- **Skia primitives**: 60fps on Pixel 5a (mid-range baseline). Lazy-load on
  non-critical screens if startup budget blows.
- **Fraunces**: variable font ≤150KB. Load only 400 / 400-italic / 600.
- **UI thread**: every new spring animation runs on UI thread (confirm no
  JS-thread `Animated` loops remain).
- **Bundle size**: Skia adds ~4–6 MB. Confirm release build stays within
  current App Store / Play Store delta budget before merging.

## In-app feedback sheet

Lightweight valence-based feedback sheet — "How does this feel?" — never NPS.
Surface on Home a maximum of once per flag-flip window.

## Metrics to watch (not streaks)

- Time-to-first-value (app open → first mood logged)
- Day-2 return rate
- Crisis resource discovery latency
- Session length per flow

**Never display daily-streak metrics to users.** See `COPY_PRINCIPLES.md`.

## Rollback

Every flag has an immediate kill switch: flip to `false` via
`EXPO_PUBLIC_FLAG_<NAME>=false` + OTA update. The legacy V1 paths (HomeScreen,
BreathingExerciseScreen, OnboardingStackV1, ScoreGauge pre-GlowRing…) stay on
disk through the rollout window and are only removed after each flag has been
`true` in production for 14 consecutive days with no incident rollback.
