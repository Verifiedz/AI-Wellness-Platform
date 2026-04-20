# Sakina AI — Aesthetic Research (2025/2026)

> Deep research deliverable for the Sakina AI redesign. Audience: another agent making concrete redesign decisions (palette, typography, motion, components).
> Goal: a "futuristic + calming" aesthetic — premium, polished, NOT looking AI-generated. Light + dark themes. Animations welcome, never seizure-inducing.
> Date: April 2026. Prescriptive, not descriptive.

---

## Section 1 — Reference App Teardowns

### 1.1 Calm
- **Palette:** Deep twilight blues + gradient skies. Calm's official tokens are catalogued on [Mobbin](https://mobbin.com/colors/brand/calm-com). Signature move: a near-black `#0F1B2D`-ish base with cinematic `#1F3A5F → #5C7DAA` sky gradients. Imagery (mountains, lakes, night sky) is treated like wallpaper, not decoration.
- **Typography:** Quiet, serif-influenced display + a clean sans for body. Generous line-height, generous padding — what [Raw.Studio](https://raw.studio/blog/the-aesthetics-of-calm-ux-how-blur-and-muted-themes-are-redefining-digital-design/) calls "the silence between the notes."
- **Signature interactions:** Slow, drifting parallax on cinematic backgrounds; full-bleed hero with soft scrim; "Daily Calm" card that hero-pushes content. Audio scrubber is a horizontal hairline, not a knob.
- **Why premium:** Treats the screen "like a spa, not a billboard." Restraint at every layer — one accent, lots of breathing room. Imagery does the work; UI is calligraphic stroke, not signage.

### 1.2 Headspace
- **Palette:** Vibrant orange `#F47D31` and warm yellow `#FFCB46` against soft pastels (peach, mint, dusty blue). [Headspace's design system (Figma blog)](https://www.figma.com/blog/building-a-design-system-that-breathes-with-headspace/) confirms a token-driven palette built in Figma Variables — primary, secondary, neutral with strict semantic names.
- **Typography:** Custom display with rounded terminals; generous body sans. All-curved geometry, no sharp edges.
- **Signature interactions:** Wobbling character illustrations, "play" button as a sun-like orb, wholesale character system (the "Headspace blobs") as motion personalities.
- **Why premium:** Disciplined token system + handcrafted illustration. Not pastels-as-default — pastels carrying brand identity. As [Neointeraction](https://www.neointeraction.com/blogs/headspace-a-case-study-on-successful-emotion-driven-ui-ux-design.php) notes, "every color, shape and line is intentional."

### 1.3 Balance (by Elevate Labs)
- **Palette:** Soft cream `#F4EFE8`-ish base, deep navy `#0E1736`, accent corals.
- **Typography:** Elegant serif headers + humanist sans body.
- **Signature interactions:** Personalized quiz that adapts the entire UI palette to the user's stated goals; meditation player uses a single pulsing orb.
- **Why premium:** [Choosing Therapy](https://www.choosingtherapy.com/balance-meditation-app-review/) gave it 5/5 for interface — "no bright colors, no oddly placed menus, no distracting caricatures." Personalization done with restraint.

### 1.4 Oak (by Kevin Rose / AJ&Smart)
- **Palette:** Painterly desaturated palette — muted ochre, dusty green, twilight blue — borrowed from classical landscape painting. See [Tim Höfer's case study](https://timhoefer.de/project/oak-meditation).
- **Typography:** Calm and deliberate serif (display) over a clean sans body.
- **Signature interactions:** A growing seedling-into-oak-tree progress visualization; long meditation sessions use a single hairline ring instead of a counter.
- **Why premium:** Custom hand-painted backgrounds by artist Sarah Kilcoyne. The illustration system feels human, not template-grade. They literally researched "temple architecture and classical landscape paintings."

### 1.5 Loóna (2021 Apple Design Award — Visuals & Graphics)
- **Palette:** Dreamy night-sky palettes per scene — indigos, amethysts, dusty pinks. Each "sleepscape" has its own coherent micro-palette.
- **Typography:** Soft humanist sans, looser tracking.
- **Signature interactions:** Tap-to-color 3D dioramas; paper-lantern-lighting interactions where each tap triggers a particle bloom and a soft chime; users physically *do* something to wind down. The team [explicitly removed scattered objects](https://developer.apple.com/design/awards/) from scenes because they activated user minds at bedtime — design as nervous-system regulation.
- **Why premium:** Cinematic 3D + sound + interaction triple-locked. Apple highlighted "type, color, animation, and 3D content — crafted with precision."

### 1.6 Endel
- **Palette:** Generative — each soundscape has its own monochrome-plus-accent visual that morphs slowly. Cool blues for Focus, warm ambers for Sleep.
- **Typography:** Mono-flavored sans for technical labels (heart rate, time-of-day), clean grotesque for body.
- **Signature interactions:** A single full-screen generative shape that breathes with the audio (Kandinsky-inspired). [Reacts to time-of-day, weather, heart rate, motion](https://endel.io/technology). The visual *is* the UI.
- **Why premium:** Founded by a contemporary visual artist (Protey Temen). Visual language explicitly references Brian Eno + Kandinsky + minimalist composers. UI doesn't try to be a hub — it tries to be a *room you sit in*.

### 1.7 Open
- **Palette:** Editorial — warm sand `#E8DCC9`, ink `#1A1A1A`, dusty terracotta accents.
- **Typography:** Big editorial serif headlines; humanist sans body. Reads like a print magazine.
- **Signature interactions:** Cinematic onboarding video montage; class browser laid out like a Vogue editorial spread, not a Spotify grid.
- **Why premium:** [Cinematography-first](https://crismascort.com/Open-iOS) — the app feels like a Soho House gym membership. Lifestyle aspiration without being aspirational-cringe.

### 1.8 Othership
- **Palette:** Mystical/otherworldly — deep aubergine, midnight blue, with iridescent magenta and cyan accents.
- **Typography:** Brand display (custom, slightly metaphysical), clean body.
- **Signature interactions:** Cinematic montage onboarding (every reviewer mentions it); soundscape that subtly shifts with breath cadence; aggressive but tasteful filter system (filter sessions by emotional state).
- **Why premium:** [App teardown on screensdesign](https://screensdesign.com/showcase/othership-guided-breathwork) calls it "incredibly polished and atmospheric." Brand consistency between digital app and physical bathhouses.

### 1.9 Finch
- **Palette:** Pastel rainbow categorization — lavender, mint, peach, sky-blue, soft pink. All ~70% saturation, ~85% lightness.
- **Typography:** Rounded display sans (likely a custom Quicksand-flavored face) + matching body sans. Curves everywhere, no sharp glyphs.
- **Signature interactions:** A virtual pet ("birb") with idle animations (preening, blinking, head-tilt) so the app feels *alive*; sparkle/diamond/confetti reward animations; daily color-shop refresh.
- **Why premium:** Emotional safety as a design principle. [Sophie Pilley's analysis](https://www.sophiepilley.com/post/the-magic-of-finch-where-self-care-meets-enchanted-design) calls it "compassionate tech." The aesthetic is unapologetically cozy — no clinical blue scrubs anywhere.

### 1.10 Stoic
- **Palette:** Stark black/white in default mode (later tinted slate `#3464B7` / `#54547B` palette in v3). Time-of-day shift: white-on-black at night, black-on-white in morning.
- **Typography:** Modern minimal sans, recently added Markdown editor with H1–H6 hierarchy.
- **Signature interactions:** Mode switch tied to time-of-day; one-thought-per-screen flow; breathing exercise as a single expanding circle.
- **Why premium:** Austerity that reads as confidence. Per their [August 2025 update](https://www.getstoic.com/blog/stoic-journal-update-august-2025-25), they're going all-in on iOS 26 Liquid Glass for the next major release.

### 1.11 Insight Timer
- **Palette:** Mostly content-forward — white background, black/gray text, full-bleed teacher imagery as the color carrier.
- **Typography:** Bold sans display for browse cards, body sans for descriptions.
- **Signature interactions:** Lead designer Andrew McKay's [recent refresh](https://dribbble.com/andrewmckay) added consolidated profiles, persistent now-playing pill above tab bar (Spotify-pattern), Stories on home only when followed teachers post, and Daily Check-in.
- **Why premium:** Editorial discipline — imagery is the color, type is the structure. Not trying to *be* premium, just clean and confident.

### 1.12 Newer 2025 entrants worth scouting
- **Stoxia** — extreme minimalism, "one page, one focus," black/white only, encrypted offline-first.
- **Meditate (2024 ADA finalist, Visuals & Graphics)** — recognized by Apple for visual craft in mindfulness.
- **Shine** — soft pastel + Black-creator-led editorial voice; warmer than Headspace.

---

## Section 2 — Aesthetic Direction Analysis (Ranked for Wellness Fit)

Score = best-fit for "futuristic + calming, premium, NOT AI-template." 1 = avoid, 5 = pursue hard.

### 2.1 Aurora / Mesh Gradients — **5/5** (lead with this)
Defining trend of 2025. [Linear, Vercel, Arc, Stripe](https://nineproo.com/blog/css-gradient-generator-guide) all use heavily-blurred, multi-radial-gradient backgrounds. The 2026 direction adds **grain** and **blur layering** for a dreamy, ethereal "aurora" quality. Native to wellness — feels like northern-lights / cosmic / breathing. Cheap to render (CSS gradients are 200B vs 2-5MB images). On RN, build with `@shopify/react-native-skia` shaders or layered `LinearGradient` + `BlurView`. Use `oklch` color interpolation for vivid midpoints without muddy bands.

### 2.2 Liquid Glass / iOS 26 Material — **5/5** (signature moment)
[Apple's WWDC 2025 introduction](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/) is the design conversation of 2025-2026. Translucent material that refracts what's behind it; tab bars shrink on scroll then re-expand; "specular highlights" on app icons. **Distinct from glassmorphism** — Liquid Glass is dynamic, attentive to light bending, edge fading. NN/g has [criticized](https://www.nngroup.com/articles/liquid-glass/) the readability of Apple's first pass — so we apply *selectively* (floating tab bar, modal handles, action sheet) and never to body text backdrops. RN implementation: `expo-blur` (intensity 60–80) layered on Skia `BackdropBlur`, with thin `1px` inner-stroke for the "edge fade."

### 2.3 Bento / Spatial Layouts — **4/5**
Bento (rounded rectangles of varying sizes, asymmetric balance) is now the default for Apple marketing pages and increasingly inside iOS. Per [Superfiles' interaction guide](https://www.superfiles.in/interactive-bento-grid-guide.php), the premium move is **2% scale + softer drop shadow + spring 300/20 on touch** — physics-based "press" feel. Use for the Home/Dashboard screen, not for chat. Avoid if it looks like a "stats grid" — ours should feel like a meditation room with discrete altars (mood, breath, journal, chat).

### 2.4 Ambient Generative Backgrounds (Endel-style) — **4/5**
A single full-screen breathing/morphing shape behind the active screen, optionally synced to time-of-day, weather, or in-session breath cadence. Use Skia for path-interpolated blob morphing (see Shopify's [Breathe.tsx example](https://github.com/Shopify/react-native-skia/blob/main/example/src/Examples/Breathe/Breathe.tsx)). Reserve for the Home hero and the breath-work / meditation player. Don't paste into every screen.

### 2.5 Dark Mode + Subtle Bioluminescent Accents — **5/5**
The most specific opportunity for "futuristic but calming." Per [AdviseGraphics' 2026 trend report](https://www.advisegraphics.com/neon-graphic-design-trend-2026), **bioluminescent cyan** is now associated with eco-tech and wellness. Apply soft outer glow (`shadow + filter: blur`) to active states only — primary CTA, breathing-ring active stroke, AI thinking indicator. Animate as gentle 4–6s pulse, never hard flicker. Critical: desaturate brand colors ~15% for dark mode to avoid "vibration" on near-black backgrounds.

### 2.6 visionOS Spatial UI Patterns adapted for 2D — **4/5**
Borrow the *grammar* of visionOS without literal 3D: floating "ornament" toolbars (per [createwithswift](https://www.createwithswift.com/embracing-extended-reality-xr-diving-deep-into-spatial-design-for-visionos/)), depth via translucent layered surfaces (not box-shadows), persistent ambient elements. Implementation: tab bar floats above content with 16pt outer margin, blur backing, and a soft 20% black scrim around it.

### 2.7 Glassmorphism (the 2020-era version) — **3/5**
Largely *replaced by* Liquid Glass + Aurora in 2025. Pure glassmorphism (frosted card on a colorful blob) now reads as "AI design template." Use only as a tactical tool for floating modals and bottom sheets, never as the default surface treatment.

### 2.8 Soft Neumorphism — **2/5** (selective use only)
Reviving as "Neumorphism 2.0" — per [Big Human's 2026 guide](https://www.bighuman.com/blog/neumorphism), wellness apps are one of its few legitimate homes. **Caveat:** still fails WCAG 2.2 contrast at scale. Use only on **passive, decorative elements** (the breathing-orb base, mood-token chips), never on tappable buttons or text labels. Pair with strong typography to compensate.

### 2.9 Skeuomorphism Revival (Airbnb-style 3D icons) — **3/5**
Useful for *one* hero element per surface (e.g., a 3D crystal/orb representing your daily mood). Avoid as system-wide pattern — that's the iOS 6 trap.

### 2.10 Brutalism — **1/5** (hard no)
Wrong for wellness. Confirmed.

---

## Section 3 — Signature Interactions Catalog (15+ patterns to steal)

1. **Breathing-synced ambient gradient** — The home background slowly drifts on a 4–8s cycle that *matches* the user's last breath-work pace. Skia shader, Reanimated `withRepeat(withTiming(8000), -1, true)`.
2. **Skia blob-morphing "thinking" indicator** — Replace the spinner. Two SVG paths, `interpolatePath` between them on a Reanimated shared value. Pair with `Haptics.selectionAsync()` once per breath cycle.
3. **Particle bloom on completion** — When user finishes a session/journal/breath cycle: 12–24 small Skia circles fly outward with eased cubic-out, fade. Pair with `Haptics.notificationAsync(Success)`. Reserved — feels cheap if overused.
4. **Long-press with backdrop blur** — Long-press a card → entire surface behind blurs (`expo-blur` intensity 0→80 over 200ms) + card scales to 1.02 with soft drop shadow. iOS-native preview pattern.
5. **Shared element transitions** — Card thumbnail → full-screen detail via Reanimated 4 shared transitions (gated behind `ENABLE_SHARED_ELEMENT_TRANSITIONS` flag, per [official docs](https://docs.swmansion.com/react-native-reanimated/docs/shared-element-transitions/overview/)). Use for chat session list → conversation view; mood card → detail.
6. **Tab bar that shrinks on scroll, expands on scroll-up** — Direct Liquid Glass / iOS 26 pattern. Listen to scrollY, animate tab bar height + opacity.
7. **Pull-to-refresh as a meditation moment** — Replace the system spinner with our breathing blob. Pull distance maps to blob radius; release triggers an inhale → hold → exhale animation (1.5s) before the refresh resolves.
8. **Magnetic snap on session selection** — Horizontal snap-to-card carousel with subtle haptic tick at each card boundary (`Haptics.impactAsync(Light)`).
9. **Scroll-driven parallax depth** — Background ambient gradient drifts at 0.3× scroll speed; mid-layer cards at 0.7×; foreground UI at 1.0×. Three layers max, no more, or it gets nauseating.
10. **Haptic-coordinated transitions** — Sheet open: `Light` impact at start of slide. Sheet dismiss: nothing. Primary CTA: `Medium` impact synced with the visual press peak. Per [Saropa's 2025 haptics guide](https://saropa-contacts.medium.com/2025-guide-to-haptics-enhancing-mobile-ux-with-tactile-feedback-676dd5937774), match haptic intensity to visual weight.
11. **Time-of-day color drift** — Headers and ambient gradient subtly shift hue across the day (cool blue 6 AM → warm amber 6 PM → indigo 10 PM). Inspired by Samsung's 2025 time-based UI.
12. **"Specular highlight" on Liquid Glass tab bar** — A faint white inner stroke that gently moves with device tilt (use `expo-sensors` accelerometer, throttle to 30Hz, dead-zone <0.05g).
13. **Bento-card press physics** — On touch: `withSpring(scale: 0.98, { stiffness: 300, damping: 20 })`. On release: spring back to 1.0. Soft drop-shadow grows when pressed (illusion of lift).
14. **Mood "crystal" 3D orb on home** — A single Lottie/Skia 3D-shaded orb whose color, opacity, and rotation reflect the user's last logged mood. Tap → detail screen via shared transition.
15. **Aurora wash on AI streaming** — While the AI assistant is generating a response, a soft cyan/lavender aurora gradient drifts behind the message bubble. Stops when streaming ends. Replaces typing dots.
16. **One-tap "exhale" gesture** — Touch and hold anywhere on the home screen → 4-second exhale animation across the full screen (gradient brightness drops, blur deepens, soft chime). A nervous-system regulation primitive baked into the chrome.
17. **Hairline progress rings, never bars** — Meditation timer, journal streak, habit completion: all rendered as 1.5pt SVG arcs, never thick bars. Filling animation uses `easeOutQuart` over the actual session duration.
18. **Bottom sheet with grabbable handle that pulses on first appearance** — 3px-wide pill, 36px-wide, grows briefly to 48px once on mount to teach the gesture, then settles.

---

## Section 4 — Color Palette Recommendations

Each palette is a complete light + dark token set. All hex codes have been roughed for WCAG AA on the primary text/background pair (≥4.5:1) and most key interactive pairs (≥3:1). The `accent` color is what goes on glow/CTA — desaturate further if used as a background.

### 4.1 "Midnight Aurora" *(recommended primary)*
Cosmic, futuristic, breathing-room. Bioluminescent cyan accent. Best for the "futuristic + calming" brief.

| Token | Light | Dark |
|---|---|---|
| bg.base | `#F7F8FB` | `#0B0F1A` |
| bg.surface | `#FFFFFF` | `#141A2A` |
| bg.surfaceHigh | `#EEF1F7` | `#1D2438` |
| bg.elevated | `#FFFFFF` | `#262E47` |
| primary | `#5B7CFA` | `#7A95FF` |
| primary.hover | `#4863DC` | `#94ACFF` |
| accent (bioluminescent) | `#34E0C8` | `#5AF0DA` |
| accent.glow | `rgba(90, 240, 218, 0.35)` | `rgba(90, 240, 218, 0.55)` |
| secondary (lavender) | `#9C8FFF` | `#B6ACFF` |
| success | `#3DBE8B` | `#5BD9A8` |
| warning | `#E8B341` | `#F2C566` |
| error | `#E5604D` | `#FF8576` |
| text.primary | `#0E1426` | `#EEF1FA` |
| text.secondary | `#4A5168` | `#A6B0C8` |
| text.tertiary | `#7A8197` | `#6E788F` |
| border.subtle | `#E5E8F0` | `#252B3F` |
| border.strong | `#C8CDDB` | `#3A4258` |

### 4.2 "Sage Mist" *(secondary option — softer, more terrestrial)*
Botanical, grounded. For users who find Midnight Aurora too cosmic.

| Token | Light | Dark |
|---|---|---|
| bg.base | `#F5F4EE` | `#0F1714` |
| bg.surface | `#FFFFFF` | `#1A2421` |
| bg.surfaceHigh | `#EDEBE0` | `#222E2A` |
| bg.elevated | `#FFFFFF` | `#2C3934` |
| primary (sage) | `#5E8C6A` | `#9DC8A3` |
| primary.hover | `#4A7456` | `#B6DABB` |
| accent (warm amber) | `#D9914A` | `#F0AD68` |
| accent.glow | `rgba(217, 145, 74, 0.30)` | `rgba(240, 173, 104, 0.45)` |
| secondary (clay) | `#B96D52` | `#D8917A` |
| success | `#5E8C6A` | `#88B894` |
| warning | `#D9A24A` | `#EFC078` |
| error | `#C4524A` | `#E47A6F` |
| text.primary | `#1A211E` | `#E8E5DA` |
| text.secondary | `#4F5751` | `#A8A89A` |
| text.tertiary | `#7A8079` | `#6E7269` |
| border.subtle | `#DEDCD0` | `#2A332E` |
| border.strong | `#BDBBA9` | `#3F4943` |

### 4.3 "Inkwell" *(editorial option — Stoic / Open territory)*
Stark, confident, journaling-first.

| Token | Light | Dark |
|---|---|---|
| bg.base | `#FAF7F2` | `#0C0C0E` |
| bg.surface | `#FFFFFF` | `#161618` |
| bg.surfaceHigh | `#F0EDE6` | `#1F1F22` |
| bg.elevated | `#FFFFFF` | `#27272B` |
| primary (ink) | `#1A1A1A` | `#F5F2EC` |
| primary.hover | `#000000` | `#FFFFFF` |
| accent (terracotta) | `#C45A3F` | `#E07758` |
| accent.glow | `rgba(196, 90, 63, 0.20)` | `rgba(224, 119, 88, 0.40)` |
| secondary (slate) | `#5A6675` | `#8A95A8` |
| success | `#3D8166` | `#6BB892` |
| warning | `#C8932A` | `#E0B05A` |
| error | `#B84532` | `#D86C5C` |
| text.primary | `#1A1A1A` | `#F5F2EC` |
| text.secondary | `#525252` | `#9A968B` |
| text.tertiary | `#7E7B72` | `#6A6862` |
| border.subtle | `#E4E0D6` | `#26262A` |
| border.strong | `#BFBAAA` | `#3A3A3F` |

### 4.4 "Twilight Iris" *(playful / Finch-adjacent option)*
Soft pastels, cozy, dopamine-friendly. Best if testing shows users want emotional warmth over futurism.

| Token | Light | Dark |
|---|---|---|
| bg.base | `#FBF7FA` | `#15101F` |
| bg.surface | `#FFFFFF` | `#1F1830` |
| bg.surfaceHigh | `#F4ECF3` | `#2A2240` |
| bg.elevated | `#FFFFFF` | `#352D4D` |
| primary (iris) | `#7A5BD9` | `#A28CFF` |
| primary.hover | `#604CB6` | `#BBA9FF` |
| accent (peach) | `#FF9DAA` | `#FFB6BF` |
| accent.glow | `rgba(255, 157, 170, 0.35)` | `rgba(255, 182, 191, 0.50)` |
| secondary (mint) | `#7FD7B5` | `#9CE5C8` |
| success | `#62C49B` | `#86DAB1` |
| warning | `#F2BB5C` | `#FFCD7A` |
| error | `#E96B7F` | `#FF8A9A` |
| text.primary | `#1B1330` | `#F4EFFA` |
| text.secondary | `#54486D` | `#B5ACC8` |
| text.tertiary | `#8478A0` | `#7A6F94` |
| border.subtle | `#EDE3F0` | `#2D2540` |
| border.strong | `#CBC0D2` | `#443B5A` |

**Rationale on the pure-black avoidance:** all dark bases are `#0B–#16` range, never `#000`. Per [accessibilitychecker.org](https://www.accessibilitychecker.org/blog/dark-mode-accessibility/) and [BOIA](https://www.boia.org/blog/offering-a-dark-mode-doesnt-satisfy-wcag-color-contrast-requirements), pure black causes "halation" for astigmatic users and fails the premium-feel test.

---

## Section 5 — Typography Systems

All four pairings are available in `@expo-google-fonts/*` packages. Load via `useFonts()` + `expo-splash-screen` to prevent FOUT.

### 5.1 "Editorial Calm" — Fraunces + Inter *(recommended)*
- Fraunces is a contemporary serif with optical sizing axes — feels editorial like Open / Calm. Inter handles body and UI labels with clarity. Use Fraunces only at >=24pt; below that it muddies.

| Token | Font / Weight | Size (pt) | Line height | Tracking |
|---|---|---|---|---|
| display-xl | Fraunces 300, opsz 144 | 56 | 60 | -0.02em |
| display-lg | Fraunces 300, opsz 96 | 40 | 46 | -0.015em |
| h1 | Fraunces 400, opsz 48 | 28 | 34 | -0.01em |
| h2 | Inter 600 | 22 | 28 | -0.005em |
| h3 | Inter 600 | 18 | 24 | 0 |
| body-lg | Inter 400 | 17 | 26 | 0 |
| body | Inter 400 | 15 | 22 | 0 |
| body-sm | Inter 400 | 13 | 18 | 0.005em |
| caption | Inter 500 | 12 | 16 | 0.01em |
| label | Inter 600 | 11 | 14 | 0.04em (uppercase optional) |
| mono | JetBrains Mono 400 | 13 | 20 | 0 |

### 5.2 "Modern Mindful" — DM Sans + DM Serif Display
Already in the project (`@expo-google-fonts/dm-sans`). Add DM Serif Display for editorial moments (reflections, daily quote). Single-family discipline = lower bundle, easier consistency.

| Token | Font / Weight | Size | LH | Tracking |
|---|---|---|---|---|
| display-xl | DM Serif Display | 56 | 60 | -0.01em |
| display-lg | DM Serif Display | 40 | 46 | -0.005em |
| h1 | DM Sans 700 | 28 | 34 | -0.005em |
| h2 | DM Sans 600 | 22 | 28 | 0 |
| h3 | DM Sans 600 | 18 | 24 | 0 |
| body-lg | DM Sans 400 | 17 | 26 | 0 |
| body | DM Sans 400 | 15 | 22 | 0 |
| body-sm | DM Sans 400 | 13 | 18 | 0.005em |
| caption | DM Sans 500 | 12 | 16 | 0.01em |
| label | DM Sans 600 | 11 | 14 | 0.04em |
| mono | JetBrains Mono | 13 | 20 | 0 |

### 5.3 "Architectural" — Afacad + Karla
Per [Lion Tree Group's 2025 roundup](https://www.liontreegroup.com/graphic-design/new-google-fonts-you-need-to-try-in-2025-pairings/), Afacad is a 2025 standout — clean numerals, architectural geometry. Pair with Karla (humanist body) for warmth.

| Token | Font / Weight | Size | LH | Tracking |
|---|---|---|---|---|
| display-xl | Afacad 600 | 52 | 58 | -0.015em |
| display-lg | Afacad 600 | 38 | 44 | -0.01em |
| h1 | Afacad 600 | 26 | 32 | -0.005em |
| h2 | Afacad 500 | 21 | 28 | 0 |
| h3 | Karla 700 | 18 | 24 | 0 |
| body-lg | Karla 400 | 17 | 26 | 0 |
| body | Karla 400 | 15 | 22 | 0 |
| body-sm | Karla 400 | 13 | 18 | 0.005em |
| caption | Karla 500 | 12 | 16 | 0.015em |
| label | Karla 700 | 11 | 14 | 0.05em |

### 5.4 "Quiet Literary" — Cormorant Garamond + Mulish
Most premium / Open-app territory. High-contrast serif headlines, soft humanist body. Best if user testing leans toward "spa" over "spaceship."

| Token | Font / Weight | Size | LH | Tracking |
|---|---|---|---|---|
| display-xl | Cormorant Garamond 300 | 60 | 64 | -0.015em |
| display-lg | Cormorant Garamond 300 | 44 | 50 | -0.01em |
| h1 | Cormorant Garamond 500 | 30 | 36 | -0.005em |
| h2 | Mulish 700 | 22 | 28 | 0 |
| h3 | Mulish 600 | 18 | 24 | 0 |
| body-lg | Mulish 400 | 17 | 26 | 0 |
| body | Mulish 400 | 15 | 22 | 0 |
| body-sm | Mulish 400 | 13 | 18 | 0.005em |
| caption | Mulish 500 | 12 | 16 | 0.015em |
| label | Mulish 700 | 11 | 14 | 0.04em |

---

## Section 6 — Iconography

Recommendation: **[Phosphor Icons](https://phosphoricons.com)** with **duotone** as the primary weight, **regular** as the secondary (for monochrome contexts). Per [Hugeicons' analysis](https://hugeicons.com/blog/design/8-lucide-icons-alternatives-that-offer-better-icons), Lucide is now a "AI template tell" — every starter kit uses it. Phosphor's six-weight system (Thin/Light/Regular/Bold/Fill/Duotone) lets us encode hierarchy through icon weight rather than just size:

- **Duotone** for tab bar icons, cards, onboarding moments.
- **Regular** (1.5pt stroke) for inline UI, chat bubbles.
- **Bold** for active states only.
- **Fill** for completed checkmarks, selected radio states, achievement badges.

Custom requirement: design **5–8 hand-drawn brand icons** in Figma for the highest-touch surfaces (Sakina logo glyph, breath-work entry, journal entry, AI companion avatar, mood crystal). These must NOT come from a library. Each ~24×24, exported as SVG, optionally rendered through Skia for animated hover/press states. This is the single biggest defense against the "AI template" look.

---

## Section 7 — Illustration / Imagery Direction

**No lotus flowers. No watercolor mandalas. No 3D faceless humans holding glowing orbs.**

Recommended hierarchy:

1. **Aurora mesh gradients (primary)** — Skia-rendered, parameterized by the active theme palette. Different gradient seed per session so the home screen literally never looks the same twice. Add a 4–8% noise/grain overlay (per [Kittl's 2025 trend report](https://www.kittl.com/article/gradient-graphic-design-trend) — grain is the differentiator between "2020 gradient" and "2025 aurora").
2. **A small set of custom abstract 3D objects** — one mood "crystal" orb, one breath orb, one journal sigil, one AI avatar. Commission from a 3D illustrator (Spline/Cinema 4D), export as PNG with transparency at @3x. These become the recurring brand artifacts.
3. **Painterly textured backgrounds (selective)** — for special moments (post-meditation reward screen, daily reflection completion), Oak-style Sarah-Kilcoyne-flavored painterly imagery. Hand-commissioned, never stock.
4. **Photography — sparingly, masked into organic shapes** — Only if needed for teacher/coach pages or social proof. Always cropped to organic blobs (squircles + path masks), never rectangles.

What we explicitly avoid (all are AI-generation tells per [Mageswari's analysis](https://medium.com/@Rythmuxdesigner/why-your-ai-generated-ui-looks-like-everyone-elses-and-how-to-break-the-pattern-7a3bf6b070be)):
- Faceless 3D characters in impossible poses
- Generic gradient blobs without grain or composition
- Stock meditation-pose photography
- Flat illustrated "person doing yoga" art
- Lotus, om symbols, mandalas (cultural appropriation + cliché)

---

## Section 8 — Motion Design Principles

**Duration ladder**
- 100–150 ms — micro-feedback (button press visual state, ripple, haptic-aligned tap)
- 200–250 ms — small UI changes (toggle, chevron rotate, color shift)
- 300–400 ms — sheet/modal open, tab change, card expand
- 400–500 ms — screen transition (push/pop)
- 600–800 ms — rare hero moments (post-meditation completion bloom)
- 4–8 s — ambient (breathing gradient drift, generative background morph)

**Easing**
- Default: `ease-out` cubic (`cubic-bezier(0.22, 1, 0.36, 1)`) — matches user expectation for "object arriving."
- Springs for anything interactive: Reanimated `withSpring({ stiffness: 180, damping: 22, mass: 1 })` — per [Apple's WWDC23 spring talk](https://developer.apple.com/videos/play/wwdc2023/10158/), `dampingFraction 0.8–0.85` is the premium sweet spot.
- Avoid: linear (robotic), pure ease-in (sluggish), bouncy underdamped springs (toy-like).

**What makes premium feel vs Material default**
- **Springs not durations.** The moment a UI uses physics-based motion that responds to gesture velocity, it feels Apple-tier rather than Android-default.
- **Coordinated multi-property animation.** Don't just animate `opacity`. Animate `opacity + scale + blur + translateY` together with the same spring. Composition is what reads as "crafted."
- **Haptic + visual sync at the animation's peak**, not its start. Per [Saropa's haptics guide](https://saropa-contacts.medium.com/2025-guide-to-haptics-enhancing-mobile-ux-with-tactile-feedback-676dd5937774): synchronize the impact with the visual peak, e.g., the moment a sheet hits its rest position.
- **Interruption-friendly.** A user mid-swipe must be able to reverse direction without the animation snapping. Reanimated 3 + shared values handles this; `setTimeout`-based animation does not.
- **No "android material ripple" on iOS.** That exact pattern is the giveaway.

**Reduce-motion handling**
- Respect `AccessibilityInfo.isReduceMotionEnabled()`.
- When enabled: drop ambient gradient drift, drop blob morphing, drop parallax. Keep crossfades at 200ms. Keep haptics (they remain valuable confirmation).

---

## Section 9 — Anti-Patterns Deep Dive (20+ AI-generation / cheap-template tells)

Per the [Mageswari Medium piece](https://medium.com/@Rythmuxdesigner/why-your-ai-generated-ui-looks-like-everyone-elses-and-how-to-break-the-pattern-7a3bf6b070be) and the [Delivered Social red-flags guide](https://deliveredsocial.com/spotting-ai-generated-content-red-flags-in-text-images-and-videos/), plus general design experience:

1. **Purple-to-blue diagonal gradient hero.** The single most over-used gradient of 2023–2024. Replace with aurora mesh + grain.
2. **Glassmorphism on every card.** Reads as "v0.dev / shadcn template." Use only for floating chrome.
3. **Lucide icons with default 2px stroke.** Either customize stroke weight or switch to Phosphor.
4. **Inter for everything.** Inter is excellent — but pair with a serif or expressive display, never solo across all surfaces.
5. **3D faceless humans with floating UI elements.** Unmissable AI-image tell.
6. **Stock photography of meditation poses (legs-crossed silhouette in front of sunset).** Cliché since 2015.
7. **Lotus / mandala / Buddha imagery.** Cultural appropriation + visual cliché. Avoid entirely.
8. **Default Tailwind `slate-900` background.** Identical to every shadcn dashboard. Tint it warm or cool toward your brand.
9. **Pure `#000` background with pure `#FFF` text.** Halation hell. Astigmatic users suffer; everyone reads it as cheap.
10. **Generic "Welcome back, [Name]" greeting on home.** Every wellness app does this. Replace with something context-aware: weather, time-of-day, last session.
11. **Octopus-style screen with 12 quick-action tiles.** Says "we couldn't decide what's primary." Ruthless prioritization wins.
12. **Bright red error toasts.** Wellness apps shouldn't shout. Use a desaturated coral and a calm phrase.
13. **System-default iOS / Material switches and pickers.** Free, but they break the brand. Always wrap with custom styling.
14. **Aggressive bottom-tab labels under every icon.** Modern Apple apps drop the labels (or only show on focus). Try icon-only with focus reveal.
15. **Drop-shadows everywhere.** Use elevation through *color value* (lighter surfaces advance) — per [accessibility-checker dark mode guide](https://www.accessibilitychecker.org/blog/dark-mode-accessibility/) — not literal shadows.
16. **CSS-`linear-gradient(red, blue)`-style two-stop gradients.** Stripe and Linear use multi-radial mesh. Match them.
17. **Confetti on every completion.** Reserve for the meaningful moments — completing a 30-day streak, not every breath.
18. **Generic chat bubble UI (gray for them, blue for you).** That's iMessage. Ours is an AI companion — give the assistant a distinct ambient aurora wash.
19. **Cards with hard 1px borders + drop shadow + rounded corners, all at once.** Pick one elevation language. We pick: subtle border + tonal shift, no shadow.
20. **Settings screen as a UITableView clone.** The most boring screen in the app. Apply the same care as any other surface.
21. **Loading spinners.** Replace with a breathing blob, an aurora wash, or a hairline progress ring.
22. **"Premium" gold accents on the upgrade CTA.** Reads as gambling app. Ours uses the brand accent at full saturation, distinguished by motion (a soft pulse), not material.
23. **Fully justified body text.** Creates rivers of whitespace on mobile. Always left-aligned for body.
24. **Typography below 13pt for body content.** Fails Dynamic Type / older eyes test.
25. **Carousel dots that don't indicate position with visual weight.** Tiny grey dots are the laziest pagination indicator possible.

---

## Section 10 — Accessibility

Premium and accessible are not in tension — they reinforce each other. The discipline that produces good contrast is the same discipline that produces good visual hierarchy.

**Color contrast**
- Body text against any background: **minimum 4.5:1**, target **7:1** (WCAG AAA). Per [W3C WCAG 2.2 SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- Interactive controls (buttons, form fields, focus indicators): **minimum 3:1** against adjacent surfaces.
- Re-test all four palettes above with [APCA contrast tool](https://www.myndex.com/APCA/) — it's the metric WCAG 3 will adopt. Lc ≥ 60 for body text, Lc ≥ 75 for primary text.
- Never rely on color alone for state. Active tab also gets a subtle indicator stroke; error fields also get an icon and a written label.

**Motion**
- Honor `AccessibilityInfo.isReduceMotionEnabled()` everywhere. When enabled: ambient drift OFF, parallax OFF, blob morphing OFF, transitions reduced to 200ms crossfade. Per [W3C reduce-motion guidance](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html).
- No animations longer than 5s without an obvious pause-affordance.
- Keep motion *peripheral* not *central* — the user should be able to use the app fully with all motion off.

**Typography**
- Honor iOS Dynamic Type / Android font scale. All sizes above declared as min-clamped — body never below 13pt regardless of base.
- Line-height ≥ 1.4× body size.
- Never set text in pure white over photography — always with a 30–50% black scrim or text-shadow.

**Touch targets**
- Minimum **44×44pt** per Apple HIG, **48×48dp** per Material. We use **48×48** as a unified minimum.
- Adjacent tap targets get ≥ 8pt spacing to prevent fat-finger errors.

**Haptics & sound**
- Both must be system-overridable. Provide an in-app toggle independent of system setting (per [influencers-time haptic guide](https://www.influencers-time.com/haptic-feedback-the-future-of-mobile-brand-interactions/) — user control is a usability principle).
- Never the only channel for critical info.

**Focus indicators**
- All interactive elements get a visible focus ring (2pt accent stroke + 8pt outer halo) when navigated by keyboard or screen reader. Currently absent in many React Native apps; add explicitly.

**Cognitive load**
- One primary action per screen.
- Honor the user's stated mood/energy level — if the user logs "low," the home screen reduces visible options to 3, not 8.

---

## Sources

- [Mobbin — Calm brand color reference](https://mobbin.com/colors/brand/calm-com)
- [Raw.Studio — The Aesthetics of Calm UX](https://raw.studio/blog/the-aesthetics-of-calm-ux-how-blur-and-muted-themes-are-redefining-digital-design/)
- [DesignRush — Calm app feature](https://www.designrush.com/best-designs/apps/calm)
- [Figma Blog — Building a Design System That Breathes with Headspace](https://www.figma.com/blog/building-a-design-system-that-breathes-with-headspace/)
- [Neointeraction — Headspace Emotion-Driven UI/UX](https://www.neointeraction.com/blogs/headspace-a-case-study-on-successful-emotion-driven-ui-ux-design.php)
- [Medium — Practicing Headspace](https://medium.com/design-bootcamp/practicing-headspace-2660432be440)
- [aViewFromTheCave — Finch deep dive](https://www.aviewfromthecave.com/what-is-finch-app/)
- [Sophie Pilley — The Magic of Finch](https://www.sophiepilley.com/post/the-magic-of-finch-where-self-care-meets-enchanted-design)
- [Endel.io — Technology page](https://endel.io/technology)
- [Apple Newsroom — Endel app creator](https://www.apple.com/newsroom/2021/05/endel-app-creator-on-the-power-of-endless-ambient-music/)
- [Loóna — Apple Design Awards page](https://loona.app/apple-design-awards.html)
- [Apple Developer — 2021 Apple Design Award Winners](https://developer.apple.com/design/awards/2021/)
- [Tim Höfer — Oak Meditation case study](https://timhoefer.de/project/oak-meditation)
- [getstoic.com — Stoic August 2025 update](https://www.getstoic.com/blog/stoic-journal-update-august-2025-25)
- [screensdesign — Othership teardown](https://screensdesign.com/showcase/othership-guided-breathwork)
- [Cris Mascort — Open iOS work](https://crismascort.com/Open-iOS)
- [DesignRush — Insight Timer minimalist interface](https://www.designrush.com/best-designs/apps/insight-timer)
- [Apple Newsroom — Liquid Glass announcement](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/)
- [NN/g — Liquid Glass Is Cracked, and Usability Suffers](https://www.nngroup.com/articles/liquid-glass/)
- [Wikipedia — Liquid Glass](https://en.wikipedia.org/wiki/Liquid_Glass)
- [Cygnis — Implementing Liquid Glass UI in React Native](https://cygnis.co/blog/implementing-liquid-glass-ui-react-native/)
- [Expo — BlurView Documentation](https://docs.expo.dev/versions/latest/sdk/blur-view/)
- [React Native Skia — Animations Documentation](https://shopify.github.io/react-native-skia/docs/animations/animations/)
- [Shopify — Breathe.tsx example](https://github.com/Shopify/react-native-skia/blob/main/example/src/Examples/Breathe/Breathe.tsx)
- [React Native Reanimated — Shared Element Transitions](https://docs.swmansion.com/react-native-reanimated/docs/shared-element-transitions/overview/)
- [createwithswift — Spatial Design for visionOS](https://www.createwithswift.com/embracing-extended-reality-xr-diving-deep-into-spatial-design-for-visionos/)
- [Apple Developer — Designing for visionOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-visionos/)
- [Apple Developer — Animate with Springs (WWDC23)](https://developer.apple.com/videos/play/wwdc2023/10158/)
- [Saropa — 2025 Guide to Haptics](https://saropa-contacts.medium.com/2025-guide-to-haptics-enhancing-mobile-ux-with-tactile-feedback-676dd5937774)
- [Influencers-Time — Haptic Feedback in Mobile Brand UX](https://www.influencers-time.com/haptic-feedback-the-future-of-mobile-brand-interactions/)
- [bricxlabs — 12 Micro Animation Examples 2025](https://bricxlabs.com/blogs/micro-interactions-2025-examples)
- [Kittl Blog — Gradient Design Trend](https://www.kittl.com/article/gradient-graphic-design-trend)
- [LearnUI Design — Mesh Gradients Deep Dive](https://www.learnui.design/blog/mesh-gradients.html)
- [Aurora Gradient Generator](https://auroragradient.com/)
- [Vercel Mesh Gradient Tool](https://meshgradient.vercel.app/)
- [Hugeicons — Lucide Alternatives](https://hugeicons.com/blog/design/8-lucide-icons-alternatives-that-offer-better-icons)
- [Phosphor Icons](https://phosphoricons.com)
- [Matt Medley — Best Google Font Pairings 2025](https://medium.com/design-bootcamp/best-google-font-pairings-for-ui-design-in-2025-ba8d006aa03d)
- [Lion Tree Group — New Google Fonts 2025](https://www.liontreegroup.com/graphic-design/new-google-fonts-you-need-to-try-in-2025-pairings/)
- [Expo google-fonts repo](https://github.com/expo/google-fonts)
- [Big Human — Neumorphism 2026 Guide](https://www.bighuman.com/blog/neumorphism)
- [AdviseGraphics — Neon Trend 2026](https://www.advisegraphics.com/neon-graphic-design-trend-2026)
- [Vev Design — Dark Mode Color Palettes](https://www.vev.design/blog/dark-mode-website-color-palette/)
- [Karen Ying — 50 Shades of Dark Mode Gray](https://blog.karenying.com/posts/50-shades-of-dark-mode-gray/)
- [Accessibility Checker — Dark Mode Accessibility Guide](https://www.accessibilitychecker.org/blog/dark-mode-accessibility/)
- [BOIA — Dark Mode and WCAG Contrast](https://www.boia.org/blog/offering-a-dark-mode-doesnt-satisfy-wcag-color-contrast-requirements)
- [W3C WCAG 2.2 — Visual Contrast](https://www.w3.org/WAI/GL/WCAG3/2022/how-tos/visual-contrast-of-text/)
- [Mageswari — Why AI-Generated UI Looks the Same](https://medium.com/@Rythmuxdesigner/why-your-ai-generated-ui-looks-like-everyone-elses-and-how-to-break-the-pattern-7a3bf6b070be)
- [Delivered Social — Spotting AI-Generated Content](https://deliveredsocial.com/spotting-ai-generated-content-red-flags-in-text-images-and-videos/)
- [Superfiles — Animating Bento Grids](https://www.superfiles.in/interactive-bento-grid-guide.php)
- [Jaco Verdini — Embracing the Bento Grid](https://jacoverdini.medium.com/embracing-the-bento-grid-a-modern-approach-to-ui-layouts-4a15f618e751)
- [Animations.dev — The Easing Blueprint](https://animations.dev/learn/animation-theory/the-easing-blueprint)
- [Josh W. Comeau — Springs and Bounces in Native CSS](https://www.joshwcomeau.com/animation/linear-timing-function/)
