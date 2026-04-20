# UX Bug Prevention Catalog — Sakina AI Redesign

> **Audience:** every engineer touching a redesigned screen.
> **Purpose:** before you mark a component "done", every applicable check below MUST pass. This is not aspirational — every item here corresponds to a real bug that has bitten production React Native apps (and several have already bitten Sakina).
> **Stack assumed:** Expo SDK 54, React Native 0.81 (New Architecture enabled), React Navigation 7, react-native-reanimated 4, react-native-safe-area-context, react-native-keyboard-controller (added during redesign), react-native-gesture-handler.
> **How to use this doc:** treat each numbered "Check" as a checklist line item. PRs should link the checks they verified. Where a code snippet shows a `WRONG` and a `RIGHT`, the `WRONG` is a bug class we have actually shipped before — reproduce, see the bug, then apply the fix.

---

## Table of contents

1. [Keyboard handling](#1-keyboard-handling)
2. [Layout & alignment](#2-layout--alignment)
3. [Safe areas & notches](#3-safe-areas--notches)
4. [Scrolling](#4-scrolling)
5. [Navigation](#5-navigation)
6. [Modals, sheets & overlays](#6-modals-sheets--overlays)
7. [Forms](#7-forms)
8. [Loading & async states](#8-loading--async-states)
9. [Error handling](#9-error-handling)
10. [Animations](#10-animations)
11. [Touch & gesture](#11-touch--gesture)
12. [State management](#12-state-management)
13. [Theme & dark mode](#13-theme--dark-mode)
14. [Accessibility](#14-accessibility)
15. [Performance](#15-performance)
16. [Platform differences](#16-platform-differences)
17. [Internationalization](#17-internationalization)
18. [Image & media](#18-image--media)
19. [Network & offline](#19-network--offline)
20. [Push notifications](#20-push-notifications)
21. [Verification matrix](#21-verification-matrix)
22. [Top-10 bugs most likely to bite this redesign](#22-top-10-bugs-most-likely-to-bite-this-redesign)
23. [Recommended automated guards](#23-recommended-automated-guards)

---

## 1. Keyboard handling

### 1.1 Tap-outside-to-dismiss does not work

**Symptom:** user taps anywhere outside a `TextInput`, keyboard stays open. They tap a button — the first tap dismisses the keyboard, the second tap actually fires `onPress` (the infamous double-tap bug).

**Root cause:** No keyboard dismiss handler is wired up; or a wrapping `ScrollView` defaults to `keyboardShouldPersistTaps="never"`, which consumes the first tap to dismiss the keyboard and never delivers it to children.

**Prevention pattern:**

```jsx
// ❌ WRONG — first tap on the button only dismisses the keyboard
<ScrollView>
  <TextInput value={text} onChangeText={setText} />
  <Pressable onPress={handleSubmit}><Text>Save</Text></Pressable>
</ScrollView>

// ✅ RIGHT — child handlers fire on the FIRST tap; empty-area taps still dismiss
<ScrollView keyboardShouldPersistTaps="handled">
  <TextInput value={text} onChangeText={setText} />
  <Pressable onPress={handleSubmit}><Text>Save</Text></Pressable>
</ScrollView>
```

For non-scroll screens, wrap the root in a `Pressable` (NOT `TouchableWithoutFeedback`, which is deprecated for new code):

```jsx
import { Keyboard, Pressable, View } from 'react-native';

<Pressable
  style={{ flex: 1 }}
  onPress={Keyboard.dismiss}
  // a11y: the wrapper is not a real button — hide it from screen readers
  accessible={false}
>
  <View>{/* form content */}</View>
</Pressable>
```

**Checks**
- [ ] **C-1.1.1** Every `ScrollView` / `FlatList` / `FlashList` containing a `TextInput` has `keyboardShouldPersistTaps="handled"`.
- [ ] **C-1.1.2** Every screen with at least one `TextInput` dismisses the keyboard on a single tap to empty space.
- [ ] **C-1.1.3** No `TouchableWithoutFeedback` is introduced in new code (use `Pressable`).

**Verification:** manual on iOS + Android, plus a Detox/Playwright E2E "tap outside dismisses keyboard" assertion on the login + journal screens.

---

### 1.2 Keyboard covers the focused input

**Symptom:** user focuses a `TextInput` near the bottom of the screen; the keyboard slides up and hides the field they are typing into.

**Root cause:** No `KeyboardAvoidingView` wrapping the form, or the wrong `behavior` for the platform (the built-in `KeyboardAvoidingView` "sometimes works, sometimes doesn't, and behaves completely differently on iOS vs Android" — see the [Expo keyboard handling guide](https://docs.expo.dev/guides/keyboard-handling/) and [keyboard-controller docs](https://kirillzyusko.github.io/react-native-keyboard-controller/docs/api/components/keyboard-avoiding-view)).

**Prevention pattern:** use `react-native-keyboard-controller`'s `KeyboardAvoidingView` and `KeyboardAwareScrollView` — they ship a unified, animated implementation across iOS and Android, and the library is bundled in Expo Go since SDK 54.

```jsx
// ✅ RIGHT — single component, identical iOS/Android behavior
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

<KeyboardAwareScrollView
  bottomOffset={20}                 // distance between focused input and keyboard top
  keyboardShouldPersistTaps="handled"
  contentContainerStyle={{ flexGrow: 1, padding: 16 }}
>
  <TextInput ... />
  <TextInput ... />
  <SubmitButton />
</KeyboardAwareScrollView>
```

Mount `<KeyboardProvider />` once at the app root (above navigation) so the rest of the library works.

**Anti-pattern:** never combine `KeyboardAvoidingView` + `KeyboardAwareScrollView` + `FlashList` in the same subtree — three components fighting for scroll ownership produce unpredictable behavior. Pick one container.

**Checks**
- [ ] **C-1.2.1** App root mounts `<KeyboardProvider />`.
- [ ] **C-1.2.2** Every screen with multiple inputs uses `KeyboardAwareScrollView` from `react-native-keyboard-controller`, not the built-in.
- [ ] **C-1.2.3** No screen mixes two keyboard-handling containers.
- [ ] **C-1.2.4** Focused input is fully visible (no clipping by keyboard) on iPhone SE (smallest screen) and a 5"-class Android.

---

### 1.3 Submit-on-enter / next-field-on-enter / returnKeyType

**Symptom:** user hits return, nothing happens (or keyboard collapses but nothing submits). Or there's no visual hint of what return will do.

**Prevention pattern:**

```jsx
const passwordRef = useRef(null);

<TextInput
  returnKeyType="next"
  blurOnSubmit={false}
  onSubmitEditing={() => passwordRef.current?.focus()}
  autoCorrect={false}
  autoCapitalize="none"
  textContentType="username"
  autoComplete="username"
/>
<TextInput
  ref={passwordRef}
  returnKeyType="go"
  secureTextEntry
  onSubmitEditing={handleLogin}
  autoCorrect={false}
  autoCapitalize="none"
  textContentType="password"
  autoComplete="password"
/>
```

**Checks**
- [ ] **C-1.3.1** Every `TextInput` sets a meaningful `returnKeyType` (`next`, `done`, `go`, `search`, `send`).
- [ ] **C-1.3.2** Multi-field forms wire `onSubmitEditing` to focus the next field; the last field submits.
- [ ] **C-1.3.3** Email / password fields set `autoCorrect={false}` and `autoCapitalize="none"`.
- [ ] **C-1.3.4** Password fields set `secureTextEntry`, `textContentType="password"`, and `autoComplete="password"` (or `"new-password"` for sign-up).

---

### 1.4 Keyboard appearance + theme mismatch

**Symptom:** dark theme app, but iOS keyboard renders in light style — jarring.

**Prevention:**

```jsx
<TextInput
  keyboardAppearance={isDarkMode ? 'dark' : 'light'} // iOS only
  ...
/>
```

- [ ] **C-1.4.1** Every `TextInput` reads `keyboardAppearance` from the active theme.

---

### 1.5 Android `windowSoftInputMode`

**Symptom:** on Android, the screen layout doesn't adjust when the keyboard opens — content gets pushed under the keyboard, or the resize is janky.

**Prevention:** in `app.config.js`, set:

```js
android: {
  softwareKeyboardLayoutMode: 'pan', // or 'resize' for forms with their own scroll
}
```

For RN 0.81 + edge-to-edge, prefer `pan` and let `KeyboardAwareScrollView` from keyboard-controller handle the avoidance.

- [ ] **C-1.5.1** `softwareKeyboardLayoutMode` is explicitly set in `app.config.js` (do not rely on default).

---

### 1.6 iOS hardware keyboard / accessory bar

- [ ] **C-1.6.1** External keyboard "Tab" key cycles through inputs in logical order (verify with iPad + Bluetooth keyboard or simulator hardware keyboard).
- [ ] **C-1.6.2** Use `react-native-keyboard-controller`'s `KeyboardToolbar` to provide Done / Previous / Next buttons on iOS.

---

## 2. Layout & alignment

### 2.1 Text overflow / wrapping

**Symptom:** a long username or translated string wraps to 3 lines and breaks the row.

**Prevention:**

```jsx
// ❌ WRONG — long text pushes the icon off-screen
<View style={{ flexDirection: 'row' }}>
  <Text>{user.displayName}</Text>
  <ChevronIcon />
</View>

// ✅ RIGHT — text shrinks and ellipsizes; icon stays put
<View style={{ flexDirection: 'row', alignItems: 'center' }}>
  <Text
    style={{ flexShrink: 1, minWidth: 0 }}
    numberOfLines={1}
    ellipsizeMode="tail"
  >
    {user.displayName}
  </Text>
  <ChevronIcon />
</View>
```

`minWidth: 0` is critical on flex items containing text — without it, the text node refuses to shrink below its intrinsic content width.

**Checks**
- [ ] **C-2.1.1** Every `Text` that could receive user-generated or translated content sets `numberOfLines` and `ellipsizeMode`.
- [ ] **C-2.1.2** Text inside flex rows uses `flexShrink: 1` (and `minWidth: 0` for nested cases).
- [ ] **C-2.1.3** Test with a 60-character username and German translations (typically +30% length).

---

### 2.2 Buttons cut off / misaligned

**Symptom:** "Save" button half-hidden under the tab bar; or a row of two buttons shows one wider than the other.

**Prevention:**

```jsx
// Equal-width buttons in a row
<View style={{ flexDirection: 'row', gap: 12 }}>
  <Button style={{ flex: 1 }} title="Cancel" onPress={onCancel} />
  <Button style={{ flex: 1 }} title="Save"   onPress={onSave} />
</View>
```

Always combine `flex: 1` with `gap` (RN supports `gap` as of 0.71) instead of margins — margins double up between siblings.

**Checks**
- [ ] **C-2.2.1** Sibling action buttons in a row use `flex: 1` for equal widths.
- [ ] **C-2.2.2** Bottom-anchored CTAs use `useSafeAreaInsets().bottom` padding (not hardcoded values).
- [ ] **C-2.2.3** Use `gap` instead of `margin` between flex siblings (no double-spacing).

---

### 2.3 Touch targets too small

**Symptom:** users complain icon buttons are hard to tap, especially the close (X) icon.

**Prevention:** Apple HIG says ≥44×44pt, Material says ≥48×48dp. Combine `padding` (preferred — visible target) with `hitSlop` (when visual size must stay small).

```jsx
const HIT = (size) => {
  const pad = (44 - size) / 2;
  return { top: pad, bottom: pad, left: pad, right: pad };
};

<Pressable
  onPress={onClose}
  accessibilityRole="button"
  accessibilityLabel="Close dialog"
  hitSlop={HIT(16)}
  style={{ padding: 8 }}
>
  <CloseIcon size={16} />
</Pressable>
```

Note: `hitSlop` cannot extend past parent bounds, and overlapping hit slops on adjacent buttons cause silent mis-taps — keep ≥8pt visual spacing between adjacent icon buttons.

**Checks**
- [ ] **C-2.3.1** Every interactive element has an effective hit area ≥44×44pt (iOS) and ≥48×48dp (Android).
- [ ] **C-2.3.2** Adjacent icon buttons leave ≥8pt visual space (no overlapping hit slops).

---

### 2.4 Off-by-one borders

**Symptom:** a "1px" divider looks blurry or different on every device.

**Prevention:**

```jsx
import { StyleSheet } from 'react-native';

<View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.divider }} />
```

- [ ] **C-2.4.1** Dividers and 1px borders use `StyleSheet.hairlineWidth`.

---

### 2.5 Centering bugs

**Symptom:** "I gave it `justifyContent: 'center'` but it's not centered."

**Common causes:**
- Parent has no explicit height → flex axis collapses.
- Confusing main-axis (`justifyContent`) vs cross-axis (`alignItems`).
- Centering inside a `ScrollView` requires `contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}`, NOT a `style` prop.

```jsx
// ✅ RIGHT — empty-state centered inside a scrollable area
<ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
  <EmptyState />
</ScrollView>
```

- [ ] **C-2.5.1** Centering inside `ScrollView` uses `contentContainerStyle.flexGrow: 1`.

---

### 2.6 Absolute positioning + z-index

- [ ] **C-2.6.1** Any `position: 'absolute'` element documents *what* it overlays and includes a `zIndex` if siblings could overlap.
- [ ] **C-2.6.2** On Android, `elevation` matters more than `zIndex` for shadow stacking.

---

### 2.7 RTL / writing direction

- [ ] **C-2.7.1** Avoid `marginLeft` / `marginRight`; use `marginStart` / `marginEnd` (or `gap`) so RTL flips automatically.
- [ ] **C-2.7.2** Icons that imply direction (back arrows, chevrons) flip in RTL via `transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }]`.

---

## 3. Safe areas & notches

### 3.1 Use `useSafeAreaInsets`, not built-in `SafeAreaView`

React Native's core `SafeAreaView` is deprecated and does not handle Android notches. Use `react-native-safe-area-context`. React Navigation explicitly recommends `useSafeAreaInsets` over the `SafeAreaView` component — using both together can cause flickering as they update at different times.

```jsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Screen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* content */}
    </View>
  );
}
```

**Checks**
- [ ] **C-3.1.1** No imports of `SafeAreaView` from `react-native` (only from `react-native-safe-area-context`, and only when its synchronous behavior on rotation is needed).
- [ ] **C-3.1.2** App root mounts `<SafeAreaProvider>`. (Expo Router supplies this implicitly, but modals and the new architecture sometimes need an explicit one — see the [Expo issue tracker](https://github.com/expo/expo/issues/28818).)

---

### 3.2 Don't double-pad

**Symptom:** giant gap above the screen header on devices with a notch.

**Cause:** both the navigator header AND a `SafeAreaView` are applying top inset.

**Prevention:** when inside a navigator that already pads for the header, only request the edges you need:

```jsx
<SafeAreaView edges={['left', 'right', 'bottom']}>...</SafeAreaView>
```

- [ ] **C-3.2.1** Screens nested in a stack with a header do NOT add `paddingTop: insets.top` — the header already does it.

---

### 3.3 Bottom tab bar overlap

**Symptom:** content is hidden under the tab bar, or a sticky footer button sits on top of the home indicator.

**Prevention:**

```jsx
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
const tabBarHeight = useBottomTabBarHeight();
const insets = useSafeAreaInsets();

<ScrollView contentContainerStyle={{ paddingBottom: tabBarHeight + insets.bottom + 16 }}>
  ...
</ScrollView>
```

- [ ] **C-3.3.1** Scrollable screens inside a tab navigator pad bottom by `tabBarHeight + insets.bottom`.
- [ ] **C-3.3.2** Sticky bottom CTAs sit ABOVE the home indicator (offset by `insets.bottom`).

---

### 3.4 Status bar + notch + Dynamic Island

- [ ] **C-3.4.1** Test layouts on: iPhone SE (no notch), iPhone 14 (notch), iPhone 15 Pro (Dynamic Island), Pixel 7 (punch-hole).
- [ ] **C-3.4.2** `<StatusBar style={isDark ? 'light' : 'dark'} />` is set per-screen if the screen background differs from the app default.

---

### 3.5 Android edge-to-edge

RN 0.81+ enables edge-to-edge on Android by default (Android 15 mandates it). Without proper safe-area handling, content draws under the system navigation bar.

- [ ] **C-3.5.1** `android.edgeToEdgeEnabled = true` in `app.config.js` (already required by RN 0.81 + Android 15+).
- [ ] **C-3.5.2** Bottom safe-area inset is applied to every screen (otherwise the gesture pill overlaps content).

---

### 3.6 Modals don't inherit context

Modals can render outside the `SafeAreaProvider` tree. If `useSafeAreaInsets()` returns zeros inside a modal, wrap the modal contents in their own `<SafeAreaProvider>` or use the `react-native-safe-area-context` `SafeAreaView` directly.

- [ ] **C-3.6.1** Every modal screen renders correctly on a notched device (verify visually).

---

## 4. Scrolling

### 4.1 Nested vertical scroll views

**Symptom:** scrolling stutters or stops working in the middle of a screen.

**Prevention:** never put a `ScrollView` inside another vertical `ScrollView`. If you need a list inside a scrollable screen, use a single outer `FlashList` with header/footer components.

- [ ] **C-4.1.1** No vertical `ScrollView`/`FlatList`/`FlashList` is nested inside another vertical scroller.

---

### 4.2 FlashList for long lists

For lists of >50 items, use `@shopify/flash-list` instead of `FlatList`. It uses cell recycling (like Android's `RecyclerView` / iOS's `UITableView`) and produces measurably better performance, especially on low-end Android — case studies show JS thread CPU dropping from >90% to <10%.

```jsx
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={messages}
  keyExtractor={(item) => item.id}
  estimatedItemSize={72}                // CRITICAL — pick the median item height
  renderItem={({ item }) => <MessageRow item={item} />}
  // FlashList auto-recycles; never set `key` on the rendered item
/>
```

**Checks**
- [ ] **C-4.2.1** Lists rendering >50 items use `FlashList`, not `FlatList`.
- [ ] **C-4.2.2** `estimatedItemSize` is set to the median item height.
- [ ] **C-4.2.3** No `key` prop on `renderItem` output (breaks recycling).

---

### 4.3 `onEndReached` fires too often

**Symptom:** infinite-scroll fetcher fires 5 times for one scroll-to-bottom.

**Prevention:**

```jsx
<FlashList
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  // Also: gate inside loadMore with isLoading + hasNextPage refs
/>
```

```js
const loadingRef = useRef(false);
const loadMore = useCallback(async () => {
  if (loadingRef.current || !hasNextPage) return;
  loadingRef.current = true;
  try { await fetchNextPage(); } finally { loadingRef.current = false; }
}, [hasNextPage]);
```

- [ ] **C-4.3.1** `onEndReached` is guarded by an in-flight ref AND a `hasNextPage` check.

---

### 4.4 Pull-to-refresh

```jsx
<FlashList
  refreshing={isRefreshing}
  onRefresh={refresh}
  // OR pass a custom RefreshControl with theme tinting
/>
```

- [ ] **C-4.4.1** Refresh spinner color matches theme accent on both platforms.

---

### 4.5 `keyboardShouldPersistTaps`

Already covered in §1.1 — repeating because it lives on every scroll component.

- [ ] **C-4.5.1** Every scroller containing inputs sets `keyboardShouldPersistTaps="handled"`.

---

### 4.6 Floating tab bar `contentInset`

If a translucent tab bar floats over content, set `contentInsetAdjustmentBehavior="automatic"` on iOS and pad bottom manually on Android (Android lacks the iOS auto-adjust).

- [ ] **C-4.6.1** iOS uses `contentInsetAdjustmentBehavior="automatic"`; Android uses explicit padding.

---

## 5. Navigation

### 5.1 Android hardware back button

**Symptom:** back button closes the entire app instead of dismissing a modal or sub-state.

**Prevention:** use `useFocusEffect` + `BackHandler` (per the [React Navigation docs](https://reactnavigation.org/docs/custom-android-back-button-handling/)).

```jsx
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

useFocusEffect(
  useCallback(() => {
    const onBack = () => {
      if (isSelectionMode) {
        exitSelectionMode();
        return true;            // we handled it
      }
      return false;             // let nav pop the screen
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [isSelectionMode])
);
```

⚠️ React Native's built-in `<Modal>` swallows back events. Prefer a navigator screen with `presentation: 'modal'`.

- [ ] **C-5.1.1** Any screen with a transient sub-state (selection, search-open, etc.) handles Android back via `useFocusEffect` + `BackHandler`.
- [ ] **C-5.1.2** No new uses of React Native's built-in `<Modal>`; use stack screens with `presentation: 'modal'` or `'transparentModal'`.

---

### 5.2 Tab bar hiding on certain screens

```jsx
<Stack.Screen
  name="Chat"
  component={ChatScreen}
  options={{ tabBarStyle: { display: 'none' } }}
/>
```

Or restructure so the screen lives outside the tab navigator (cleaner for a full-screen experience like onboarding).

- [ ] **C-5.2.1** Full-screen flows (onboarding, crisis modal, full-screen video) hide the tab bar.

---

### 5.3 Stack reset on logout

**Symptom:** user logs out, then back-swipes, and lands on the previous user's data.

**Prevention:**

```js
navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
```

- [ ] **C-5.3.1** Logout calls `navigation.reset` (or swaps the navigator at the auth-state level), never `navigate`.
- [ ] **C-5.3.2** All sensitive in-memory state (chat history, journal entries) is cleared on logout.

---

### 5.4 Gesture-back conflicts with horizontal scroll

**Symptom:** swiping a horizontal carousel near the left edge triggers a back navigation.

**Prevention:**

```jsx
<Stack.Screen options={{ gestureResponseDistance: { horizontal: 25 } }} />
// or fully disable for that screen:
<Stack.Screen options={{ gestureEnabled: false }} />
```

- [ ] **C-5.4.1** Screens with edge-anchored horizontal scroll restrict the swipe-back response area.

---

### 5.5 Deep linking

- [ ] **C-5.5.1** Every deep-link path validates its params and routes to a "not found" screen on bad input — never crash.
- [ ] **C-5.5.2** Cold-start deep link works (not just warm-start).

---

## 6. Modals, sheets & overlays

### 6.1 Multiple modals stacking

**Symptom:** opening a modal from inside another modal silently fails on iOS.

**Prevention:** dismiss the first modal before opening the second, OR use a single navigator-managed modal stack.

- [ ] **C-6.1.1** No code path opens a modal while another is presented (programmatically dismiss first).

---

### 6.2 Tap-outside / backdrop dismiss

```jsx
<Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
  <Pressable onPress={(e) => e.stopPropagation()} style={sheetStyle}>
    {/* sheet contents */}
  </Pressable>
</Pressable>
```

Note the inner `Pressable` with `stopPropagation` so taps on the sheet itself don't dismiss it.

- [ ] **C-6.2.1** Backdrop is tappable to dismiss; inner content does not propagate.
- [ ] **C-6.2.2** Hardware back / swipe-down also dismisses.

---

### 6.3 Keyboard inside a modal

Mount `KeyboardProvider` outside the navigator (already covered in §1.2) so it's available in modal screens too. For full-screen modals, the regular `KeyboardAwareScrollView` works; for half-sheets, prefer `@gorhom/bottom-sheet` which has built-in keyboard handling.

- [ ] **C-6.3.1** Any modal containing a `TextInput` is verified to keep the input visible above the keyboard.

---

### 6.4 StatusBar inside modals (iOS)

iOS resets the status bar style when a modal mounts. Set it explicitly:

```jsx
<Modal>
  <StatusBar style="light" />
  ...
</Modal>
```

- [ ] **C-6.4.1** Modal screens declare their own `<StatusBar />` to avoid flicker.

---

## 7. Forms

### 7.1 Validation timing

**Recommendation:** validate **on blur** for individual fields, validate **on submit** for cross-field rules. Never validate on every keystroke (jittery error flashes).

```js
// react-hook-form configuration
useForm({ mode: 'onBlur', reValidateMode: 'onBlur' });
```

- [ ] **C-7.1.1** Field-level errors appear on blur, not on every keystroke.
- [ ] **C-7.1.2** Form-level errors appear on submit attempt.

---

### 7.2 Error messages don't shift layout

**Symptom:** error message appears, pushing the submit button down by 18px — user mis-taps.

**Prevention:** reserve vertical space for the error region:

```jsx
<View style={{ minHeight: 18 }}>
  {error ? <Text style={styles.error}>{error}</Text> : null}
</View>
```

- [ ] **C-7.2.1** Error regions reserve their vertical space (or animate in/out without affecting siblings).

---

### 7.3 Disabled state visuals

- [ ] **C-7.3.1** Disabled buttons have ≥3:1 contrast against background (still visible to low-vision users) and a clearly muted style.
- [ ] **C-7.3.2** Disabled state has `accessibilityState={{ disabled: true }}`.

---

### 7.4 Loading state on submit (prevent double-submit)

**Symptom:** user double-taps "Sign up" → two accounts created.

**Prevention:**

```jsx
const [submitting, setSubmitting] = useState(false);

const onSubmit = async () => {
  if (submitting) return;
  setSubmitting(true);
  try {
    await api.register(form);
  } finally {
    setSubmitting(false);
  }
};

<Pressable
  disabled={submitting}
  onPress={onSubmit}
  accessibilityState={{ disabled: submitting, busy: submitting }}
>
  {submitting ? <ActivityIndicator /> : <Text>Sign up</Text>}
</Pressable>
```

For network-level idempotency, also send an idempotency key header.

- [ ] **C-7.4.1** Submit handlers gate on a `submitting` flag.
- [ ] **C-7.4.2** Button disables AND shows an inline spinner while submitting.
- [ ] **C-7.4.3** Mutating endpoints accept and respect an `Idempotency-Key` header.

---

### 7.5 Auto-focus first field

```jsx
const firstFieldRef = useRef(null);
useEffect(() => {
  // Delay one frame so the screen mount animation completes
  const id = setTimeout(() => firstFieldRef.current?.focus(), 100);
  return () => clearTimeout(id);
}, []);
```

- [ ] **C-7.5.1** Single-purpose forms (login, search) auto-focus the first input after mount.
- [ ] **C-7.5.2** Multi-step forms do NOT auto-focus on subsequent steps if the user might want to read instructions first.

---

### 7.6 Async validation debouncing

```js
const validateUsername = useMemo(
  () => debounce(async (name) => api.checkUsername(name), 500),
  []
);
```

- [ ] **C-7.6.1** All async validators are debounced ≥300ms.
- [ ] **C-7.6.2** Async validators are cancellable (AbortController) so stale responses don't overwrite newer state.

---

## 8. Loading & async states

### 8.1 Three distinct states: empty / loading / error

**Anti-pattern:** "if no data, show spinner" — the spinner never disappears when the list is genuinely empty.

```jsx
if (status === 'loading') return <SkeletonList />;
if (status === 'error')   return <ErrorState onRetry={refetch} />;
if (data.length === 0)    return <EmptyState />;
return <List data={data} />;
```

- [ ] **C-8.1.1** Every async screen explicitly handles loading / error / empty / success — four states, never collapsed.

---

### 8.2 Skeleton loaders > spinners

Prefer skeleton screens (matching the final layout shape) over centered spinners for known content shapes — they reduce perceived latency.

- [ ] **C-8.2.1** Lists and content screens use skeleton loaders; spinners are reserved for "unknown duration" actions.

---

### 8.3 Pull-to-refresh + initial load coordination

**Bug:** initial fetch shows full-screen spinner; pull-to-refresh ALSO shows full-screen spinner.

**Fix:** initial fetch uses `isLoading`, refresh uses `isRefetching` — only `isLoading` triggers the full-screen state.

- [ ] **C-8.3.1** Refresh does not unmount the list (use `isRefetching`, not `isLoading`).

---

### 8.4 Optimistic UI

For thumbs-up / bookmark / favorite — apply locally immediately, roll back on server error:

```js
const toggleBookmark = async (id) => {
  setLocal((prev) => ({ ...prev, [id]: !prev[id] })); // optimistic
  try { await api.toggleBookmark(id); }
  catch (e) {
    setLocal((prev) => ({ ...prev, [id]: !prev[id] })); // rollback
    showToast('Could not update bookmark');
  }
};
```

- [ ] **C-8.4.1** Quick-toggle UI (likes, bookmarks, favorites) updates locally first.
- [ ] **C-8.4.2** Failure rollback fires a toast or inline error so the user knows.

---

## 9. Error handling

### 9.1 Network errors

```jsx
if (error?.type === 'network') {
  return <OfflineBanner onRetry={refetch} />;
}
if (error?.status >= 500) {
  return <ServerErrorState onRetry={refetch} />;
}
return <GenericError message={error?.userMessage ?? 'Something went wrong'} onRetry={refetch} />;
```

- [ ] **C-9.1.1** Network errors render an offline-aware UI (not "An error occurred").
- [ ] **C-9.1.2** Server errors offer a retry button.
- [ ] **C-9.1.3** No raw stack trace, status code, or server JSON ever surfaces to the user.

---

### 9.2 Field-level vs form-level errors

- [ ] **C-9.2.1** API field-validation errors map back to the originating field (red border + message), not a single banner.
- [ ] **C-9.2.2** Cross-field errors (e.g., "passwords don't match") render as a form-level banner.

---

### 9.3 ErrorBoundary placement

```jsx
<NavigationContainer>
  <ErrorBoundary>            {/* catches per-screen render errors */}
    <RootNavigator />
  </ErrorBoundary>
</NavigationContainer>
```

Place at least one ErrorBoundary inside the NavigationContainer (so navigation still works after a screen crashes), and individual ones around third-party components known to throw (charts, video).

- [ ] **C-9.3.1** App has an outer ErrorBoundary with a "Reload" CTA.
- [ ] **C-9.3.2** Risky screens (chat, journal pattern view) have local ErrorBoundaries.

---

### 9.4 Toast / snackbar patterns

- [ ] **C-9.4.1** Toasts auto-dismiss after 3–5s and are tappable to dismiss early.
- [ ] **C-9.4.2** Toasts respect `useSafeAreaInsets().bottom` so they don't overlap the home indicator.
- [ ] **C-9.4.3** Toasts have `accessibilityLiveRegion="polite"` (Android) and announce on iOS.

---

## 10. Animations

### 10.1 Use Reanimated, not Animated

Reanimated 4 runs the entire animation pipeline on the UI thread via Worklets. The built-in `Animated` API requires `useNativeDriver: true` and still cannot animate layout properties on the native thread. Reanimated 3 is no longer maintained — use 4.

- [ ] **C-10.1.1** No new code uses `Animated` from `react-native`. Use `react-native-reanimated` v4.

---

### 10.2 Cleanup on unmount

```jsx
const opacity = useSharedValue(0);
useEffect(() => {
  opacity.value = withTiming(1, { duration: 300 });
  return () => { cancelAnimation(opacity); };
}, []);
```

- [ ] **C-10.2.1** Long-running animations call `cancelAnimation` on unmount.

---

### 10.3 Reduced motion

```jsx
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';

withTiming(value, { duration: 300, reduceMotion: ReduceMotion.System });
```

Reanimated 4 has built-in `ReduceMotion.System` support — opt in per animation, or use the global `ReducedMotionConfig`.

For non-Reanimated motion (CSS, custom), check `AccessibilityInfo.isReduceMotionEnabled()`.

- [ ] **C-10.3.1** All animations declare a `reduceMotion` option (or live in a system that respects it globally).
- [ ] **C-10.3.2** Decorative motion (parallax, autoplay) is disabled when reduced-motion is on.

---

### 10.4 Animate transform / opacity, not layout

- [ ] **C-10.4.1** Animations use `transform: translate/scale/rotate` and `opacity` — never `width`, `height`, `top`, `left`, `margin`, `padding`.

---

### 10.5 Reanimated 4 + New Architecture flags (Android)

Per the [Reanimated performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/), enable on Android to avoid known Fabric regressions:

- `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` (4.0+)
- `IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS` (4.2+)
- `preventShadowTreeCommitExhaustion` for scroll-handler flicker

- [ ] **C-10.5.1** Reanimated feature flags are configured in app entry per current Reanimated docs.

---

## 11. Touch & gesture

### 11.1 Pressable, not TouchableOpacity

`TouchableOpacity` is effectively legacy. Use `Pressable` everywhere — it has finer-grained pressed/hovered/focused states, and the API is forward-compatible with web.

```jsx
<Pressable
  onPress={onPress}
  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
  android_ripple={{ color: theme.ripple, borderless: false }}
  accessibilityRole="button"
  accessibilityLabel="Save journal entry"
>
  <Text>Save</Text>
</Pressable>
```

- [ ] **C-11.1.1** No new uses of `TouchableOpacity`, `TouchableHighlight`, `TouchableWithoutFeedback`, `TouchableNativeFeedback`.

---

### 11.2 Haptics on press, not release

```jsx
import * as Haptics from 'expo-haptics';

<Pressable
  onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
  onPress={onPress}
/>
```

- [ ] **C-11.2.1** Haptics fire on `onPressIn` for instant feedback, NOT on `onPress` (which fires on release).
- [ ] **C-11.2.2** Haptics respect a user-controlled "Haptic feedback" setting.

---

### 11.3 Long-press vs press

```jsx
<Pressable
  onPress={onPress}
  onLongPress={onLongPress}
  delayLongPress={500}
/>
```

- [ ] **C-11.3.1** When both are bound, `delayLongPress` is ≥400ms so the short-press is reliably distinguishable.

---

### 11.4 Gesture conflicts

If you nest a horizontal pan inside a vertical scroll inside a horizontally swipeable tab, declare gesture priorities with `react-native-gesture-handler`'s `simultaneousHandlers` / `waitFor`.

- [ ] **C-11.4.1** Nested gestures explicitly declare priority — never assume RN will figure it out.

---

## 12. State management

### 12.1 Stale closures in useEffect

```js
// ❌ count is captured at mount; setInterval logs 0 forever
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000);
  return () => clearInterval(id);
}, []); // empty deps

// ✅ functional updater
useEffect(() => {
  const id = setInterval(() => setCount((c) => c + 1), 1000);
  return () => clearInterval(id);
}, []);
```

- [ ] **C-12.1.1** Interval / event-listener callbacks use functional state updates OR keep refs in sync.
- [ ] **C-12.1.2** ESLint `react-hooks/exhaustive-deps` is enabled with no warning suppressions.

---

### 12.2 AbortController for cancelled fetches

```js
useEffect(() => {
  const ctrl = new AbortController();
  (async () => {
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      const json = await res.json();
      setData(json);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e);
    }
  })();
  return () => ctrl.abort();
}, [url]);
```

- [ ] **C-12.2.1** Every `fetch` inside a `useEffect` is cancellable via AbortController OR an `isMounted` ref.
- [ ] **C-12.2.2** Race conditions are tested: rapidly navigate away and back during a slow request — UI must not crash or show stale data.

---

### 12.3 Memory leaks

- [ ] **C-12.3.1** Every `addEventListener`, `setInterval`, `setTimeout`, `subscribe()`, `Animated.start()`, `Reanimated.withTiming()` has a matching cleanup.
- [ ] **C-12.3.2** WebSocket connections are de-duplicated (open once per session, not per render).
- [ ] **C-12.3.3** Long-lived buffers (chat message arrays) have a max length / sliding window.

---

### 12.4 useCallback / useMemo

- [ ] **C-12.4.1** Callbacks passed to memoized children are wrapped in `useCallback` with correct deps.
- [ ] **C-12.4.2** Heavy computations (filter / sort / map of large arrays) are wrapped in `useMemo`.
- [ ] **C-12.4.3** Don't `useCallback`/`useMemo` everything — only when the consumer actually benefits (memoized child, expensive computation).

---

## 13. Theme & dark mode

### 13.1 System color scheme

```js
import { useColorScheme } from 'react-native';
const scheme = useColorScheme(); // 'light' | 'dark' | null
```

- [ ] **C-13.1.1** App reads `useColorScheme()` and updates live (not just at startup).
- [ ] **C-13.1.2** User can override system theme in Settings (light / dark / system).

---

### 13.2 StatusBar barStyle

- [ ] **C-13.2.1** `<StatusBar style={isDark ? 'light' : 'dark'} />` updates on theme change.

---

### 13.3 Theme transition

- [ ] **C-13.3.1** Switching theme does not crash (test by toggling 5×).
- [ ] **C-13.3.2** Color transitions are either instant or animated — no half-themed flash.

---

### 13.4 Image assets

- [ ] **C-13.4.1** Logos / illustrations have light + dark variants (or use a tinted SVG).
- [ ] **C-13.4.2** Screenshot diffs of every screen exist in both themes.

---

## 14. Accessibility

### 14.1 accessibilityLabel on icons

Icon-only buttons MUST have a label that describes the *action*, not the icon shape.

```jsx
// ❌ "gear icon" tells the user nothing
// ✅
<Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={openSettings}>
  <SettingsIcon />
</Pressable>
```

- [ ] **C-14.1.1** Every icon-only button has an `accessibilityLabel` describing the action.
- [ ] **C-14.1.2** Decorative icons set `accessibilityElementsHidden` (iOS) and `importantForAccessibility="no"` (Android).

---

### 14.2 accessibilityRole and state

- [ ] **C-14.2.1** Every interactive element sets `accessibilityRole`.
- [ ] **C-14.2.2** Toggleable elements set `accessibilityState={{ checked, selected, disabled, busy }}`.

---

### 14.3 Color contrast

WCAG: 4.5:1 for normal text, 3:1 for large (≥18pt or ≥14pt bold), 3:1 for UI components & graphical objects.

- [ ] **C-14.3.1** All text/background pairs in the design system are run through a contrast checker; failures are documented or fixed.
- [ ] **C-14.3.2** Disabled states keep ≥3:1 contrast (don't go below — they still need to be perceivable).

---

### 14.4 Focus order & screen reader announcements

- [ ] **C-14.4.1** VoiceOver / TalkBack reads the screen in logical order (test on every screen).
- [ ] **C-14.4.2** Modals: focus is moved into the modal on open and restored on close.
- [ ] **C-14.4.3** Dynamic content uses `accessibilityLiveRegion="polite"` (Android) or `AccessibilityInfo.announceForAccessibility(msg)` (iOS).

---

### 14.5 Font scaling

iOS and Android system text-size sliders go up to ~200%. The default RN behavior scales accordingly — but layouts often break.

```jsx
<Text maxFontSizeMultiplier={1.5}>{label}</Text>
```

- [ ] **C-14.5.1** Body text honors `allowFontScaling` (default `true`) and clamps with `maxFontSizeMultiplier` only where layout would break.
- [ ] **C-14.5.2** Never set `allowFontScaling={false}` — that breaks accessibility.
- [ ] **C-14.5.3** Test every screen at 200% font size.

---

### 14.6 Reduced motion

See §10.3.

---

## 15. Performance

### 15.1 Re-render storms

- [ ] **C-15.1.1** Any list item rendered >20 times is wrapped in `React.memo`.
- [ ] **C-15.1.2** `key` props are stable IDs (never array index for dynamic lists).
- [ ] **C-15.1.3** Context value objects are memoized (`useMemo`) so they don't re-create on every parent render.

---

### 15.2 Long lists

See §4.2. FlashList + `estimatedItemSize` + `keyExtractor` + `removeClippedSubviews` (Android).

- [ ] **C-15.2.1** Long lists set `removeClippedSubviews={true}` on Android.

---

### 15.3 Image lazy loading

- [ ] **C-15.3.1** Use `expo-image` (built-in disk cache, blurhash placeholder) for remote images.
- [ ] **C-15.3.2** Avatars and feed images set explicit `width`/`height` to prevent layout shift.

---

### 15.4 Bundle size

- [ ] **C-15.4.1** Run `npx expo export --dump-sourcemap` + `source-map-explorer` quarterly; flag any single dependency >300KB gzipped.
- [ ] **C-15.4.2** Tree-shake `lodash` → use `lodash-es` or per-method imports.
- [ ] **C-15.4.3** Lazy-load heavy screens with `React.lazy` + `Suspense`.

---

### 15.5 InteractionManager

```js
InteractionManager.runAfterInteractions(() => {
  // expensive work after the screen-mount animation completes
});
```

- [ ] **C-15.5.1** Heavy work on screen mount (analytics, prefetch) runs after `runAfterInteractions`.

---

## 16. Platform differences

### 16.1 Shadows / elevation

```js
const shadow = Platform.select({
  ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  android: { elevation: 4 },
});
```

- [ ] **C-16.1.1** Cards/elevated components specify both iOS shadow props AND Android `elevation`.

---

### 16.2 Default ripple (Android)

- [ ] **C-16.2.1** `Pressable` on Android sets `android_ripple={{ color, borderless }}` for native feel.

---

### 16.3 Date/time pickers

- [ ] **C-16.3.1** Use `@react-native-community/datetimepicker` with platform-appropriate `display` (`spinner` on iOS, `default` on Android).
- [ ] **C-16.3.2** Do not roll your own picker if a native one suffices — accessibility bugs are massive.

---

## 17. Internationalization

### 17.1 String overflow with longer translations

German strings are typically 30% longer; Russian/French ~20%.

- [ ] **C-17.1.1** Run a "pseudo-localization" build (every string padded with `[--text--]`) on every screen.
- [ ] **C-17.1.2** Buttons and tabs handle longer strings without clipping (use `numberOfLines` + `ellipsizeMode="tail"` or wrapping).

---

### 17.2 RTL

```js
import { I18nManager } from 'react-native';
I18nManager.allowRTL(true);
```

- [ ] **C-17.2.1** Use logical properties (`marginStart`, `paddingEnd`) — not physical (`marginLeft`, `paddingRight`).
- [ ] **C-17.2.2** Direction-implied icons flip in RTL.
- [ ] **C-17.2.3** Test at least one RTL language (Arabic) end-to-end.

---

### 17.3 Date / number / pluralization

- [ ] **C-17.3.1** Dates formatted via `date-fns` with a locale, not hand-formatted.
- [ ] **C-17.3.2** Numbers formatted via `Intl.NumberFormat` with the user locale.
- [ ] **C-17.3.3** Pluralization via `Intl.PluralRules` or i18n library — never `count === 1 ? 'item' : 'items'` (breaks for languages with multiple plural forms).

---

## 18. Image & media

### 18.1 Aspect ratio

```jsx
<Image style={{ width: '100%', aspectRatio: 16 / 9 }} source={{ uri }} />
```

- [ ] **C-18.1.1** Remote images set `aspectRatio` to prevent layout shift.

---

### 18.2 Error fallback

```jsx
<Image source={{ uri }} onError={() => setBroken(true)} />
{broken ? <PlaceholderAvatar /> : null}
```

- [ ] **C-18.2.1** Avatars and feed images degrade gracefully when the URL 404s.

---

### 18.3 Permissions

- [ ] **C-18.3.1** Camera / photo library permissions are requested in-context (when the user taps the upload button), NOT at app launch.
- [ ] **C-18.3.2** Permission denial path leads to "Open Settings" CTA via `Linking.openSettings()`.

---

## 19. Network & offline

### 19.1 Offline detection

```jsx
import NetInfo from '@react-native-community/netinfo';

const [isOnline, setIsOnline] = useState(true);
useEffect(() => {
  const sub = NetInfo.addEventListener((s) => setIsOnline(!!s.isConnected && !!s.isInternetReachable));
  return () => sub();
}, []);
```

Note: `isConnected` alone has false positives. Always combine with `isInternetReachable`.

- [ ] **C-19.1.1** Offline state is detected via `isConnected && isInternetReachable`.
- [ ] **C-19.1.2** A persistent banner appears while offline.

---

### 19.2 Retry with exponential backoff + jitter

```js
async function withRetry(fn, { max = 4, base = 1000, cap = 30000 } = {}) {
  for (let i = 0; ; i++) {
    try { return await fn(); }
    catch (e) {
      if (i >= max || e.status < 500) throw e;       // don't retry 4xx
      const delay = Math.min(cap, base * 2 ** i) * (0.5 + Math.random() * 0.5);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
```

- [ ] **C-19.2.1** Read endpoints retry with exponential backoff + jitter, capped at 30s.
- [ ] **C-19.2.2** 4xx responses are NOT retried.
- [ ] **C-19.2.3** Mutations are retried only when they have an `Idempotency-Key` header.

---

### 19.3 Optimistic mutations + rollback

See §8.4.

---

### 19.4 Cache-then-network

- [ ] **C-19.4.1** Lists render cached data immediately, then refresh in the background (no full-screen spinner on warm visits).

---

## 20. Push notifications

### 20.1 Permission UX

- [ ] **C-20.1.1** Don't request push permission on first launch. Wait until a screen contextually motivates it (e.g., "Get a daily check-in?").
- [ ] **C-20.1.2** Pre-prompt with a custom UI before the system prompt — a "no" on the system prompt is permanent on iOS without going to Settings.

---

### 20.2 Deep link from notification

- [ ] **C-20.2.1** Tapping a notification routes to the relevant screen, not just the app's root.
- [ ] **C-20.2.2** Cold-start notification deep link works.

---

### 20.3 Badge count

- [ ] **C-20.3.1** Badge counts decrement when the user reads the relevant content.
- [ ] **C-20.3.2** Badge clears on logout.

---

### 20.4 In-app vs OS

- [ ] **C-20.4.1** Notifications received while the app is foregrounded show as in-app banners (or are silently consumed), NOT OS notifications.

---

## 21. Verification matrix

| Bug class | Manual check | Automated unit/integration | E2E (Playwright/Detox) | Visual regression | Lint/static |
|---|---|---|---|---|---|
| 1. Keyboard | Real device tap-outside, focus-next | Jest: `keyboardShouldPersistTaps` prop on every scroller | Detox: type → tap outside → assert dismissed | — | ESLint custom rule: forbid `TouchableWithoutFeedback` |
| 2. Layout | Pseudo-loc + 60-char names | Jest snapshot of components with long content | — | Chromatic / Loki on all screens | ESLint: forbid `marginLeft`/`marginRight` (use `Start`/`End`) |
| 3. Safe areas | iPhone SE + iPhone 15 Pro + Pixel 7 | Jest mock `useSafeAreaInsets` to return non-zero | Detox: rotate device, assert no clip | Screenshot diff per device class | ESLint: forbid `import { SafeAreaView } from 'react-native'` |
| 4. Scrolling | Manual scroll on lowest-end Android | Jest: `estimatedItemSize` set, `keyExtractor` returns string | Detox: scroll to bottom, assert `onEndReached` called once | — | Custom rule: warn on nested vertical ScrollView |
| 5. Navigation | Hardware back, gesture back, deep link | Jest: navigation reducer | Detox: logout → back → assert at Login | — | — |
| 6. Modals | Backdrop tap, hardware back | Jest: backdrop `onPress` wired | Detox: open → dismiss via 3 paths | Screenshot of every modal | ESLint: forbid `react-native` `Modal` import |
| 7. Forms | Double-tap submit, blur validation | RHF `mode: 'onBlur'` asserted | Detox: rapid double-tap → assert one request | — | — |
| 8. Loading | Slow network sim | Jest: 4 states render distinctly | Detox: throttle network, assert skeleton → list | Snapshot all 4 states | — |
| 9. Errors | Disable wifi mid-action | Jest: error boundary catches, fallback renders | Detox: 500 from mock server, assert retry CTA | — | — |
| 10. Animations | Reduced motion ON | Jest: `reduceMotion` option present | — | — | ESLint: forbid `from 'react-native'` `Animated` import in new code |
| 11. Touch | Small icon tap repeat 10× | jest-axe: minimum target | Detox: hitSlop respected | — | ESLint: forbid `TouchableOpacity` |
| 12. State | Rapid nav + slow request | Jest: AbortController called on unmount | Detox: navigate during fetch, assert no crash | — | `react-hooks/exhaustive-deps` ERROR (not warn) |
| 13. Theme | Toggle 5× | Jest: theme provider rerenders | Detox: switch theme, assert StatusBar style | Both-theme screenshots | — |
| 14. Accessibility | VoiceOver + TalkBack pass | jest-axe / @testing-library/jest-native a11y matchers | Detox: all interactives reachable | — | eslint-plugin-react-native-a11y |
| 15. Performance | Profile JS thread on Pixel 4a | Jest: memoization sentinels | — | — | Bundle size CI check |
| 16. Platform | Side-by-side iOS/Android build | Platform.select asserted | — | Per-platform screenshots | — |
| 17. i18n | Pseudo-loc + Arabic build | Jest snapshot with German strings | Detox: switch locale, assert no clipping | RTL screenshot per screen | ESLint: forbid string concatenation in JSX |
| 18. Images | Bad URL, denied permission | Jest: `onError` fallback | Detox: deny camera, assert Settings CTA | — | — |
| 19. Network | Airplane mode toggle | Jest: NetInfo subscribes/unsubscribes | Detox: offline → action → online → action processed | — | — |
| 20. Push | Cold-start from notification | Jest: notification handler | Detox: simulate cold-start deep link | — | — |

---

## 22. Top-10 bugs most likely to bite this redesign

Ranked by combined likelihood × impact, given Sakina's current code (chat-heavy, journal forms, mood/breathing animations, push notifications):

1. **Tap-outside keyboard dismiss (§1.1)** — already a known bug. Without `keyboardShouldPersistTaps="handled"` on every scroller, every chat / journal / login screen will reproduce the double-tap bug.
2. **Keyboard covers focused input (§1.2)** — chat composer + journal entry + 2FA screen all need verified `KeyboardAwareScrollView`. The built-in `KeyboardAvoidingView` is the wrong tool for cross-platform parity.
3. **Long username / translated text overflow (§2.1)** — the redesign's profile + community headers are first to break. `flexShrink: 1` + `numberOfLines` is the cheapest insurance.
4. **Bottom CTA / tab-bar overlap (§3.3)** — the new floating "Talk to Sakina" CTA must clear the home indicator AND the tab bar; this gets miscalculated on every redesign.
5. **Android edge-to-edge (§3.5)** — RN 0.81 + Android 15 mandate it; without explicit bottom insets, content draws under the gesture pill.
6. **Stack reset on logout (§5.3)** — Sakina holds chat history and journal entries; back-swipe after logout must NOT show the previous session.
7. **Double-submit on slow networks (§7.4)** — sign-up, post-to-community, send-message. Idempotency key + disabled-state spinner is non-negotiable.
8. **Race conditions in chat send + history fetch (§12.2)** — fast nav between chat sessions reliably drops the wrong response into the wrong session if AbortController is missing.
9. **Reduced-motion respect on breathing animations (§10.3)** — the breathing exercise uses Reanimated; without `ReduceMotion.System`, motion-sensitive users get nausea-inducing pulses.
10. **Push permission asked on first launch (§20.1)** — App Store reviewers reject this; users deny permanently on iOS. Defer to context.

---

## 23. Recommended automated guards

These should be added during the redesign so the catalog enforces itself:

1. **ESLint custom rules / plugin presets**
   - `eslint-plugin-react-native` — flag inline styles, raw text outside `<Text>`, etc.
   - `eslint-plugin-react-native-a11y` — enforces `accessibilityLabel` / `accessibilityRole`.
   - `react-hooks/exhaustive-deps` set to **error**, no suppressions allowed.
   - Custom no-restricted-imports rules:
     - Forbid `SafeAreaView` from `react-native`.
     - Forbid `Modal` from `react-native`.
     - Forbid `TouchableOpacity` / `TouchableHighlight` / `TouchableWithoutFeedback` / `TouchableNativeFeedback`.
     - Forbid `Animated` from `react-native` (use Reanimated).
   - Custom no-restricted-syntax rules:
     - Warn on `marginLeft` / `marginRight` / `paddingLeft` / `paddingRight` literal style keys (prefer `Start` / `End`).
     - Warn on `KeyboardAvoidingView` from `react-native` (use the keyboard-controller variant).

2. **TypeScript / type guards** (when we adopt TS in the redesign)
   - A `Theme` type with branded color tokens — no raw hex codes in component code.
   - A `Spacing` type — no raw pixel values for padding/margin.

3. **Jest / unit checks**
   - A repo-wide test that scans every screen file and asserts: contains a scroller → that scroller has `keyboardShouldPersistTaps="handled"`.
   - A "design-system contract" test for `<Button />`, `<IconButton />`, `<Card />` — assert touch target ≥44, accessibilityRole present, supports `disabled` + `loading`.
   - A11y matchers from `@testing-library/jest-native`: `toBeAccessible()`, `toHaveAccessibilityState()`.

4. **CI checks**
   - Bundle-size budget (e.g., warn if `index.bundle` grows >5% PR-over-PR).
   - Visual regression via Chromatic or Loki on every screen, both themes, three device classes (iPhone SE, iPhone 15 Pro, Pixel 7).
   - Accessibility scanner (`@axe-core/react`-equivalent for RN screens via Storybook snapshot).

5. **E2E (Detox)**
   - Smoke flow: launch → login → send chat → log mood → write journal → logout. Run on iOS + Android, dark + light, English + Arabic.
   - Keyboard regression: every screen with an input has a "tap outside dismisses keyboard" test.
   - Offline regression: NetInfo mocked offline → assert offline banner; flip online → assert queued action processed.

6. **Manual QA scripts**
   - Every PR that touches a screen must attach: iPhone SE screenshot, iPhone 15 Pro screenshot, Pixel 7 screenshot — light AND dark.
   - Pseudo-localization build run before each milestone.
   - VoiceOver + TalkBack walkthrough recorded per release.

7. **Repo hooks**
   - Pre-commit: ESLint + Prettier + tsc on changed files.
   - Pre-push: jest changed-files; reject if a11y or contract tests fail.

---

## Sources

- [Expo — Keyboard handling](https://docs.expo.dev/guides/keyboard-handling/)
- [react-native-keyboard-controller — KeyboardAvoidingView](https://kirillzyusko.github.io/react-native-keyboard-controller/docs/api/components/keyboard-avoiding-view)
- [React Native — KeyboardAvoidingView](https://reactnative.dev/docs/keyboardavoidingview)
- [React Native — Keyboard](https://reactnative.dev/docs/keyboard)
- [React Native — Accessibility](https://reactnative.dev/docs/accessibility)
- [React Native — BackHandler](https://reactnative.dev/docs/backhandler)
- [React Native — SafeAreaView (deprecated notice)](https://reactnative.dev/docs/safeareaview)
- [Expo — react-native-safe-area-context](https://docs.expo.dev/versions/latest/sdk/safe-area-context/)
- [Expo — Safe areas](https://docs.expo.dev/develop/user-interface/safe-areas/)
- [React Navigation — Custom Android back button handling](https://reactnavigation.org/docs/custom-android-back-button-handling/)
- [React Navigation — Hiding tab bar in specific screens](https://reactnavigation.org/docs/hiding-tabbar-in-screens/)
- [React Navigation — Supporting safe areas](https://reactnavigation.org/docs/handling-safe-area/)
- [Reanimated — Performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- [FlashList docs](https://shopify.github.io/flash-list/)
- [Whitespectre — FlashList vs FlatList performance case study](https://www.whitespectre.com/ideas/better-lists-with-react-native-flashlist/)
- [Expo blog — What is the best React Native list component?](https://expo.dev/blog/what-is-the-best-react-native-list-component)
- [Wisdom Geek — Avoiding race conditions and memory leaks in useEffect](https://www.wisdomgeek.com/development/web-development/react/avoiding-race-conditions-memory-leaks-react-useeffect/)
- [OneUptime — Handle API Errors and Retry Logic in React Native (2026)](https://oneuptime.com/blog/post/2026-01-15-react-native-api-errors-retry/view)
- [OneUptime — Offline-First Architecture in React Native (2026)](https://oneuptime.com/blog/post/2026-01-15-react-native-offline-architecture/view)
- [Medium — Adhithi Ravichandran: Keyboard issues in ScrollView](https://medium.com/react-native-training/todays-react-native-tip-keyboard-issues-in-scrollview-8cfbeb92995b)
- [DEV — Fixing Keyboard Avoiding in React Native](https://dev.to/iway1/fixing-keyboard-avoiding-in-react-native-1k5i)
- [TanStack Form — Validation guide](https://tanstack.com/form/latest/docs/framework/react/guides/validation)
- [Accessibility Checker — React Native Accessibility Best Practices (2026)](https://www.accessibilitychecker.org/blog/react-native-accessibility/)
