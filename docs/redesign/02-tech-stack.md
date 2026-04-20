# Sakina AI — Redesign Tech Stack Research (Apr 2026)

> Deep technical research for the futuristic-calming UI redesign of Sakina AI on
> Expo SDK 54.0.33 / RN 0.81.5 / React 19.1 / Reanimated 4.1.1 with the **New
> Architecture enabled**. Sources: official docs (Expo, Software Mansion,
> Shopify, Gorhom, AppAndFlow), Context7 live snippets for Reanimated 4.1.5 and
> Skia, plus 2026 community benchmarks.
>
> Recommendations are tailored to the **current `frontend/package.json` baseline**
> (already on Reanimated 4 + worklets 0.5.1 + Screens 4.16 + RNGH 2.28 + RNSAC
> 5.6 + RN-Web 0.21).

---

## TL;DR (read this first)

| # | Concern | Verdict |
|---|---------|---------|
| 1 | Reanimated 4 | Already correct version. Adopt **CSS API** for state-driven motion; keep worklets for gestures. Babel plugin must be `react-native-worklets/plugin`. |
| 2 | Skia | **Add `@shopify/react-native-skia ^2.6.x`** — backbone of the futuristic look (mesh gradients, blob morphs, particles, shaders). |
| 3 | Blur | **Add `expo-blur ^15.x`** for navbars/modals; do **not** try to use Skia BackdropFilter over scrollable content (impossible). |
| 4 | Moti | **Add `moti ^0.30.x`** — Framer-Motion-style declarative wrapper, free perf, ~3KB net. |
| 5 | Bottom sheets | **Add `@gorhom/bottom-sheet ^5.1.8`** (the v5.1.8 release fixed Reanimated 4 compat). |
| 6 | Lists | **Add `@shopify/flash-list ^2.x`** — JS-only v2, designed for New Arch, ideal for chat/journal. |
| 7 | Images | **Add `expo-image ^3.x`** (SDK-54 channel) — replaces any FastImage usage, native blurhash placeholders. |
| 8 | Keyboard | **Add `react-native-keyboard-controller ^1.x`** — replaces RN's `KeyboardAvoidingView`. |
| 9 | Theming | **Add `react-native-unistyles ^3.x`** — C++ theme switching, no JS re-renders on dark mode toggle. |
| 10 | Icons | **Add `lucide-react-native ^0.4xx`** + keep `@expo/vector-icons` only as fallback. |
| 11 | Forms | **Add `react-hook-form ^7.x` + `zod ^3.x` + `@hookform/resolvers ^3.x`** for the chat/journal/auth forms. |
| 12 | Skia + Lottie | **Add `react-native-skottie ^2.x`** if any Lottie animations are introduced (avoid `lottie-react-native` directly). |
| 13 | E2E | **Maestro** for native iOS/Android, **Playwright** (already present at root) for Expo Web screenshot diffs. |

**Top 5 risk areas:** (1) Reanimated 4 New-Arch-only — any addon not yet on RNW4 will brick the app; (2) Skia CanvasKit on Web is a 2.9 MB WASM payload — must lazy-load; (3) Android edge-to-edge in Android 15 (API 35) deprecates `StatusBar.backgroundColor`; (4) Shared Element Transitions still feature-flagged and tab-nav incompatible; (5) `expo-blur` Android remains the weakest cross-platform piece — design must degrade gracefully.

---

## Current baseline (from `frontend/package.json`)

```jsonc
"expo": "~54.0.33",
"react": "19.1.0",
"react-native": "0.81.5",
"react-native-reanimated": "~4.1.1",
"react-native-worklets": "^0.5.1",
"react-native-gesture-handler": "~2.28.0",
"react-native-safe-area-context": "~5.6.0",
"react-native-screens": "~4.16.0",
"react-native-web": "^0.21.0",
"@react-navigation/native": "^7.1.28",
"@react-navigation/native-stack": "^7.12.0",
"@react-navigation/bottom-tabs": "^7.12.0",
"@react-navigation/drawer": "^7.9.4",
"@expo-google-fonts/dm-sans": "^0.4.2",
"@expo/vector-icons": "^15.0.3",
```

The base is **already** Reanimated-4-compatible and on the New Arch — we are
adding decoration, not refactoring foundations.

---

## 1. Reanimated 4 deep dive

### What's new vs Reanimated 3

- **Worklets extracted** to a separate package `react-native-worklets` (already
  installed at `^0.5.1`). The Babel plugin must be `react-native-worklets/plugin`,
  *not* `react-native-reanimated/plugin`. **Verify `babel.config.js`.**
- **CSS-style API** — declarative `animationName`, `transitionProperty`,
  `transitionDuration` props that map onto CSS animations/transitions semantics
  and run on the UI thread without `useAnimatedStyle` overhead.
- **New Architecture only** — Reanimated 4 dropped Paper/legacy renderer entirely.
- **Web is a first-class target** — CSS animations compile straight to real CSS
  on the web; worklet-based animations use the same JSI-style codepath.
- **Renames:** `runOnJS` → `scheduleOnRN`, `runOnUI` → `scheduleOnUI`,
  `useScrollViewOffset` → `useScrollOffset`, `makeShareableCloneRecursive` →
  `createSerializable`. Old names are deprecated shims.
- **Spring rework:** `restDisplacementThreshold` / `restSpeedThreshold` removed,
  replaced by single relative `energyThreshold`. `withSpring({duration})` is
  now the *perceptual* duration, not wall-clock.
- **`useAnimatedGestureHandler` removed** — refactor to the new Gesture API.

### When to use which API (the 80/20 rule)

| Scenario | API |
|----------|-----|
| State-driven UI (open/close, hover, theme) | **CSS Transitions** |
| Looping/keyframe (pulse, breathing dots, spinner) | **CSS Animations** |
| Gesture-driven drag/swipe | **Worklets + Gesture Handler** |
| Scroll-linked parallax | **Worklets + `useScrollOffset`** |
| Orchestrated multi-stage hero sequence | **Worklets + shared values** |
| Many animated nodes / particles | **Skia + Reanimated** |

