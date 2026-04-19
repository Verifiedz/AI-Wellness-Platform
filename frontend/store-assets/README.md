# Store Assets — Sakina

Everything the App Store and Play Store need from the marketing/art side
lives here. Code changes to the app itself belong in `../src/`; this folder is
only the stuff the submission forms ask for.

```
store-assets/
  README.md              ← this file
  listing-ios.md         ← App Store Connect copy, word-for-word
  listing-android.md     ← Play Console copy, word-for-word
  keywords.md            ← ASO keyword research notes
  screenshots/           ← populate with captured images (see below)
    ios/6.5/             ← iPhone 6.5" (1284×2778) — required
    ios/6.7/             ← iPhone 6.7" (1290×2796) — required
    ios/ipad-13/         ← iPad Pro 13" (2064×2752) — required if iPad build ships
    android/phone/       ← 1080×1920 or larger — at least 2 required
    android/tablet-7/    ← 1200×1920 — optional but recommended
    android/tablet-10/   ← 1600×2560 — optional but recommended
  feature-graphic.png    ← Play Store 1024×500 banner
  app-icon-1024.png      ← App Store 1024×1024 icon (no alpha)
```

## 1. Capturing screenshots

Apple and Google reject marketing-only mockups for screenshots. Capture from a
real running build:

```bash
# iOS (iPhone 15 Pro Max simulator covers the 6.7" requirement)
xcrun simctl boot "iPhone 15 Pro Max"
open -a Simulator
# inside the sim: Command+S to save a screenshot to the Desktop

# Android (Pixel 7 Pro emulator in Android Studio)
# With the emulator running:
adb exec-out screencap -p > screenshots/android/phone/01-home.png
```

Required flows (both platforms, in order):

1. **Home / Daily tip** — the empty-ish wellness dashboard.
2. **Journal entry** — a filled-out entry showing mood + reflection.
3. **Chat** — a short conversation with the assistant.
4. **Community** — a group feed with a couple of posts.
5. **Insights** — the pattern-analysis chart screen.

Use the same seeded demo account across every shot so dates/avatars stay
consistent. Dummy content must be benign and on-message — no real user PII and
no text that implies medical advice.

## 2. App icon

- Export `frontend/assets/icon.png` at 1024×1024, RGB, no alpha, no rounded
  corners (Apple and Google add those themselves).
- Keep it identical to the icon shipped in the binary.

## 3. Feature graphic (Play only)

Play requires a 1024×500 PNG/JPG. Do not embed screenshots or device frames
— Google auto-frames phones in carousels. Stick to the logo + tagline on a
solid brand background.

## 4. What happens next

1. Fill `listing-ios.md` and `listing-android.md` before submission — they're
   the canonical source for the text you paste into App Store Connect and
   Play Console.
2. Screenshots + icon + feature graphic get uploaded through the respective
   consoles, not through EAS. EAS only submits the binary.
3. Keep this folder in version control so any team member can resubmit from
   the same assets if something gets rejected.
