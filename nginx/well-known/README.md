# Universal Links / App Links (`/.well-known`)

This directory is mounted into the nginx container at
`/etc/nginx/well-known` and surfaces two files over HTTPS:

| URL                                     | File                          | Purpose                                 |
| --------------------------------------- | ----------------------------- | --------------------------------------- |
| `/.well-known/apple-app-site-association` | `apple-app-site-association`  | iOS Universal Links, Shared Web Creds   |
| `/.well-known/assetlinks.json`            | `assetlinks.json`             | Android App Links                       |

## iOS — `apple-app-site-association`

The current file is a template. Before shipping:

1. Open https://developer.apple.com/account → Membership → copy your Team ID
   (10-character alphanumeric, e.g. `A1B2C3D4E5`).
2. Replace **every** occurrence of `TEAMID` in the `appIDs` / `webcredentials`
   arrays with that value. The resulting entry looks like
   `"A1B2C3D4E5.com.sakina.app"`.
3. The file MUST:
   * be served at exactly `/.well-known/apple-app-site-association` (no
     `.json` extension),
   * have `Content-Type: application/json`,
   * be reachable over HTTPS with no redirects (our nginx block is already
     a `location =` exact match so this holds),
   * be under 128 KB.
4. After deploy, validate with
   `curl -sI https://<domain>/.well-known/apple-app-site-association`
   and then Apple's AASA validator at
   https://branch.io/resources/aasa-validator/.
5. Declare the associated domain in `frontend/app.config.js`:

   ```js
   ios: {
     bundleIdentifier: 'com.sakina.app',
     associatedDomains: ['applinks:<domain>', 'webcredentials:<domain>'],
   }
   ```

   That entry is added under `ios` as `associatedDomains`; Expo adds the
   `com.apple.developer.associated-domains` entitlement for you at build
   time.

## Android — `assetlinks.json`

The current file references two SHA-256 fingerprint placeholders. Android
requires **both**:

1. Your **upload key** fingerprint (the keystore EAS/Gradle used to sign
   the AAB before uploading to Play):

   ```bash
   keytool -list -v -keystore upload.keystore -alias upload \
       | grep 'SHA256:' | head -n1
   ```

2. The **Play App Signing key** fingerprint that Google re-signs with after
   upload. Find it in Play Console → "App integrity" → "App signing". Copy
   the SHA-256 exactly as shown, keep the colons.

Replace the two `REPLACE_WITH_*` strings above with those values. Keep
both entries: App Links verification only succeeds if the running binary's
certificate matches one of them, and Play rotates between upload and
signing keys.

After deploy, validate with:

```bash
curl -s https://<domain>/.well-known/assetlinks.json | jq .
# then Google's verifier:
# https://developers.google.com/digital-asset-links/tools/generator
```

And declare the link capture in `app.config.js`:

```js
android: {
  package: 'com.sakina.app',
  intentFilters: [
    {
      action: 'VIEW',
      autoVerify: true,
      data: [{ scheme: 'https', host: '<domain>', pathPrefix: '/' }],
      category: ['BROWSABLE', 'DEFAULT'],
    },
  ],
},
```

## CI reminder

Both files are served by nginx from a read-only bind mount
(`docker-compose.yml` → `nginx:volumes`). A change to either file requires
a container restart or `docker compose exec nginx nginx -s reload` before
Apple / Google's verifiers will pick it up.
