# Illustration pipeline (hybrid)

Produced per plan §7.1. ~15 hand-curated pieces under `frontend/assets/illustrations/` at 2× and 3× densities.

## Style lock (non-negotiable)

Risograph-inspired. Warm cream paper (`#F6F1E8`), deep sage (`#5B7F6E`), single amber accent (`#D49B5C`). Light halftone grain. Hand-cut edges. Ink scale `#1F2A26` for faces and outlines.

**Forbidden:** purple/cyan gradients, 3D glossy "crypto" look, anime eyes, stock-photo smiles, lens flare, watermarks, horror poses, sharp-anguish faces.

## Prompt template (prepend every generation)

```
Editorial health illustration, risograph print, limited palette cream (#F6F1E8),
deep sage (#5B7F6E), and amber (#D49B5C). Subtle halftone grain, organic shapes,
soft human figures facing softly toward a small warm lantern. No text in image,
no logos, square safe margin 8%, hand-cut paper edges, gentle overlap between
color plates as in 2-color risograph.
```

### Negative prompt

```
purple gradient, cyan neon, lens flare, stock photo smile, watermark, glossy 3D,
anime, horror, heavy shadows, anguish face, sharp teeth, photorealistic skin,
text in image, brand logos, emoji.
```

## Seed discipline

Lock a single seed per slot. Record `{ slot, seed, prompt_hash, model, version }` alongside the exported PNG filename.

Seed filename convention: `<slot>_<seed>.<density>x.png`, e.g.
`empty-journal_731194.2x.png`, `milestone-thirty-days_884213.3x.png`.

Each slot's seed is locked until the entire batch is reshot — never vary a seed within a shipped batch.

## Slot map

See `frontend/assets/illustrations/MANIFEST.md` for the canonical list of 15 slots, their route usage, and export status.

| Category      | Slot key                         | Used by                                         |
| ------------- | -------------------------------- | ----------------------------------------------- |
| Empty states  | `empty-journal`                  | JournalScreen (first run)                       |
|               | `empty-chat`                     | AIChatScreen empty                               |
|               | `empty-insights`                 | Home patterns empty                              |
|               | `empty-assessments`              | AssessmentHistoryScreen empty                    |
| Onboarding    | `onboard-recognition-tired`      | RecognitionScreen vignette 1                     |
|               | `onboard-recognition-loop`       | RecognitionScreen vignette 2                     |
|               | `onboard-recognition-showup`     | RecognitionScreen vignette 3                     |
| Milestones    | `milestone-first-key`            | First earned lantern moment                      |
|               | `milestone-ten-journals`         | 10th journal entry moment                        |
|               | `milestone-thirty-days`          | 30 days of practice moment                       |
| Placeholders  | `memory-placeholder`             | JournalScreen "Add a memory" empty photo tile    |
|               | `letter-exchange`                | Community Letter Exchange feature                |
| Store         | `splash-lantern`                 | expo-splash-screen                               |
|               | `app-icon`                       | iOS + Android adaptive + notification            |
|               | `poster-hero`                    | docs/poster/engineering_poster                   |

## Curation rules

- Throw away ≥3× what you keep. If the first 3 renders don't satisfy the style lock, re-prompt with more constraint rather than picking the least-bad.
- No human figure larger than 40% of frame. The lantern is the protagonist.
- A single figure, preferably seen from behind or in profile. Never direct gaze at camera.
- Hands are the hardest — prefer compositions where hands are tucked, held, or around a cup.

## Export

- 2× and 3× density PNGs with transparent background saved under `frontend/assets/illustrations/`.
- Keep master at 2048×2048 PNG in a separate asset store (not committed — >MB).
- Update `MANIFEST.md` when a slot is added or its seed changes.