### CSS API examples (the new "default" for Sakina motion)

```jsx
// Breathing pulse on a wellness avatar — pure declarative.
<Animated.View
  style={{
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: theme.aurora1,
    animationName: {
      '0%':   { transform: [{ scale: 1 }],   opacity: 0.85 },
      '50%':  { transform: [{ scale: 1.08 }], opacity: 1 },
      '100%': { transform: [{ scale: 1 }],   opacity: 0.85 },
    },
    animationDuration: '4s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'easeInOut',
  }}
/>

// State-driven backdrop fade — no useAnimatedStyle needed.
<Animated.View
  style={{
    opacity: isOpen ? 1 : 0,
    transitionProperty: ['opacity'],
    transitionDuration: 250,
  }}
/>
```

### Layout / Entering / Exiting

These remain worklet-driven and are perfect for hero-card mounts and bottom-sheet
content. From Context7 docs:

```js
import Animated, { EntryExitTransition, FlipInEasyX, FlipOutEasyY }
  from 'react-native-reanimated';

<Animated.View
  layout={EntryExitTransition
    .duration(600)
    .delay(80)
    .entering(FlipInEasyX)
    .exiting(FlipOutEasyY)
    .reduceMotion(ReduceMotion.System)} // honour OS reduce-motion
/>
```

### Performance flags to enable on RN 0.81 + RNW 4.1

In native code (or via an Expo config plugin) set the static feature flags:

- `USE_COMMIT_HOOK_ONLY_FOR_REACT_COMMITS`
- `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` (4.0+)
- `IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS` (4.2+ — bump to 4.2 if possible)
- `enableCppPropsIteratorSetter`

Also set `CADisableMinimumFrameDurationOnPhone = true` in `Info.plist` for
ProMotion 120 Hz iPhones.

### Pitfalls

1. **Never read `sharedValue.value` from the JS thread** — it blocks the JS thread
   waiting for the UI thread.
2. Animate `transform` / `opacity` / `backgroundColor`, not `width` / `height` /
   `top` / `left` (those re-trigger layout).
3. Cap simultaneous animated nodes: ≤ 100 on low-end Android, ≤ 500 on iOS.
4. Profile in **release** mode — debug-mode perf is misleading.
5. Any addon library not on RNW 4 will silently break — pin versions.

### Action items

- [ ] Confirm `babel.config.js` uses `react-native-worklets/plugin`.
- [ ] Bump to **Reanimated 4.2.x** to unlock iOS sync-prop flag and shared
      element transitions (still gated behind `ENABLE_SHARED_ELEMENT_TRANSITIONS`).
- [ ] Build a small `<Breathe>` primitive on top of CSS animations and reuse
      across breathing screens, AI thinking dots, and tab focus glow.

