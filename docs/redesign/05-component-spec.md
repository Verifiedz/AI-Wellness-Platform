# Sakina AI — Component Specification

Companion to `00-master-plan.md`. Defines every primitive, its API, and its quality gates.

---

## Theme Tokens (Wave A)

### Color tokens (semantic — never use raw hex outside theme files)
```ts
type ColorTokens = {
  bg: { base: string; surface: string; surfaceHigh: string; elevated: string };
  text: { primary: string; secondary: string; tertiary: string; onPrimary: string };
  primary: string; primaryHover: string;
  accent: string; accentGlow: string;
  secondary: string;
  success: string; warning: string; error: string;
  border: { subtle: string; strong: string };
  // overlays
  scrim: string;          // for modals
  glassTint: string;      // expo-blur tint
};
```

### Spacing scale
```ts
spacing: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80 }
```

### Radius scale
```ts
radius: { none: 0, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32, full: 9999 }
```

### Elevation (tonal, not shadow)
```ts
elevation: {
  flat: { surface: 'bg.base', border: 'border.subtle' },
  raised: { surface: 'bg.surface', border: 'border.subtle' },
  high: { surface: 'bg.surfaceHigh', border: 'border.strong' },
  glass: { backdrop: 'expo-blur', tint: 'glassTint', border: 'border.subtle' },
}
```

### Typography scale (Modern Mindful — DM Serif Display + DM Sans)
```ts
type: {
  'display-xl': { family: 'DMSerifDisplay', size: 56, lineHeight: 60, tracking: -0.01 },
  'display-lg': { family: 'DMSerifDisplay', size: 40, lineHeight: 46, tracking: -0.005 },
  'h1':         { family: 'DMSans', weight: 700, size: 28, lineHeight: 34, tracking: -0.005 },
  'h2':         { family: 'DMSans', weight: 600, size: 22, lineHeight: 28, tracking: 0 },
  'h3':         { family: 'DMSans', weight: 600, size: 18, lineHeight: 24, tracking: 0 },
  'body-lg':    { family: 'DMSans', weight: 400, size: 17, lineHeight: 26, tracking: 0 },
  'body':       { family: 'DMSans', weight: 400, size: 15, lineHeight: 22, tracking: 0 },
  'body-sm':    { family: 'DMSans', weight: 400, size: 13, lineHeight: 18, tracking: 0.005 },
  'caption':    { family: 'DMSans', weight: 500, size: 12, lineHeight: 16, tracking: 0.01 },
  'label':      { family: 'DMSans', weight: 600, size: 11, lineHeight: 14, tracking: 0.04 },
  'mono':       { family: 'JetBrainsMono', weight: 400, size: 13, lineHeight: 20, tracking: 0 },
}
```

### Motion tokens
```ts
duration: {
  micro: 150, fast: 200, normal: 280, slow: 400, screen: 480, hero: 700,
  ambient: 6000, breath: 4000,
}
easing: {
  default: 'cubic-bezier(0.22, 1, 0.36, 1)',     // ease-out cubic
  spring:  { stiffness: 180, damping: 22, mass: 1 },
  springSnap: { stiffness: 300, damping: 20 },
  breath:  'cubic-bezier(0.4, 0, 0.4, 1)',
}
```

### Haptic tokens (via `useHaptic()` wrapper)
```ts
haptic: {
  tap:     'selection',         // Haptics.selectionAsync()
  soft:    'impactLight',
  firm:    'impactMedium',
  strong:  'impactHeavy',
  success: 'notificationSuccess',
  warn:    'notificationWarning',
  error:   'notificationError',
}
```

---

## Primitive Specs (Wave B)

Each primitive must pass: a11y label/role props, both themes, reduce-motion respect, web fallback, snapshot test, Playwright screenshot.

### `<AuroraBackground>`
Skia-rendered animated mesh gradient. Default ambient layer of every "primary" screen.
```ts
type Props = {
  intensity?: 'subtle' | 'normal' | 'vivid';  // default 'normal'
  breathSync?: boolean;                        // default true
  paused?: boolean;                            // for reduce-motion
  seed?: number;                               // for per-session unique gradient
};
```
- Web: `<WithSkiaWeb fallback={<View bg='bg.base' />} />`
- Reduce-motion: paused gradient (still color, no drift)
- Performance: single Canvas, two animated radials, blur layer

