# Lantern metaphor

Sakina is a **sanctuary lantern**: warmth, attention, and a steady small light — not alarm, not gamification.

## States

| State   | Meaning                         | Where                           |
| ------- | ------------------------------- | ------------------------------- |
| Dim     | App idle / reduced motion       | Splash, reduced motion          |
| Lit     | Normal use                      | Headers, home hero              |
| Bright  | Active care (breathing, chat)   | `BreathingLantern`, chat typing |

## Rules

- The crisis entry point never flickers. Crisis stays steady and recognizable — see `CrisisButton` and `CrisisSheet`.
- Loading: `FlickerLoader` suggests a guttering flame; keep amplitude low.
- Insights read as **invitations by lantern-light** — warm copy, no side-accent borders.
- Keys (when enabled) are **small lit lanterns** on the sanctuary shelf (`SanctuaryShelf`), never streaks.
- The shelf only grows — never shrinks. No "streak broken" state may ever reach the user.

## Implementation map

- Logo / glyph: `SakinaLantern` (plus `Logo` as a thin alias).
- Home hero: `HomeScreenV2` — `MeshGradient` bg, `SakinaLantern` hero, Fraunces italic greeting.
- Breathing: `BreathingLantern` + phase-driven `MeshGradient`, imperative `start({inhale,hold1,exhale,hold2})` ref API.
- Assessments: `LanternRow` replaces linear progress bar; `GlowRing` replaces flat severity gauge.
- Mood calendar: `MoodFlameGlyph` per day; `MoodSparkline` per-month row in yearly view.
- Grounding Hold: 3-second long-press → amplified lantern in `GroundingHold` modal.

## Shipped slices (app-store-readiness branch)

| Slice  | Plan section | Summary                                                                                               |
| ------ | ------------ | ----------------------------------------------------------------------------------------------------- |
| 1      | §0 + §1      | Feature flags, token expansion, Fraunces load, CI antipattern gate, tint-by-opacity migration         |
| 2      | §2 + §3      | Spring AnimatedCard, expanded useHaptic, BottomSheet, Card variants, Input/Button retune, SakinaLantern + Skia fallback primitives |
| 3      | §4.1 + §4.5  | HomeScreenV2 behind `USE_LANTERN_HOME_V2`, ValenceEnergyGrid                                          |
| 4      | §4.3 + §4.4 + §6.4 | BreathingScreenV2 behind `USE_SKIA_BREATHING`, editorial AIChat (flame typing dots, long-press sheet), CrisisPinned + CrisisSheet |
| 5      | §4.2         | Empathy onboarding behind `USE_EMPATHY_ONBOARDING_V2` (Recognition / InitialCheckIn / PrivacyPromise / AccountCreation), TimeOfDay grid killed |
| 6      | §5.1 + §4.9  | TabBarIcon flame pip, MainTabs shadowTop removed, Auth screens lantern hero + Fraunces tagline         |
| 7      | §6.1 + §6.3  | Keys economy behind `USE_KEYS_ECONOMY` (SanctuaryShelf, migration sheet), GroundingHold behind `USE_GROUNDING_HOLD` |
| 8      | §6.5 + §5.2  | Copy audit (ban streak/missed/broken/lost/failed), Settings Accessibility section, notification reframe |
| 9      | §4.6         | JournalScreen editorial rewrite + ValenceEnergyGrid swap, steadying-flame auto-save                    |
| 10     | §4.8         | AssessmentScreen lantern-row progress + serif single-question layout (GlowRing already shipped)        |
| 11     | §4.7 + §3.8  | MoodCalendar flame glyphs + yearly sparkline rows + weekly excerpts, warm Skeleton shimmer             |
| 12     | §5.2 + §7.1  | ExportScreen Switch→cards + folded-paper preview, CrisisButton header lantern, Illustration primitive + MANIFEST.md |
| 13     | §3.8 + §4.4 + §7.2 + §8.4 | Non-home Skeletons redesigned, AIChat empty state w/ Illustration, EmptyState slot prop, ROLLOUT.md, LANTERN_VISUAL_GUIDE.md |
| 14     | §5.2 + §2.5  | Help/Profile polish, sharedTransitions helper                                                          |
| 15     | §5.2 + §8.3  | CommunityScreen empty state w/ Illustration, LANTERN.md changelog (this section)                      |

All slices shipped green: 0 antipattern gate matches across 152+ files, 19/19 Jest tests passing.
