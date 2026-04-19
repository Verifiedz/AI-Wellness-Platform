# ASO keyword notes

Apple gives you one 100-character comma-separated field for keywords; Google
extracts keywords from the full description. Changes here should land in
both `listing-ios.md` and `listing-android.md` (description body) in the same
commit.

## iOS (Apple Search Ads) — `keywords` field

Current string (99 characters, no spaces — that's deliberate, spaces
waste characters):

```
wellness,journal,mindful,mood,mental,meditate,anxiety,sleep,habit,calm,therapy,self,care,growth
```

Notes:

- Apple already indexes your app name, subtitle, and category so there's no
  point repeating "Sakina" or "health" here.
- Avoid trademarks (Calm, Headspace). Apple will pull the binary if they
  catch us using a competitor's name.
- Plural/singular and compound variants are handled by Apple's search engine
  — just use the root.
- "therapy" is risky if App Review decides our disclaimer isn't loud enough;
  swap to "reflection" if that comes back as rejection feedback.

## Play — keyword mining

Google uses the full description. The `listing-android.md` copy was written
to hit these phrases at least once, organically:

- `wellness journal`
- `mood tracker`
- `mindful journal`
- `AI companion` / `AI wellness chat`
- `journaling app`
- `mental wellness community`
- `daily wellness tips`
- `sleep journal`
- `self-care`

Every major update is a chance to re-run Google Play Console's "acquisition
reports" and adjust the description. Keep these notes in sync.
