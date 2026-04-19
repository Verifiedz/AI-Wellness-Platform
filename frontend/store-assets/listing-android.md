# Google Play Console — Sakina listing copy

Paste this into **Play Console → Sakina → Main store listing** before every
submission. Play Console fields are shorter than Apple's; the same canonical
copy from `listing-ios.md` has been trimmed here to fit.

---

## App name (30 characters max)

```
Sakina — Mindful Wellness
```

## Short description (80 characters max)

```
Journal your mood, reflect with an AI companion, and grow in a calm community.
```

## Full description (4000 characters max)

```
Sakina is a quiet space for mindful wellness. It gives you a place to notice
how you're feeling, think it through with a supportive AI companion, and stay
connected to a small community that's doing the same work.

What you can do with Sakina:

• Keep a private journal with mood, emotions, and energy tracking. See
  patterns emerge across weeks without the spreadsheets.

• Talk it through. The AI companion listens and reflects — it does not
  diagnose — and it remembers your recent sessions so conversations
  continue where you left off.

• Join small, moderated community groups around sleep, study stress, or
  general check-ins. You choose what to share; you can block or report
  anything that feels off.

• Receive a daily wellness tip from a library of 160+ prompts across
  sleep, nutrition, mindfulness, study, movement, organization, and
  social connection.

• Export your data anytime. Delete your account from inside the app. Every
  notification is opt-in and configurable.

Sakina is not a medical device and does not replace professional care. If
you're in crisis, please reach out to a local support line or emergency
services — the Help & Support screen lists hotlines for common regions.

Privacy first:
• Journal entries and chat messages are encrypted at rest on our servers.
• We don't sell your data and don't track you across other apps or sites.
• Full privacy policy: https://sakina.example.com/privacy
```

## Categorization

- **App category**: Health & Fitness
- **Tags**: Mindfulness, Self-improvement, Wellness

## Contact details

- **Website**: `https://sakina.example.com`
- **Email**: `support@sakina.example.com`
- **Phone**: (optional)

## Privacy Policy

```
https://sakina.example.com/privacy
```

---

## Content rating questionnaire

Play uses the IARC questionnaire. Expected answers:

| Area                                          | Answer |
| --------------------------------------------- | ------ |
| Violence                                      | None |
| Sexual content                                | None |
| Language                                      | None |
| Controlled substance                          | None |
| Gambling                                      | None |
| User interaction (chat, forum, sharing)       | **Yes** — community groups + direct content sharing are moderated. |
| Shares user's location                        | No |
| Allows users to buy digital goods             | No |
| Features that facilitate meeting new people   | Yes (community groups, moderated) |

Expected rating: **IARC 12+** (parallels Apple's 12+). Confirm after Google
processes the questionnaire.

## Data safety

See `../../docs/APP_STORE_PRIVACY.md` §5 for the matching answer sheet.

## Countries / pricing

- **Price**: Free
- **Ads**: No
- **Countries**: Start with the default global rollout minus any restricted
  markets; limit to EN-speaking regions for the first two weeks of TestFlight
  parity so support can keep up.

## Pre-launch report

Leave enabled. Robo-test crash reports should land zero before a production
release — if the pre-launch report flags anything, treat it as a blocker.

## Release notes ("What's new")

```
• First public release
• Journal with mood + emotion tracking
• Reflective AI chat companion
• Moderated community groups
• Daily wellness tips and optional reminders
• In-app account deletion + data export
```