### `<GlassPanel>`
Wraps `expo-blur` with Android graceful degrade.
```ts
type Props = {
  intensity?: number;        // default 80 iOS / 60 Android / CSS Web
  tint?: 'light' | 'dark';   // default theme.glassTint
  border?: boolean;          // default true (1px subtle)
  radius?: keyof Radius;     // default 'xl'
  children: ReactNode;
};
```
- Always sets `overflow: 'hidden'`
- Android: detects low-end devices via `react-native-device-info` and falls back to translucent solid

### `<Surface>`
Non-interactive container with tonal elevation.
```ts
type Props = {
  elevation?: 'flat' | 'raised' | 'high' | 'glass';
  padding?: keyof Spacing;
  radius?: keyof Radius;
  border?: boolean;
  children: ReactNode;
};
```

### `<Text>`
```ts
type Props = {
  variant: keyof TypeScale;
  color?: keyof TextColors;
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  children: ReactNode;
} & TextProps;
```
- Default `numberOfLines` undefined (let it wrap), but provide ellipsis-friendly variants `<TextOneLine>` and `<TextTwoLines>`
- Honors `allowFontScaling` with `maxFontSizeMultiplier={1.4}` to prevent layout breakage at huge type sizes

### `<Button>`
```ts
type Props = {
  variant: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;     // shows Blob mini, disables press
  disabled?: boolean;
  onPress: () => void;
  leadingIcon?: PhosphorIcon;
  trailingIcon?: PhosphorIcon;
  haptic?: keyof HapticTokens;  // default 'firm'
  accessibilityLabel?: string;  // required if no text label
  children: ReactNode;
};
```
- Press physics: `withSpring({ scale: 0.98, stiffness: 300, damping: 20 })`
- Haptic fires on press peak, not release
- Loading state: caption stays visible; blob spins to its right; pointerEvents disabled
- Min height 48px regardless of size

### `<IconButton>`
- Same as Button but icon-only
- Always 48×48 hit area; visible icon can be smaller (24px default)
- `accessibilityLabel` REQUIRED (TS enforced via union type)

### `<Input>`
```ts
type Props = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
  multiline?: boolean;
  rightAccessory?: ReactNode;       // for clear / show-password / mic button
  inputRef?: Ref<TextInput>;
} & RHFControllerCompatible;
```
- Floating label animates up on focus/has-value
- Error: shows below input WITHOUT shifting layout (reserves height)
- Tapping anywhere on the input dismisses it via parent `<Pressable>` from the form
- Keyboard appearance synced to theme
- `autoCorrect`, `autoCapitalize` defaults sane per `keyboardType`

### `<Card>`
```ts
type Props = {
  variant?: 'glass' | 'tonal';      // default 'tonal'
  size?: 'sm' | 'md' | 'lg';
  pressable?: boolean;              // adds press physics + haptic
  onPress?: () => void;
  onLongPress?: () => void;         // triggers backdrop blur preview
  children: ReactNode;
} & A11yProps;
```

### `<Sheet>` (Gorhom wrapper)
```ts
type Props = {
  ref: Ref<BottomSheetModal>;
  snapPoints: (string|number)[];
  enableDynamicSizing?: boolean;
  children: ReactNode;
};
```
- Backdrop: 50% scrim + blur
- Background: `<GlassPanel>` from our theme
- Handle: pulses 3px → 48px once on first mount, then settles back

### `<TabBar>` (custom — replaces React Navigation default)
```ts
type Props = BottomTabBarProps;
```
- Floating: 16pt bottom margin, 16pt horizontal margin, glass background
- Active indicator: aurora pill behind active icon
- Shrinks to icon-only on scroll-down, expands on scroll-up
- Per-screen show/hide via screen options
- Reduce-motion: no shrink, just opacity 0/1