Sources:
[Migration 3→4](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x/) ·
[Reanimated 4 stable announcement](https://blog.swmansion.com/reanimated-4-stable-release-the-future-of-react-native-animations-ba68210c3713) ·
[Performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/) ·
[4.2 introducing SETs](https://blog.swmansion.com/introducing-reanimated-4-2-0-71eea21ca861)

---

## 2. @shopify/react-native-skia

**Latest: 2.6.2 (Apr 2026).** Install: `npx expo install @shopify/react-native-skia`.

### Compatibility on Expo SDK 54 + New Arch

There was a real bug on early SDK 54: a Babel/Metro
`experimentalImportSupport: true` change broke the import order of
`SkiaViewApi`, throwing `ReferenceError: Property 'SkiaViewApi' doesn't exist`.
The fix shipped in Skia ≥ 2.4.x as a defensive re-import. **Pin to 2.6.x or
later** — earlier point releases are flaky on SDK 54.

If a build mysteriously fails after upgrade: nuke `android/`, `ios/`,
`node_modules/`, run `npx expo prebuild --clean`, then rebuild.

### Patterns we'll use

#### Mesh / aurora gradient background (the signature look)

```jsx
import { Canvas, RadialGradient, Rect, vec, Group, Blur }
  from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue, withRepeat, withTiming }
  from 'react-native-reanimated';

const t = useSharedValue(0);
useEffect(() => { t.value = withRepeat(withTiming(1, { duration: 8000 }), -1, true); }, []);

const c1 = useDerivedValue(() => vec(120 + 40 * Math.sin(t.value * Math.PI * 2), 200));
const c2 = useDerivedValue(() => vec(280, 360 + 30 * Math.cos(t.value * Math.PI * 2)));

<Canvas style={StyleSheet.absoluteFill}>
  <Group layer={<Paint><Blur blur={40} /></Paint>}>
    <Rect x={0} y={0} width={W} height={H}>
      <RadialGradient c={c1} r={260} colors={['#7E7CE0', '#0A0A1F']} />
    </Rect>
    <Rect x={0} y={0} width={W} height={H}>
      <RadialGradient c={c2} r={300} colors={['#E07CC6', 'transparent']} />
    </Rect>
  </Group>
</Canvas>
```

This is the standard "aurora" recipe — two animated radial gradients composed
over a layered Blur — and runs entirely on the GPU.

#### Blob morph (organic breathing shape)

Skia interpolates points along a `Path` natively. Build two `Path` objects and
interpolate them in a derived value:

```jsx
const path = useDerivedValue(() =>
  Skia.Path.MakeFromSVGString(blob1)!.interpolate(
    Skia.Path.MakeFromSVGString(blob2)!,
    t.value,
  )!,
);
<Path path={path} color={theme.aurora1} />
```

#### Particle systems

For 100+ moving dots or sparks, draw inside a single `<Canvas>` and animate via a
single shared value loop — **never** use 100 `<Animated.View>` nodes. That's the
case where Skia categorically wins.

#### Custom shaders (`RuntimeEffect`)

Use SkSL (Skia Shading Language) for procedural backgrounds, water ripples, and
glassmorphism effects. Uniforms can be driven by Reanimated shared values via
`useDerivedValue` — keeps everything on the UI thread.

#### Skottie (Skia's Lottie renderer)

If we want any Lottie animations, prefer `react-native-skottie` over
`lottie-react-native` — same JSON, +63 % FPS on low-end Android per the Margelo
benchmarks, and we already have Skia in the bundle so no extra cost.

```jsx
const animation = Skia.Skottie.Make(JSON.stringify(legoJSON));
const clock = useClock();
const frame = useDerivedValue(() =>
  Math.floor((clock.value / 1000) * animation.fps()) % (animation.duration() * animation.fps()),
);
<Canvas style={{ flex: 1 }}><Skottie animation={animation} frame={frame} /></Canvas>
```

### Bundle / perf characteristics

- ~1.5 MB native binary added per platform.
- Web: 2.9 MB gzipped CanvasKit WASM — **must** be lazy-loaded via `WithSkiaWeb`
  fallback component.
- GPU-accelerated, isolates from JS-thread jank.

### When NOT to use Skia

- For real backdrop blur over native scrollable content — **Skia BackdropFilter
  cannot blur views outside its Canvas.** Use `expo-blur` for navbars/modals.

Sources:
[Expo Skia docs](https://docs.expo.dev/versions/latest/sdk/skia/) ·
[Web setup](https://shopify.github.io/react-native-skia/docs/getting-started/web/) ·
[SDK 54 import bug](https://github.com/expo/expo/issues/39277) ·
[Animated gradient tutorial](https://reactiive.io/articles/animated-gradient)

---

## 3. expo-blur

**Latest: 15.x for SDK 54** (the `55.x` line targets SDK 55).
Install: `npx expo install expo-blur`.

### iOS vs Android reality

- **iOS:** Wraps `UIVisualEffectView`. Excellent perf; honours system reduce-
  transparency. This is the "real" experience.
- **Android (default):** Renders a semi-transparent View. **Not real blur.**
- **Android (opt-in):** `experimentalBlurMethod="dimezisBlurView"` uses
  Dimezis BlurView v3 (API 31+); real GPU blur but can hurt scroll FPS and has
  known crashes when stacked over `expo-image`.

### When blur tanks performance

- Animating `intensity` per frame.
- Nesting multiple `<BlurView>`s.
- Large blur surfaces during scroll — Android Dimezis path is the worst case.
- Combining with rounded corners without `overflow: 'hidden'` on the parent.

### Recommended usage pattern

```jsx
<BlurView
  intensity={Platform.OS === 'ios' ? 80 : 60}
  tint={isDark ? 'dark' : 'light'}
  experimentalBlurMethod="dimezisBlurView"   // android only
  style={{ borderRadius: 24, overflow: 'hidden' }}
>
  {/* glass card content */}
</BlurView>
```

Provide a graceful **solid translucent fallback** for any device that hates
the Dimezis path (configurable via a feature flag on the user profile).

### Alternatives evaluated

- `@react-native-community/blur` — same SDWebBlur foundation, less Expo-friendly.
- Skia `BackdropFilter` — works only on content inside the same Canvas.
- WebView CSS `backdrop-filter` — works but distorts borderRadius badly.

**Conclusion:** Stick with `expo-blur`. Design system should ship a single
`<GlassPanel>` primitive that wraps `BlurView` so we can swap implementations later
without touching consumers.

Sources:
[expo-blur docs](https://docs.expo.dev/versions/latest/sdk/blur-view/) ·
[Android perf issue](https://github.com/expo/expo/issues/23239) ·
[Dimezis V3 discussion](https://github.com/expo/expo/discussions/37905)

---

## 4. Moti

**Latest: 0.30.x.** Built on top of Reanimated 3/4. Verified working with
Reanimated 4.1.x in the latest "animated sentence" recipes.
Install: `npm i moti` (no native side, just JS).

### Why bother when Reanimated is already in the bundle?

- **Framer-Motion-style declarative API** — `from`, `animate`, `exit`, `transition`
  props; no `useSharedValue` boilerplate for the 80 % case.
- **`AnimatePresence`** — automatically animates unmount of removed children
  (lists, modals, toasts).
- Plays nicely with Reanimated shared values via `useDerivedValue`-driven
  `animate` props for the 20 % advanced case.
- ~3 KB JS overhead, no native module, web-compatible.

```jsx
import { MotiView, AnimatePresence } from 'moti';

<AnimatePresence>
  {visible && (
    <MotiView
      from={{ opacity: 0, translateY: 20, scale: 0.96 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      exit={{ opacity: 0, translateY: 20, scale: 0.98 }}
      transition={{ type: 'timing', duration: 280 }}
    />
  )}
</AnimatePresence>
```

**Verdict:** Yes, add it. Authoring time on screens is significantly faster, and
we still escape-hatch to raw worklets when needed. Pair with the Reanimated 4
CSS API — choose whichever feels more natural per component.

Sources:
[Moti vs Reanimated](https://moti.fyi/reanimated) ·
[Animated sentence recipe](https://www.animatereactnative.com/post/animated-sentence-reanimated-and-moti)

---

## 5. Gesture handling (RNGH 2.28 + Reanimated 4)

We're already on `react-native-gesture-handler ~2.28.0`. The new `Gesture.*` API
is the only supported path on Reanimated 4 — `useAnimatedGestureHandler` was
removed.

### Compose-with-ScrollView cheatsheet

| Goal | Recipe |
|------|--------|
| Inner pan + outer scroll concurrent | `Gesture.Pan().simultaneousWithExternalGesture(Gesture.Native())` |
| Scroll wins until inner long-press | `Gesture.Race(Pan.simultaneousWithExternalGesture(LongPress), LongPress)` |
| Outer wait for inner pan to fail | `Gesture.Tap().requireExternalGestureToFail(Pan)` |
| Both gestures live | `Gesture.Simultaneous(g1, g2)` |

### Pitfalls

- `GestureHandlerRootView` must wrap the entire app in `App.js` (verify).
- `GestureDetector` collapses if its only child is a wrapper View — wrap with a
  non-collapsible `<View collapsable={false}>` if the gesture isn't fired.
- Worklet callbacks call `scheduleOnRN(fn, args)` — *not* `runOnJS` (renamed).
- For tab-bar swipe vs ScrollView horizontal scroll inside a screen, prefer the
  native stack's swipe gesture over a custom one.

### Pattern: drawer pull-to-action

```jsx
const scroll = Gesture.Native();
const pan = Gesture.Pan()
  .simultaneousWithExternalGesture(scroll)
  .onUpdate(e => { y.value = Math.max(0, e.translationY); })
  .onEnd(e => {
    if (e.translationY > 120) scheduleOnRN(onAction);
    y.value = withSpring(0);
  });

<GestureDetector gesture={scroll}>
  <Animated.ScrollView>
    <GestureDetector gesture={pan}>
      <Animated.View>{children}</Animated.View>
    </GestureDetector>
  </Animated.ScrollView>
</GestureDetector>
```

Sources:
[RNGH composition issue #2616](https://github.com/software-mansion/react-native-gesture-handler/issues/2616) ·
[Pan + Scroll guide](https://medium.com/@taitasciore/handling-pan-and-scroll-gestures-simultaneously-and-gracefully-with-gesture-handler-2-reanimated-63f0d8f72d3c)

---

## 6. Shared element transitions

Reanimated 4 brought SETs back in **4.2.0**. **We must bump to ≥ 4.2.x.**

### Current state

- New Architecture only. ✓ already on it.
- Behind feature flag `ENABLE_SHARED_ELEMENT_TRANSITIONS`.
- Works only with **native stack** (`@react-navigation/native-stack`). ✓ we use it.
- Tab navigator path → no animation (known limitation).
- Modals with `presentation: 'transparentModal'` on iOS → SET is occluded.
- Custom worklet animations not supported yet — only `duration` and spring
  variants.

### API recap (Context7-verified)

```jsx
// Screen A
<Animated.Image source={uri} sharedTransitionTag="card-42" style={...} />

// Screen B (after navigate('Detail'))
<Animated.Image source={uri} sharedTransitionTag="card-42" style={...} />

// Optional custom transition
const transition = SharedTransition.custom(values => {
  'worklet';
  return {
    width:  withSpring(values.targetWidth),
    height: withSpring(values.targetHeight),
  };
});
<Animated.Image sharedTransitionStyle={transition} sharedTransitionTag="card-42" />
```

### Verdict

For the hero card → detail flow (chat session card → full thread, journal entry
→ editor), **use Reanimated 4.2 shared transitions**. For tab-bar transitions
or anything inside the tab navigator, fall back to a custom Reanimated layout
trick (animate from measured `pageX/pageY` between mounts) or `Moti`'s
`AnimatePresence` + a `transparentModal` overlay.

Sources:
[SET overview](https://docs.swmansion.com/react-native-reanimated/docs/shared-element-transitions/overview/) ·
[RNav guide](https://reactnavigation.org/docs/shared-element-transitions/) ·
[4.2 release notes](https://blog.swmansion.com/introducing-reanimated-4-2-0-71eea21ca861)

---

## 7. Navigation: stay on React Navigation 7

We're on RN-Nav 7.x with native-stack, bottom-tabs, and drawer. Expo Router
becomes the default in **SDK 55** (Sep 2025), but:

- **Migrating mid-redesign is a distraction.** Expo Router is a thin layer over
  RN-Nav 7 — same animation engine, same screens, same gestures.
- **Custom transitions and modal stacks are easier in RN-Nav** (Expo Router users
  routinely report rough edges here).
- Our deep-linking story is already handled via `expo-linking`; no inbound
  pressure to migrate.

**Recommendation:** Stay on RN-Nav 7 for this milestone. Revisit Expo Router
post-launch if we add a substantial web surface.

### Custom animated tab bar pattern

Because we want a custom glass tab bar, render it via `tabBar` prop:

```jsx
<Tab.Navigator tabBar={(props) => <SakinaTabBar {...props} />}>
  ...
</Tab.Navigator>
```

Inside `SakinaTabBar`, use `state.index` + `state.routes` + Reanimated CSS
transitions on the active indicator (translateX between tab centers). Use
`expo-blur` for the panel backdrop, optional Skia for an aurora pill.

Sources:
[RN-Nav 7 vs Expo Router](https://viewlytics.ai/blog/react-navigation-7-vs-expo-router) ·
[Migrate from RN-Nav guide](https://docs.expo.dev/router/migrate/from-react-navigation/)

---

## 8. Bottom sheets — `@gorhom/bottom-sheet`

**Pin to ≥ 5.1.8**. The 5.1.8 release was the first to officially work with
Reanimated 4 + `react-native-worklets/plugin`. Earlier versions silently fail to
open on RNW 4.

```bash
npx expo install @gorhom/bottom-sheet
```

Confirm peer deps: RNGH ≥ 2.16, RNW (worklets) ≥ 0.3, Reanimated ≥ 4.0.

### Usage skeleton

```jsx
const sheet = useRef<BottomSheetModal>(null);

<BottomSheetModalProvider>
  {/* app */}
  <BottomSheetModal
    ref={sheet}
    snapPoints={['25%', '60%', '95%']}
    enableDynamicSizing
    backdropComponent={(p) => (
      <BottomSheetBackdrop {...p} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
    )}
    backgroundComponent={(p) => (
      <BlurView intensity={80} tint="dark" {...p} />
    )}
  >
    <BottomSheetView>{/* content */}</BottomSheetView>
  </BottomSheetModal>
</BottomSheetModalProvider>
```

### Alternatives considered

- `@discord/bottom-sheet` (fork) — abandoned.
- Reanimated-only custom sheet — viable for tiny sheets, but Gorhom's gesture
  composition with FlatList/FlashList is non-trivial to replicate.

Sources:
[Gorhom site](https://gorhom.dev/react-native-bottom-sheet/) ·
[RNW 4 compat issue](https://github.com/gorhom/react-native-bottom-sheet/issues/2547)

---

## 9. Lottie vs Skia

| | Lottie (lottie-react-native) | Skottie (react-native-skottie) | Pure Skia |
|---|---|---|---|
| Renderer | Native iOS/Android Lottie | Skia GPU | Skia GPU |
| FPS on low-end Android | Baseline | **+63 %** | N/A |
| Bundle | +~600 KB native | Reuses Skia (no extra) | Reuses Skia |
| Drop-in for `.json` / `.lottie` | ✓ | ✓ (same props) | ✗ (custom code) |
| Customization at runtime | Limited | Dynamic props | Total |

**Recommendation:** Since we're already adding Skia, **use `react-native-skottie`**
for any After-Effects-exported animations and pure Skia for the bespoke
breathing/blob/aurora visuals. Skip `lottie-react-native` entirely.

Sources:
[Skottie repo](https://github.com/margelo/react-native-skottie) ·
[Skottie vs Lottie](https://sisodev.hashnode.dev/how-does-react-native-skottie-compare-to-react-native-lottie)

---

## 10. Icons

| Library | Bundle/icon | Strengths |
|---------|-------------|-----------|
| **`lucide-react-native`** | ~1.0–1.2× source gz | 1,600+ icons, modern stroke style, default in 2026 templates |
| `phosphor-react-native` | ~16–18× source gz | Multi-weight (thin/light/bold/duotone), differentiated look |
| `react-native-svg` (raw) | smallest | Brand assets, full control |
| `@expo/vector-icons` | bundled | Convenient (Feather, Ionicons), no extra peer dep |

**Recommendation:** **Add `lucide-react-native ^0.4xx` as the primary set.** It
already aligns with the wellness app aesthetic (rounded, gentle stroke), is
tree-shakable, and has the largest icon coverage. Keep `@expo/vector-icons` for
fallback (it's already in the project). Keep `react-native-svg` (transitive
peer of Lucide) for any custom Sakina-branded glyphs.

Avoid Phosphor unless we explicitly want the duotone weight set — bundle cost
is non-trivial.

```bash
npx expo install lucide-react-native react-native-svg
```

```jsx
import { Heart, Wind, BookOpen } from 'lucide-react-native';
<Heart size={24} color={theme.text} strokeWidth={1.75} />
```

Sources:
[Lucide guide](https://lucide.dev/guide/packages/lucide-react-native) ·
[Icon bundle benchmark](https://medium.com/codetodeploy/the-hidden-bundle-cost-of-react-icons-why-lucide-wins-in-2026-1ddb74c1a86c)

---

## 11. Fonts (DM Sans)

We already have `@expo-google-fonts/dm-sans ^0.4.2`.

### Recommendations

- **Stay on static weights.** Expo officially advises *against* variable fonts
  for cross-platform consistency. The `@expo-google-fonts/dm-sans` package ships
  static `400`, `500`, `700` etc. — pick the 3-4 we'll actually use.
- **Embed at build time** to avoid FOUT:

  ```js
  // app.config.js
  plugins: [
    ['expo-font', { fonts: [
      'node_modules/@expo-google-fonts/dm-sans/400Regular/DMSans_400Regular.ttf',
      'node_modules/@expo-google-fonts/dm-sans/500Medium/DMSans_500Medium.ttf',
      'node_modules/@expo-google-fonts/dm-sans/700Bold/DMSans_700Bold.ttf',
    ]}],
  ],
  ```

- **For web**, fall back to `useFonts()` + keep `SplashScreen.preventAutoHideAsync()`
  open until ready (already wired in our `App.js` likely).
- Use the modern subpath imports: `import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';` for tree-shaking.

Note the open issue (`expo/expo#26540`) about config-plugin loading being flaky
with Google Fonts — keep `useFonts` as a runtime safety net.

Sources:
[Expo fonts guide](https://docs.expo.dev/develop/user-interface/fonts/) ·
[`@expo-google-fonts/dm-sans` package](https://www.npmjs.com/package/@expo-google-fonts/dm-sans)

---

## 12. Theming — Unistyles v3

### Why not just React Context?

Each theme switch causes the entire subtree to re-render. For an app with the
animations we're planning, this is the difference between a 200 ms freeze and a
seamless transition.

### The 2026 contenders

| | Re-renders on theme switch | DX | Native StyleSheet familiar |
|---|---|---|---|
| **Unistyles v3** | **Zero** (C++ layer) | Excellent | ✓ |
| Tamagui | Few (extracted CSS) | Best for design systems | ✗ (own DSL) |
| Restyle (Shopify) | Some | Type-safe DS | ✗ (own props) |
| Nativewind | Zero (extracted) | Tailwind | ✗ |

**Recommendation:** Adopt **`react-native-unistyles ^3.x`**.

- Zero JS re-render on dark/light toggle — critical for our 60 fps target during
  the theme animation.
- StyleSheet-shaped API — minimal learning curve from existing code.
- First-class web support (RNW 0.21 compatible).
- Variants and breakpoints baked in.

```jsx
// theme.ts
import { StyleSheet } from 'react-native-unistyles';
const lightTheme = { aurora1: '#7E7CE0', text: '#0A0A1F', surface: 'rgba(255,255,255,0.6)' };
const darkTheme  = { aurora1: '#9E9CFF', text: '#F5F5FF', surface: 'rgba(20,20,40,0.5)' };
StyleSheet.configure({ themes: { light: lightTheme, dark: darkTheme }, settings: { adaptiveThemes: true }});

// Card.tsx
const styles = StyleSheet.create((theme) => ({
  card: { backgroundColor: theme.surface, borderRadius: 24, padding: 16 },
}));
```

Pair with `Appearance` listener for system changes and a single Zustand-style
store for explicit user override (one shared value).

Sources:
[Unistyles v3 theming](https://www.unistyl.es/v3/guides/theming/) ·
[Benchmark repo](https://github.com/efstathiosntonas/react-native-style-libraries-benchmark)

---

## 13. Forms & keyboard

### Form library: react-hook-form + Zod

Install: `npm i react-hook-form zod @hookform/resolvers`.

- Uncontrolled inputs → no re-render per keystroke (huge for chat input typing
  responsiveness on Android).
- `zodResolver` gives us schema + types in one place — pairs naturally with our
  TS gradual-migration plan.
- `Controller` wraps any `TextInput`/`Switch`.

```jsx
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
const { control, handleSubmit, formState: { errors } } = useForm({
  mode: 'onBlur',
  resolver: zodResolver(schema),
});
```

### Keyboard handling: react-native-keyboard-controller

Install: `npx expo install react-native-keyboard-controller` — **requires dev
build**, not Expo Go. We're already on EAS so this is fine.

- Replaces RN's flaky `KeyboardAvoidingView`.
- Provides `KeyboardAwareScrollView`, `KeyboardStickyView`, `KeyboardToolbar`
  (next/prev/done arrows above keyboard), `OverKeyboardView`.
- Identical API + animation on iOS and Android.
- Native worklet hook `useKeyboardHandler` for custom keyboard-driven motion.

```jsx
import { KeyboardAwareScrollView, KeyboardToolbar }
  from 'react-native-keyboard-controller';

<KeyboardAwareScrollView bottomOffset={62}>
  <Controller name="email" control={control} render={({ field }) => (
    <TextInput {...field} placeholder="Email" />
  )} />
</KeyboardAwareScrollView>
<KeyboardToolbar />
```

**Wrap the app once** at root with `<KeyboardProvider>` (same pattern as
SafeAreaProvider).

**Common pitfalls to avoid:**
- Don't nest FlashList inside KeyboardAwareScrollView — use FlashList directly
  with the keyboard hooks.
- Don't combine the new lib with RN's old `KeyboardAvoidingView`.

Sources:
[Keyboard Controller docs](https://docs.expo.dev/versions/latest/sdk/keyboard-controller/) ·
[Expo keyboard guide](https://docs.expo.dev/guides/keyboard-handling/) ·
[RHF + Zod guide](https://practicaldev.online/blog/reactjs/react-hook-form-zod-validation-guide)

---

## 14. Safe areas — `react-native-safe-area-context` (already present)

We're on `~5.6.0`. Bump to `5.7.x` (latest, 2026-02 release).

### Hard-learned rules

1. **Always use `useSafeAreaInsets`** — never the library's `SafeAreaView`
   component (jumpy during stack animations, deprecated).
2. **Mount `SafeAreaProvider` once at the root**, never per-screen.
3. **Set `initialMetrics`** to prevent the zero-inset first-frame flash:
   ```jsx
   import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
   <SafeAreaProvider initialMetrics={initialWindowMetrics}>...</SafeAreaProvider>
   ```
4. **On web**, the provider is mandatory — `useSafeAreaInsets()` returns zeros
   without it.
5. Don't trust insets *during* stack animations — they can briefly go to 0; if
   it shows, anchor the layout to the destination value (memoized) instead of
   reactively reading the inset.

Sources:
[RNSAC repo](https://github.com/AppAndFlow/react-native-safe-area-context) ·
[Issue #556 stack animation zero-inset bug](https://github.com/AppAndFlow/react-native-safe-area-context/issues/556)

---

## 15. System UI — status bar + Android nav bar

Android 15 (API 35) **enforces edge-to-edge** and deprecates
`StatusBar.backgroundColor` and `androidStatusBar.translucent`. We must embrace
edge-to-edge, not fight it.

### Plan

- **Status bar:** keep `expo-status-bar` (already installed). Use `style="auto"`
  so it follows the active theme; never set `backgroundColor`.
- **Android nav bar:** add **`expo-navigation-bar`** for setting button-icon
  style (light/dark) per screen. Solid colors only — gradient nav bar requires
  faking it with a behind-bar gradient view.
- **Edge-to-edge handling:** all screens use `useSafeAreaInsets()` so content
  reflows correctly under the bars.
- **Per-screen tinting:** in each screen's `useFocusEffect`, call
  `NavigationBar.setStyle('light' | 'dark')` to match the screen mood.

```jsx
useFocusEffect(useCallback(() => {
  if (Platform.OS === 'android') NavigationBar.setStyle('light');
}, []));
```

Sources:
[System bars guide](https://docs.expo.dev/develop/user-interface/system-bars/) ·
[Navigation bar API](https://docs.expo.dev/versions/latest/sdk/navigation-bar/)

---

## 16. List performance — FlashList v2

Install: `npx expo install @shopify/flash-list`.

### Why v2 specifically

- **JS-only, New-Architecture-only rewrite.** Drops the v1 native module — no
  more native build issues.
- **No `estimatedItemSize`** — automatic measurement using Fabric's synchronous
  layout API.
- **`maintainVisibleContentPosition` enabled by default** — *the* feature for
  chat lists where new messages append and old messages reposition.
- 5–10× FlatList perf for 500+ items, JS thread CPU usage observed dropping
  from 90 % to <10 % in production migrations.
- Improved web support (since it's no longer native-bound).

### Patterns for Sakina

- **Chat thread:** `<FlashList data={messages} inverted renderItem={...} />` —
  inverted + maintainVisible handles the "scroll pinned to bottom while old
  messages load" case.
- **Journal feed:** use `getItemType` to differentiate text vs image vs prompt
  cards so FlashList recycles by type.
- **Horizontal carousels** (mood selector, breathing patterns): v2 supports
  variable-size horizontal items natively.

```jsx
<FlashList
  data={messages}
  inverted
  keyExtractor={(m) => m.id}
  getItemType={(m) => m.kind}      // 'text' | 'image' | 'system'
  renderItem={({ item }) => <MessageBubble message={item} />}
/>
```

Sources:
[FlashList v2 announcement](https://shopify.engineering/flashlist-v2) ·
[FlashList docs](https://shopify.github.io/flash-list/)

---

## 17. Image handling — `expo-image`

Install: `npx expo install expo-image`.

### Why expo-image (over FastImage)

- Zero-config in Expo, FastImage requires custom dev client and is largely
  unmaintained in 2026.
- Four cache policies: `none | disk | memory | memory-disk` (default `disk`).
- **Built-in BlurHash + ThumbHash placeholders** — perfect for chat avatars,
  journal photo attachments, and feed images.
- Auto-transition crossfade on source change — no flicker.
- Cache management API: `Image.clearDiskCache()`, `clearMemoryCache()`,
  `getCachePathAsync()`, `prefetch()`.

```jsx
<Image
  source={{ uri: avatarUrl }}
  placeholder={{ blurhash: 'L9AS}j%2WB%2~qWBWBM{ofWBayof' }}
  contentFit="cover"
  cachePolicy="memory-disk"
  transition={250}
  style={{ width: 48, height: 48, borderRadius: 24 }}
/>
```

For hot lists (chat avatars), prefer `cachePolicy="memory-disk"` with explicit
`Image.prefetch([urls])` on screen mount.

Sources:
[expo-image docs](https://docs.expo.dev/versions/latest/sdk/image/) ·
[expo-image vs FastImage benchmark](https://github.com/candlefinance/faster-image/issues/10)

---

## 18. Haptics choreography

`expo-haptics` is already installed. Build a thin **`useHaptic()` wrapper** with
choreographed primitives so screens don't sprinkle raw API calls:

| Token | When | API |
|-------|------|-----|
| `tap` | small button press, toggle | `selectionAsync()` |
| `soft` | message sent, breath inhale start | `impactAsync(Light)` |
| `firm` | bookmark, save, complete a session | `impactAsync(Medium)` |
| `strong` | confirmation, milestone | `impactAsync(Heavy)` |
| `success` | success toast | `notificationAsync(Success)` |
| `warn` | crisis warning, validation error | `notificationAsync(Warning)` |
| `error` | API error toast | `notificationAsync(Error)` |

### Edge cases the wrapper must handle

- **Web** — `expo-haptics` uses Web Vibration API; not available on Safari/iOS
  Safari. Wrap in `Platform.OS !== 'web' && (vibration not in window)` check.
- **Low Power Mode on iOS** — Taptic engine silently no-ops. Detect via
  `expo-battery` `Battery.getPowerStateAsync()` and consider a small visual
  cue as a complement.
- **Honour reduce motion / OS haptic-off** — respect `AccessibilityInfo
  .isReduceMotionEnabled()`. Add a user-facing "haptics" toggle in Settings
  that overrides everything.

A common mistake is firing haptics on every keystroke or scroll event. Don't.
Use them as **punctuation**, not background music.

Sources:
[expo-haptics docs](https://docs.expo.dev/versions/latest/sdk/haptics/)

---

## 19. Web compatibility matrix

| Feature | iOS | Android | Web | Strategy |
|---------|-----|---------|-----|----------|
| Reanimated 4 (worklets, CSS API) | ✓ | ✓ | ✓ | Native everywhere |
| Skia primitives | ✓ | ✓ | ✓ via CanvasKit (2.9 MB WASM) | Lazy-load with `WithSkiaWeb` |
| `expo-blur` | ✓ real | △ Dimezis or fake | ✓ CSS `backdrop-filter` | Wrap in `<GlassPanel>` |
| `expo-haptics` | ✓ | ✓ | △ only browsers with Vibration API | Wrap, no-op web |
| `react-native-keyboard-controller` | ✓ | ✓ | ✗ partial | Conditional on native only |
| `react-native-safe-area-context` | ✓ | ✓ | ✓ (provider required) | Always set provider |
| FlashList v2 | ✓ | ✓ | ✓ much better than v1 | OK |
| Bottom sheet (Gorhom) | ✓ | ✓ | ✓ since v5 | OK |
| `expo-image` | ✓ | ✓ | ✓ | OK |
| Lucide icons | ✓ | ✓ | ✓ | OK |
| Variable fonts | ✗ inconsistent | ✗ inconsistent | ✓ | Stick with static |

### Skia web pattern

```jsx
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

// AuroraBackground.tsx is OUTSIDE the app/ dir to avoid Expo Router preload
<WithSkiaWeb
  fallback={<View style={{ backgroundColor: '#0A0A1F' }} />}
  getComponent={() => import('@/visuals/AuroraBackground')}
/>
```

Run `yarn setup-skia-web` (or `npm run` equivalent) on every Skia upgrade so
`canvaskit.wasm` ends up in the web `public/` folder.

Sources:
[Skia web setup](https://shopify.github.io/react-native-skia/docs/getting-started/web/) ·
[Web vibration support](https://github.com/expo/expo/issues/19141)

---

## 20. Testing & validation stack

### Unit / component
- **Jest + jest-expo + @testing-library/react-native** (already configured).
- Bump `@testing-library/jest-native` matchers, keep coverage thresholds.

### Accessibility
- **`jest-axe`** for web target a11y assertions on screens that build to web.
- Audit `accessibilityRole`, `accessibilityState`, contrast tokens.

### E2E — native
- **Maestro** (`maestro test flows/`) — YAML flows, fast, cross-platform, no
  native build hooks. Officially supported by EAS Workflows.
- Reserve **Detox** only if we hit a sync-flakiness wall Maestro can't solve;
  the setup tax is significant.

### E2E — web
- **Playwright** (already installed at root). Use it for:
  - Cross-route smoke tests of the web build.
  - **Screenshot diffing** of every screen via `expect(page).toHaveScreenshot()`.
  - Page Object Model in `tests/e2e/pages/`.

### Visual regression toolchain
- Store baselines under `tests/e2e/__screenshots__/` (gitignored binaries
  except a `.gitignore`-allowed reference set).
- In CI, run on a single deterministic Linux Chromium target — never compare
  across OSs.
- Use `mask:` selectors to ignore animated regions (aurora gradient, breathing
  pulse) so diffs don't churn.

### CI matrix recommendation
| Stage | What runs |
|-------|-----------|
| PR | jest, eslint, prettier, web build, Playwright smoke + screenshot diff |
| Merge to main | + Maestro flows on iOS sim and Android emulator via EAS |
| Release | + EAS Build + EAS Submit |

Sources:
[Maestro on EAS Workflows](https://docs.expo.dev/eas/workflows/examples/e2e-tests/) ·
[Maestro vs Detox 2026](https://www.pkgpulse.com/blog/detox-vs-maestro-vs-appium-react-native-e2e-testing-2026)

---

## Recommended additions to `frontend/package.json`

```jsonc
{
  "dependencies": {
    // animation foundations (additions)
    "moti": "^0.30.0",
    "@shopify/react-native-skia": "^2.6.2",
    "react-native-skottie": "^2.0.0",          // optional, only if Lottie used
    "expo-blur": "~15.0.0",                    // SDK-54 channel
    "expo-image": "~3.0.0",                    // SDK-54 channel

    // navigation polish
    "react-native-keyboard-controller": "^1.18.0",
    "expo-navigation-bar": "~5.0.0",

    // UI kit
    "@gorhom/bottom-sheet": "^5.1.8",
    "@shopify/flash-list": "^2.1.0",
    "lucide-react-native": "^0.460.0",
    "react-native-svg": "^15.8.0",

    // theming
    "react-native-unistyles": "^3.0.0",

    // forms
    "react-hook-form": "^7.54.0",
    "zod": "^3.23.0",
    "@hookform/resolvers": "^3.9.0",

    // bump
    "react-native-reanimated": "~4.2.0",       // bump to 4.2 for SETs + iOS sync flag
    "react-native-safe-area-context": "~5.7.0" // bug fixes
  },
  "devDependencies": {
    "jest-axe": "^9.0.0"                        // a11y matchers (web target)
  }
}
```

After install, run:

```bash
cd frontend
npx expo install --fix       # let Expo realign all SDK-pinned versions
npx expo prebuild --clean    # regen native projects
npx pod-install              # iOS only
yarn setup-skia-web || npm run setup-skia-web   # web canvaskit.wasm
```

## Libraries to remove or replace

- **Drop `react-native-markdown-display ^7.0.2` if we move to a custom renderer.**
  It works but is unmaintained and the `7.x` line lags React 19. If we keep
  Markdown, lock the version and add a snapshot test. Otherwise consider
  `react-native-marked` or hand-rolling a Skia/Text renderer for chat bubbles.
- Anywhere we currently use RN's built-in `KeyboardAvoidingView`, **replace with
  `react-native-keyboard-controller`'s `KeyboardAwareScrollView`**.
- Anywhere we use the library's `SafeAreaView` component, **replace with
  `useSafeAreaInsets` + manual padding**.
- Don't add `lottie-react-native` — go straight to `react-native-skottie`.
- Don't add `react-native-fast-image` — `expo-image` covers it.

## Top 5 risk areas

1. **Reanimated 4 ecosystem stragglers.** Any third-party that hard-pins to
   Reanimated 3 (or to `react-native-reanimated/plugin`) will silently break.
   Mitigation: pin every animation-adjacent dep, run `npx expo-doctor` after
   each install, and gate adoption on a smoke test in dev build.
2. **Skia CanvasKit WASM (2.9 MB) on Web.** Without lazy-loading it inflates
   first-paint and TBT massively. Mitigation: `WithSkiaWeb` everywhere, code-
   split per route, host `canvaskit.wasm` from CDN with long TTL.
3. **Android edge-to-edge enforcement (API 35).** `StatusBar.backgroundColor`
   silently does nothing on Android 15+. Mitigation: design assumes content
   reflows under the bars; use `expo-navigation-bar` for icon style only.
4. **Shared Element Transitions are still feature-flagged + tab-nav incompatible.**
   Plan hero animations only between native-stack screens; have a fallback
   mounted-cross-fade for tab paths.
5. **`expo-blur` Android remains the weakest link.** Test the Dimezis blur
   method early on a low-end Android device. If it's too slow, design a
   `<GlassPanel>` token that gracefully degrades to translucent solid +
   subtle inner shadow on Android.

---

### Master sources

- [Reanimated 4 stable announcement](https://blog.swmansion.com/reanimated-4-stable-release-the-future-of-react-native-animations-ba68210c3713)
- [Reanimated Migration 3.x → 4.x](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x/)
- [Reanimated Performance Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- [Reanimated 4.2 introducing SETs](https://blog.swmansion.com/introducing-reanimated-4-2-0-71eea21ca861)
- [React Native Skia docs](https://shopify.github.io/react-native-skia/)
- [Skia on Expo](https://docs.expo.dev/versions/latest/sdk/skia/)
- [Expo BlurView](https://docs.expo.dev/versions/latest/sdk/blur-view/)
- [Moti vs Reanimated](https://moti.fyi/reanimated)
- [@gorhom/bottom-sheet](https://gorhom.dev/react-native-bottom-sheet/)
- [FlashList v2 Shopify Engineering](https://shopify.engineering/flashlist-v2)
- [expo-image](https://docs.expo.dev/versions/latest/sdk/image/)
- [Unistyles v3 theming](https://www.unistyl.es/v3/guides/theming/)
- [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)
- [Expo Fonts guide](https://docs.expo.dev/develop/user-interface/fonts/)
- [Expo System bars guide](https://docs.expo.dev/develop/user-interface/system-bars/)
- [react-native-keyboard-controller on Expo](https://docs.expo.dev/versions/latest/sdk/keyboard-controller/)
- [react-native-safe-area-context](https://github.com/AppAndFlow/react-native-safe-area-context)
- [RN Gesture Handler — gesture composition issue thread](https://github.com/software-mansion/react-native-gesture-handler/issues/2616)
- [Maestro on EAS Workflows](https://docs.expo.dev/eas/workflows/examples/e2e-tests/)
- [Detox vs Maestro vs Appium 2026](https://www.pkgpulse.com/blog/detox-vs-maestro-vs-appium-react-native-e2e-testing-2026)
- [Skottie repo (Margelo)](https://github.com/margelo/react-native-skottie)
- [Lucide vs Phosphor 2026](https://www.wmtips.com/technologies/compare/lucide-vs-phosphor-icons/)
- [React Hook Form + Zod (PracticalDev)](https://practicaldev.online/blog/reactjs/react-hook-form-zod-validation-guide)
