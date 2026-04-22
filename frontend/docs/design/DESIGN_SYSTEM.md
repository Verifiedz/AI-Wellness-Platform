# Sakina design system

Canonical tokens live in code:

- `src/theme/colors.js` — palette, `ink`, `amber`, `primarySoft` / `primarySoftest`, mesh stops, no pure `#FFF` / `#000`.
- `src/theme/typography.js` — DM Sans + Fraunces display; scale with ≥1.25 step ratio where applicable.
- `src/theme/tokens.js` — `Spacing`, `Radius`, `Elevation`, `Springs`, `Durations`.

## Rules

1. Use `Spacing.*` instead of raw `14` / `20` padding.
2. Spatial motion: `withSpring(..., Springs.default)` — not `withTiming` on transforms.
3. No `borderLeftWidth >= 3` accent stripes on cards.
4. No `${colors.primary}12` tint strings — use `primarySoft` / `primarySoftest`.
5. Cards: prefer `Card` `variant="flat"` with `tinted` or `raised`; hero moments use `lantern` glow sparingly.
6. Respect `prefers-reduced-motion` via Reanimated `useReducedMotion()` where animations run.

## Components

- Primitives: `Button`, `Input`, `Card`, `BottomSheet`, `AnimatedCard`.
- Brand: `SakinaLantern` (`src/components/brand/SakinaLantern.js`).
- Skia: `MeshGradient`, `LanternFlame`, `BreathingLantern`, `GlowRing`, `FlickerLoader`, mood `ValenceEnergyGrid`.

## Feature flags

See `src/config/featureFlags.js` and `getFlag(name)` for staged rollout.