### `<Toast>`
- Slides from top with spring
- Auto-dismiss 4s; sticky variant for errors
- Color from palette (never #FF0000)
- Icon left, text body, optional CTA right

### `<Avatar>`
```ts
type Props = {
  uri?: string;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  ring?: boolean;          // active glow ring (e.g., AI avatar mid-stream)
};
```
- expo-image with blurhash placeholder
- Fallback: initials on accent gradient

### `<ProgressRing>`
SVG arc, 1.5pt stroke. Animated via Reanimated.
```ts
type Props = {
  progress: number;        // 0-1
  size?: number;           // default 40
  duration?: number;       // animation duration ms
  color?: string;          // default theme.accent
  trackColor?: string;     // default theme.border.subtle
};
```

### `<BreathingPulse>`
Reusable looping pulse. Used as wrapper or standalone.
```ts
type Props = {
  pace?: 'slow' | 'normal' | 'fast';   // 6s / 4s / 2s
  paused?: boolean;
  children?: ReactNode;                 // wraps target with scale pulse
};
```

### `<Blob>`
Skia path-morph between two SVG blob shapes.
```ts
type Props = {
  size?: number;            // default 48
  color?: string;           // default theme.accent
  paused?: boolean;         // for reduce-motion
  speed?: 'slow' | 'normal' | 'fast';
};
```
- Use as the universal "thinking / loading" indicator

### `<ParticleBloom>`
Imperative API — fires from a position, decays.
```ts
const ref = useRef<ParticleBloomRef>(null);
ref.current?.bloom({ x, y, count: 18 });
```
- Skia-rendered; ~18-24 soft circles outward; 700ms decay
- Auto-fires `Haptics.notificationAsync(Success)` if not suppressed

### `<Divider>`
Hairline tonal — 1px / `border.subtle`. Horizontal default; `vertical` prop for inline.

### `<Chip>`
Selection chip; haptic on toggle.
```ts
type Props = {
  selected: boolean;
  onPress: () => void;
  leadingIcon?: PhosphorIcon;
  children: ReactNode;
};
```

### `<Slider>`
Custom themed; never system default.
- 1.5pt track + 24pt thumb with subtle glow when active
- Haptic ticks at 25/50/75/100% (`light`)

### `<Switch>`
Custom themed; never system default.
- Spring animation on toggle
- Haptic `tap` on toggle

### `<EmptyState>`
```ts
type Props = {
  illustration?: ReactNode;     // optional Skia illustration or Phosphor icon at large size
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void };
};
```

### `<ErrorState>`
Same shape as EmptyState; calm coral palette; `Retry` action provided.

### `<LoadingState>`
- Centered Blob + caption
- Used inside lists, screens, sheets

---

## Screen Templates (Wave D)

### `<ScreenScaffold>`
Every screen wraps with this:
```ts
type Props = {
  ambient?: boolean;            // include AuroraBackground
  scrollable?: boolean;
  keyboardAware?: boolean;      // KeyboardAwareScrollView
  paddingHorizontal?: keyof Spacing;
  paddingTop?: 'safe' | number;
  paddingBottom?: 'safe' | 'tabBar' | number;
  refreshControl?: { onRefresh: () => Promise<void> };
  children: ReactNode;
};
```
- Wires SafeArea + Keyboard + optional aurora ambient
- Default `keyboardShouldPersistTaps='handled'` on scrollers
- Tap-outside dismisses keyboard

### `<ScreenHeader>`
- Back button (Phosphor caret, 48×48 hit, accessibilityLabel='Back')
- Title (h2 or h3 depending on context)
- Right slot for crisis button + actions
- Optional subtitle row

---

## Test Matrix (Wave A enforces baseline)

For each primitive:
- **Snapshot test** in both themes (Jest)
- **A11y test** via `jest-axe` (web build)
- **Playwright screenshot** in both themes
- **Manual checklist** from `03-ux-bug-prevention.md` §relevant section

For each screen:
- Render in light + dark
- Empty / loading / error states screenshotted
- Form screens: keyboard interaction tested
- Animated screens: `AccessibilityInfo.isReduceMotionEnabled = true` mock test

---

## Naming Conventions

- File: `frontend/src/ui/<Name>/<Name>.tsx` + `<Name>.test.tsx` + `index.ts` re-export
- Variants: enum-typed prop, never boolean flags ("variant=primary" not "primary={true}")
- Sizes: `'sm' | 'md' | 'lg'` always
- All exported types in `frontend/src/ui/<Name>/<Name>.types.ts`
- Stories (for design system playground) in `<Name>.stories.tsx`
