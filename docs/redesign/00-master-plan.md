# Sakina AI — UI/UX Redesign Master Plan

**Branch:** `ui-redesign` (off `app-store-readiness`)
**Status:** Planning complete — awaiting user approval to begin Wave A
**Created:** 2026-04-20

This is the synthesis of four research deliverables:
- `01-aesthetic-research.md` — design direction, palettes, motion, anti-patterns
- `02-tech-stack.md` — RN library choices, perf, web compat
- `03-ux-bug-prevention.md` — 140-check bug catalog
- `04-current-state.md` — current frontend audit (30 screens, 36 components)

---

## 1. Design Direction (Locked)

### Aesthetic Identity
**"Midnight Aurora + Liquid Glass + Living Light"** — a dark-first, cosmic, breathing UI that feels like a quiet observatory. Light theme is **"Sage Mist"** — botanical, grounded, daytime-friendly. The two themes share a structural language; they are not two skins glued onto the same UI, they are two times-of-day for the same room.

**Pillars:**
1. **Aurora over chrome** — animated multi-radial mesh gradients (Skia) carry brand identity. Surfaces are translucent glass over the aurora; never flat colored backgrounds.
2. **Breathing as motion vocabulary** — every ambient animation (gradient drift, blob morph, pulse) cycles at a 4–8s cadence. The app literally breathes.
3. **Restraint + craft** — one accent color, generous whitespace, no decorative drop shadows. Elevation is conveyed through tonal surface shifts and translucency, not box-shadows.
4. **Bioluminescent accent** — soft cyan glow (#34E0C8 dark / desaturated #5B7CFA primary) for active states, CTAs, AI-thinking indicators. Pulses, never flickers.

### Palettes (locked)
- **Primary (default): Midnight Aurora** — see `01-aesthetic-research.md` §4.1. Dark bases `#0B0F1A → #262E47`, accent bioluminescent cyan `#5AF0DA`, primary `#7A95FF`.
- **Secondary (light): Sage Mist** — see §4.2. Cream bases `#F5F4EE → #2C3934`, sage primary `#5E8C6A`, warm amber accent.
- **Time-of-day drift** retained from current implementation — applies to both palettes.
- **User accent picker** retained — overrides accent token only.

### Typography (locked)
**"Modern Mindful" — DM Serif Display + DM Sans** (extends the existing `@expo-google-fonts/dm-sans` dependency; only adds DM Serif Display).
- Display sizes (≥24pt): DM Serif Display
- All UI / body / labels: DM Sans (400/500/600/700)
- Mono labels (timer, BPM, code): JetBrains Mono 400

Full type scale in `05-component-spec.md` §Typography.

### Iconography (locked)
**Phosphor Icons via `phosphor-react-native`** — duotone primary, regular secondary, fill for completed states. Override any decision in `02-tech-stack.md` recommending Lucide; user's explicit anti-AI-template mandate overrules bundle-size argument.

**Custom brand glyphs (commission separately):** Sakina logo, breath-work entry, journal sigil, AI companion avatar, mood crystal — 5 hand-drawn SVGs. For Wave A we use placeholder Phosphor icons, then swap in Wave F polish.

### Signature Interactions (locked — implement across waves)
1. Aurora mesh gradient background (Skia) — Home, Chat idle, Breathing
2. Breathing-synced gradient pulse (4s in / 6s out) — ambient layer of #1
3. Skia blob "thinking" indicator — replaces ALL spinners
4. Particle bloom on completion — meditation, breath cycle, journal save (haptic-synced)
5. Long-press with backdrop blur — card previews, context menus
6. Shared element transitions — chat session card → conversation, mood card → detail
7. Pull-to-refresh as a breath — replaces system spinner
8. Magnetic snap on horizontal carousels (mood, breath patterns) with light haptic
9. Time-of-day color drift — header + ambient gradient hue shift
10. Bento home dashboard — 2% scale + soft shadow on press, spring physics
11. Aurora wash on AI streaming — replaces typing dots
12. Hairline progress rings (1.5pt arcs) — never thick bars
13. Bottom sheet handle that pulses on first appearance (3s, then settles)
14. Tab bar that shrinks on scroll-down, expands on scroll-up
15. Reduce-motion: all ambient animations OFF, transitions reduced to 200ms crossfade

---

## 2. Tech Stack (Locked)

### Add to `frontend/package.json`
```jsonc
{
  "dependencies": {
    "@shopify/react-native-skia": "^2.6.2",
    "moti": "^0.30.0",
    "expo-blur": "~15.0.0",
    "expo-image": "~3.0.0",
    "expo-navigation-bar": "~5.0.0",
    "react-native-keyboard-controller": "^1.18.0",
    "@gorhom/bottom-sheet": "^5.1.8",
    "@shopify/flash-list": "^2.1.0",
    "phosphor-react-native": "^2.1.0",
    "react-native-svg": "^15.8.0",
    "react-native-unistyles": "^3.0.0",
    "react-hook-form": "^7.54.0",
    "zod": "^3.23.0",
    "@hookform/resolvers": "^3.9.0",
    "@expo-google-fonts/dm-serif-display": "^0.4.0",
    "@expo-google-fonts/jetbrains-mono": "^0.4.0",
    "react-native-reanimated": "~4.2.0",
    "react-native-safe-area-context": "~5.7.0"
  },
  "devDependencies": {
    "jest-axe": "^9.0.0"
  }
}
```

### Replace / Remove
- Replace built-in `KeyboardAvoidingView` → `react-native-keyboard-controller`
- Replace `SafeAreaView` component → `useSafeAreaInsets` hook everywhere
- Don't add Lottie — use Skia (or `react-native-skottie` if a hand-crafted .lottie file is unavoidable)
- Don't add FastImage — `expo-image` is enough

### ESLint Guards (new — added in Wave A)
```js
'no-restricted-imports': ['error', {
  paths: [
    { name: 'react-native', importNames: ['SafeAreaView', 'KeyboardAvoidingView',
      'TouchableOpacity', 'TouchableHighlight', 'TouchableWithoutFeedback', 'Animated'],
      message: 'Use the design system primitive instead.' },
  ]
}],
'react-hooks/exhaustive-deps': 'error'
```

### Babel / Metro
Confirm `babel.config.js` uses `react-native-worklets/plugin` (NOT `react-native-reanimated/plugin`).

### Risk Mitigations (top 5)
1. **Reanimated 4 ecosystem** — pin every animation-adjacent dep, run `npx expo-doctor` after install
2. **Skia WASM 2.9MB on web** — lazy load via `WithSkiaWeb`
3. **Android 15 edge-to-edge** — never set `StatusBar.backgroundColor`; design reflows under bars
4. **Shared Element Transitions feature-flagged + tab-incompatible** — fallback to mounted cross-fade
5. **`expo-blur` on Android weak** — `<GlassPanel>` primitive degrades gracefully to translucent solid

---

## 3. UX Quality Gates (from `03-ux-bug-prevention.md`)

Every component / screen must pass before shipping:
- [ ] Tap-outside dismisses keyboard
- [ ] Inputs scroll into view above keyboard
- [ ] No text overflows; long usernames truncate with ellipsis
- [ ] All touch targets ≥ 48×48dp
- [ ] Safe-area insets respected (top + bottom + horizontal)
- [ ] Reduced-motion respected
- [ ] All interactive elements have `accessibilityLabel` + `accessibilityRole`
- [ ] Color contrast ≥ 4.5:1 body text, ≥ 3:1 controls
- [ ] No double-submit on async actions (loading state disables button)
- [ ] AbortController on race-prone fetches
- [ ] FlashList for any list > 50 items (chat sessions, journal entries, community feed)
- [ ] No hardcoded colors — all from theme tokens
- [ ] No direct use of `KeyboardAvoidingView`, `SafeAreaView`, `Touchable*`, `Animated` (ESLint enforced)
- [ ] No spinners — Skia blob or breathing pulse instead
- [ ] Web fallback present for Skia / blur / haptics

---

## 4. Implementation Plan (Waves)

Each wave has clear inputs, outputs, and a verification gate. Web screenshots taken at the end of each wave; reviewer agents run; `git commit` per wave.

### Wave A — Foundations (theme system, design tokens, ESLint guards)
**Outputs:**
- `frontend/src/theme/` — Unistyles-based theme with Midnight Aurora + Sage Mist palettes, full type scale, spacing/radius/elevation tokens
- `frontend/src/theme/tokens.ts` — typed token export
- `frontend/src/theme/motion.ts` — duration ladder + easing curves
- ESLint config update with `no-restricted-imports`
- Babel/Metro verification
- New deps installed; `expo-doctor` clean

**Verification:** `npm run lint && npm run web` boots without errors. Token export type-checks. Render a `ThemeProbe` screen displaying every token.

### Wave B — Core Primitives
**Outputs:** All components below built and snapshot-tested. Each component lives in `frontend/src/ui/<Name>/<Name>.tsx`.

| Primitive | Purpose |
|---|---|
| `<AuroraBackground>` | Skia mesh gradient with breathing drift, web fallback |
| `<GlassPanel>` | expo-blur wrapper with Android graceful degrade |
| `<Surface>` | Tonal surface (base/raised/elevated) with optional border |
| `<Text>` | Typed `variant` prop maps to type scale tokens |
| `<Button>` | primary / secondary / ghost / destructive; loading state with blob; haptic |
| `<IconButton>` | 48×48 hit area; Phosphor icons; haptic; accessibilityLabel required |
| `<Input>` | RHF Controller-friendly; floating label; error state; RTL |
| `<Card>` | Bento card; press physics (scale 0.98 spring); long-press blur preview |
| `<Sheet>` | Gorhom wrapper with handle pulse on mount; backdrop blur |
| `<TabBar>` | Custom glass tab bar; shrink-on-scroll; active glow |
| `<Toast>` | Subtle slide-in; never red — uses palette error tone |
| `<Avatar>` | expo-image with blurhash placeholder |
| `<ProgressRing>` | Hairline 1.5pt SVG arc |
| `<BreathingPulse>` | Reusable pulse animation primitive (4s) |
| `<Blob>` | Skia blob morph — used as thinking indicator |
| `<ParticleBloom>` | Skia particle system — completion celebration |
| `<Divider>` | Hairline tonal divider |
| `<Chip>` | Selection chip; haptic on select |
| `<Slider>` | Custom themed slider; hairline track + 24pt thumb |
| `<Switch>` | Custom themed switch — never system default |
| `<EmptyState>` | Illustration slot + title + body + CTA |
| `<ErrorState>` | Same shape as EmptyState; calm coral, retry button |
| `<LoadingState>` | Blob centered + caption |

**Verification:** `<DesignSystemPlayground>` route renders every primitive in both themes; Playwright takes screenshots of each in light + dark; manual review.

### Wave C — Navigation Shell
**Outputs:**
- New custom `<TabBar>` integrated into bottom tabs
- KeyboardProvider + SafeAreaProvider wired at root
- expo-navigation-bar for Android nav-bar tinting per screen
- Shared transitions feature flag enabled (Reanimated 4.2)
- Drawer redesigned (glass panel, no system default)
- Stack screen options updated (custom headers, fade animations, no back-button text on iOS)
- Crisis button preserved (DeviceEventEmitter pattern kept)

**Verification:** Navigate every existing route; no crashes; nav bar tinting works on Android web emulation; tab bar floats with blur.

### Wave D — Screens (one screen = one sub-wave)
Order (high-impact first):
1. **Auth — Login** (sets the tone — first impression)
2. **Onboarding** (5 screens — Welcome → Goal → Frequency → TimeOfDay → FirstValue)
3. **Home dashboard** (rewrite as bento — DailyCheckIn, MoodCrystal, Insights, QuickActions)
4. **AI Chat — conversation** (aurora-washed assistant bubbles, blob thinking, FlashList inverted)
5. **AI Chat — session list / drawer** (paginated FlashList, shared transitions to convo)
6. **Journal — Home** (FlashList; mood calendar polished)
7. **Journal — Editor** (RHF + zod; voice input with permission flow; auto-save; discard warning)
8. **Breathing exercise** (full-screen blob + breathing-synced gradient + ProgressRing)
9. **Assessment flow** (PHQ-9 / GAD-7 — one question per screen, slow transitions)
10. **Assessment results** (themed severity colors)
11. **Mood Calendar / detail**
12. **Community — Home, GroupFeed, ProfessionalDirectory**
13. **Settings (7 screens)** — Theme, Notification, Privacy, Wearable, Blocked, Help, Export — all consistent
14. **Auth — Register, VerifyEmail, TwoFactor, ForgotPassword, ResetPassword**

Each screen sub-wave: design pass → implement → manual UX checklist → Playwright screenshot → commit.

### Wave E — Signature Animations
**Outputs:**
- Skia AuroraBackground tuned per screen mood
- BreathingPulse synced across Home/Chat/Breathing
- Blob thinking indicator wired into AI streaming
- ParticleBloom on session/breath/journal completion (haptic-coordinated)
- Long-press + backdrop blur on Cards (chat sessions, journal entries)
- Shared transitions: chat list ↔ conversation, mood card ↔ detail
- Pull-to-refresh as a breath
- Tab bar shrink-on-scroll
- Aurora wash on AI streaming

**Verification:** Each animation has a Playwright screenshot of mid-state; respects reduce-motion (test with `AccessibilityInfo.isReduceMotionEnabled()` mocked).

### Wave F — Polish
**Outputs:**
- Empty / error / loading states for every screen
- Accessibility audit pass (every interactive element labeled, contrast verified)
- Haptic choreography pass via `useHaptic()` wrapper
- Custom brand glyphs (5 SVGs) commissioned and integrated
- Onboarding tooltip for breathing-pulse interaction
- Performance pass — memoization, FlashList where missing, image prefetch
- Dark/light theme toggle smooth transition
- Time-of-day drift wired
- App icon + splash screen reskin (Midnight Aurora gradient)

**Verification:** Lighthouse a11y ≥ 95 (web), all UX-bug-prevention checklist items green, Playwright full-suite green.

---

## 5. Verification Strategy (Autonomous)

Per user direction: **fully autonomous with web screenshots**. Caveats accepted (native-only behavior won't be verified).

**Per-wave verification stack:**
1. `npm run lint` — ESLint passes (including new `no-restricted-imports`)
2. `npm test` — Jest unit + snapshot tests
3. `npm run web` — boot Expo web on a port
4. **Playwright** — screenshot every screen in light + dark; compare to baseline
5. **typescript-reviewer** agent — review wave's code changes
6. **frontend-patterns** skill — verify patterns
7. **e2e-runner** agent — generate Playwright flow tests for new screens
8. Manual UX checklist (from `03-ux-bug-prevention.md`)

**Per-screen verification:**
- Render in both themes
- Screenshot at 375×812 (iPhone SE), 390×844 (iPhone 15 Pro), 412×892 (Pixel 7)
- Verify: no layout overflow, no text clipping, all touch targets ≥ 48px, contrast OK
- Test keyboard interactions on form screens
- Reduced-motion mock test on animated screens

---

## 6. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Skia/Reanimated 4 native build issues on Expo SDK 54 | Med | High | Pin Skia ≥ 2.6.2; clean rebuild after install; test web first before native |
| Web verification misses native-only bugs (blur, haptics, gestures) | High | Med | Document web-verified vs native-assumed; user runs final native check |
| Custom tab bar breaks deep linking | Low | High | Keep RN-Nav 7 routing; only swap UI |
| Theme migration leaves orphaned hardcoded colors | High | Med | ESLint rule banning hex literals outside theme files |
| Bundle size grows past acceptable | Med | Med | Bundle analyzer in Wave A baseline; budget +30% max |
| User dislikes Midnight Aurora when first seen | Med | High | Wave A includes ThemeProbe screen for early visual signoff |
| Accessibility regressions vs current state | Med | Med | jest-axe + manual audit pass in Wave F |
| Performance regression on low-end Android | Med | High | Profile in release mode; guard heavy effects (blur, particles) behind device tier check |

---

## 7. Out of Scope (Explicit)

- New backend features
- Schema changes (DB columns)
- Native module additions beyond what listed deps require
- i18n implementation (separate effort — but tokens designed to support it)
- Test coverage uplift beyond what redesign touches
- App Store / Play Store submission

---

## 8. Approval Checkpoint

**Before starting Wave A**, user is shown:
- This master plan
- The component spec (`05-component-spec.md`)
- A visual swatch of the two palettes (will be generated as a static PNG)

**User approves direction** → I begin Wave A. **User redirects** → I pivot before any code is written.

---

## 9. Timeline (Realistic)

Autonomous, with the user as occasional spot-checker:
- Wave A: 1 day
- Wave B: 3-4 days
- Wave C: 1 day
- Wave D: 8-12 days (1 day per major screen group)
- Wave E: 2-3 days
- Wave F: 2-3 days

**Total: ~3 weeks of focused work.**

The user does not need to be available daily. Check-ins at wave boundaries are sufficient.
