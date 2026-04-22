# Copy principles (empathy-first)

Aligned with trust-first mental health UX: validating language, low shame, clear consent.

## Avoid (user-facing strings)

Do not use these in UI copy shown to users: **streak**, **missed**, **broken**, **lost**, **failed** (when ascribed to user behavior), **skipped** (in a blaming sense).

The antipattern script flags common cases in `src/screens`, `src/components`, and `src/constants`. System-level failures (e.g. "Couldn't load") may use neutral verbs — the ban targets retention-shame language, not technical feedback.

## Replacement vocabulary

| Avoid                              | Prefer                                                          |
| ---------------------------------- | --------------------------------------------------------------- |
| `Day Streak` / `5 day streak`      | `Recent days` / `You've returned 5 of the last 10 days`         |
| `You missed yesterday`             | `Welcome back. Want to pick up where you left off?`             |
| `Streak broken`                    | (remove entirely — never surface this state to users)           |
| `You failed the assessment`        | `Your results`                                                  |
| `You lost progress`                | `Your shelf only grows — never shrinks.`                        |
| `Failed to save journal`           | `Couldn't save your journal just yet. Tap Retry.`               |
| `Skipped today`                    | `Paused today — that's a valid move.`                           |

## System errors vs behavioral shame

- **OK:** `"Couldn't load the dashboard"`, `"No internet connection"`, `"Couldn't save — retry?"` — these describe the system, not the user.
- **NOT OK:** `"You missed today"`, `"Your streak is broken"`, `"You failed to check in"`.

If the copy implies a flaw in the user's behavior or character, rewrite it to describe the system's state instead.

## Prefer

- **Rhythm over streaks:** "You've returned 5 of the last 10 days. Every bit helps."
- **Keys:** "Each moment you return, you pick up another." (when keys economy is on)
- **Normalize:** "It's okay to feel this way." / "No wrong answer — just a read on the moment."
- **Agency:** "When you're ready", "If it helps", optional paths for voice vs type.

## Crisis & safety

- Crisis resources: factual, local, never paywalled; short labels on buttons ("Call", "Breathe now").
- Assessments: keep clinical disclaimers from product/legal unchanged where required.
- Never animate the crisis lantern (see `LANTERN.md`).

## Voice & privacy

- First use of voice: short notice — where audio is processed, retention, and how to delete.
- Privacy as a promise, not a legal wall — see `frontend/src/screens/onboarding/PrivacyPromiseScreen.js`.

## Notification copy framing

- Reframe any "reminder" pitch as a "gentle nudge, never pressure."
- No streak-maintenance prompts. No "don't break the chain."
- Default to opt-out language: "Turn off any time from Settings."
