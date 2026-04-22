# Engineering Day Runbook

Focused checklist for getting Sakina in front of strangers on Engineering Day.
Complements `docs/RELEASE_CHECKLIST.md` (which targets full App Store submission);
this file is the minimum viable public-demo path.

Two install paths are supported:
1. **Self-install** — stranger scans a QR / visits a link and installs the APK (Android)
   or joins TestFlight (iOS) on their own device.
2. **Demo device** — a phone you own has the app pre-installed and signed in, handed
   around the booth.

Both point at the same public backend.

---

## T-minus 7 days

### 1. Pick and configure the public domain

- [ ] Pick a domain (e.g. `sakina.yourname.dev`). Point an A record at the
      production VM's public IP.
- [ ] Fill in `.env` at the repo root:
  - `DOMAIN_NAME=sakina.yourname.dev` (nginx template uses this)
  - `CORS_ORIGIN_0=https://sakina.yourname.dev`
  - `OPENAI_BASE_URL=https://<runpod-pod-id>-11434.proxy.runpod.net/v1/` — required,
    no default, `docker compose up` now fails loudly if missing (B1 fix).
- [ ] `.env` is gitignored — confirm it's not staged (`git status`).

### 2. Rotate secrets

⚠️ The local `.env` currently contains a live-looking OpenAI API key
(`sk-proj-...`) and a live RunPod proxy URL. Neither is in git history, but:

- [ ] **OpenAI key:** revoke it in the OpenAI dashboard. The platform is Llama-only —
      this key should not exist in any environment.
- [ ] **RunPod URL:** the URL is the only access control on the pod. Once you
      deploy the production backend, anyone who grabs it from a packet capture
      can hit your GPU. If the current URL has been shared anywhere, redeploy the
      pod to rotate it (per `AI-service/docs/runpod-setup.md`).

### 3. Deploy the backend

On the production VM:

```bash
git clone <repo> && cd AI-Wellness-Platform
cp .env.example .env && nano .env   # fill every required var

# Bootstrap TLS certs first (one-time)
# See nginx/nginx-bootstrap.conf header for the certbot flow

# Bring up the full stack in production mode
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verify
docker compose ps                    # all services healthy
curl https://$DOMAIN_NAME/api/auth/health  # 200 OK
```

- [ ] Nginx serves the domain over HTTPS (no cert warnings).
- [ ] `docker compose logs auth-service` shows no startup errors.
- [ ] `docker compose logs ai-wrapper-service` shows no
      `InvalidOperationException: OpenAI:BaseUrl is not configured`.
- [ ] No database ports are exposed to the public internet (`netstat -tlnp`
      should show only 80/443 + ssh).

### 4. Warm the RunPod pod

RunPod cold start = 10-30s for the first inference. The frontend now has a
warmup ping at login + "Waking up the model..." hint + 45s chat timeout
(S2 fix), but the experience is still smoother if the pod is already hot
before the demo.

- [ ] SSH to the pod, run `ollama run wellness-chat "hi"` to pin the model
      into VRAM 30 min before the demo.

### 5. Build the demo APK

```bash
cd frontend
# 1. Edit eas.json → demo profile: replace both REPLACE_WITH_PROD_DOMAIN values
#    - EXPO_PUBLIC_API_URL: "https://sakina.yourname.dev"
#    - EXPO_PUBLIC_APP_LINK_HOST: "sakina.yourname.dev"
# 2. Build
eas build --profile demo --platform android
```

- [ ] EAS build succeeds, gives you an `.apk` download URL.
- [ ] APK installs on a test Android device and connects to prod backend.
- [ ] Log in end-to-end: register → 2FA code arrives in <10s → chat responds
      in <20s.

### 6. Build for iOS (if iPhone users want to try)

Options in order of effort:
1. **TestFlight (recommended):** `eas build --profile production --platform ios`
   then `eas submit --platform ios`. Requires filling in `ascAppId` and
   `appleTeamId` in `eas.json` (currently `REPLACE_WITH_APPLE_*`).
2. **Expo Go fallback:** `npx expo start --tunnel` and share the QR.
   Requires the Expo Go app on the user's phone. Works without Apple
   Developer account but is slower and less polished.

### 7. Demo device prep

- [ ] Install APK on the booth Android phone.
- [ ] Pre-create a demo account (not your personal one).
- [ ] Stay logged in — the booth user picks up where the last session ended.
- [ ] Disable auto-lock during the event (Android Settings → Display).
- [ ] Set brightness to max, turn off battery saver, plug in.

---

## T-minus 1 day

- [ ] `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`
      fresh boot on the VM — verify no orphaned state from testing.
- [ ] Full smoke test from a phone that has never seen the app: register,
      verify email, log in, send 3 chat messages, write a journal entry.
- [ ] Check Sentry dashboard — zero unresolved errors in last 24h.
- [ ] QR code generated for the APK download link; print + laminate.
- [ ] QR code for the Privacy Policy URL (`https://$DOMAIN_NAME/privacy`)
      printed as a courtesy.

---

## Day-of

### Morning

- [ ] RunPod pod started and warmed (`ollama run wellness-chat "hi"`).
- [ ] Backend health: `curl https://$DOMAIN_NAME/api/auth/health` → 200.
- [ ] One fresh register → 2FA → chat flow from a phone not used in testing.
- [ ] Sentry dashboard pinned on a laptop — glance every 30 min.
- [ ] `docker compose logs -f --tail=50` running in a terminal so you can
      spot DB errors or 5xx spikes.

### During the demo

- [ ] Tell users "this is a student capstone project, data is stored but
      not shared" — both a courtesy and covers GDPR 6(1)(a) consent.
- [ ] If someone types a crisis message, the in-app CRISIS escalation card
      will render. Don't panic — the feature works. Encourage them to call
      the number on the card if it's real.

### If something breaks

| Symptom | Fast fix |
|---|---|
| Chat hangs > 45s on every request | RunPod pod probably crashed. SSH in, `ollama run wellness-chat "hi"`. If pod itself is down, redeploy and update `OPENAI_BASE_URL`. |
| Login works but 2FA email never arrives | Check `docker compose logs notification-service` — look for `SendMs=` on CodeDeliveryBackgroundService. SMTP provider may be throttling. Fallback: check `security_audit_log` table for the code in DB and read it to the user verbally. |
| "Too many requests" (429) on login | IP rate limit tripped. Rate limits are already relaxed for demo (S3 fix: 30 login/min, 300 req/min). If still tripping, restart auth-service to reset the in-memory counter: `docker compose restart auth-service`. |
| White screen on app open | Error boundary (S5 fix) should catch this with a "Try Again" button. If the boundary itself fails, force-quit the app and reopen. Sentry will have the stack. |
| Database full / out of disk | Run `docker exec chat-db psql -U postgres chatservicedb -c "SELECT count(*) FROM chat_messages;"` to sanity-check row counts. If genuinely full, rotate logs: `docker compose restart`. |

### Rollback

If the demo is actively broken and fixes fail:

```bash
# Stop everything, restore the last known-good backup, come back up.
docker compose down
# restore from ./backups/ latest .sql.gz per AI-service/docs or Database/backup
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Falling back to "the app is unavailable, here's a screen-recording video
instead" is an acceptable demo outcome. Don't burn an hour debugging live.

---

## After the demo

- [ ] Export Sentry error list — file issues for anything new.
- [ ] Export a list of registered emails so you can send a thank-you /
      consent-to-continue email (GDPR — you collected their email, tell them
      why and let them delete).
- [ ] Wipe demo account passwords if any were written on paper at the booth.
- [ ] `docker compose -f docker-compose.prod.yml down` if the event is over
      and you don't need the backend live overnight (saves VM cost).

---

## Quick reference: files touched by pre-demo hardening

All changes from the Engineering Day prep pass:

| Fix | Files |
|---|---|
| B1 — fail-fast on missing `OPENAI_BASE_URL` | `docker-compose.yml:244`, `AI-Wrapper-Service/AIWrapperService/Services/OpenAIChatService.cs:82` |
| B2/B3 — production compose + templated nginx | `docker-compose.prod.yml` (new), `docker-compose.dev.yml` (renamed from override), `nginx/templates/default.conf.template` (new), `docker-compose.yml` (nginx mount), `.env.example` |
| B4 — demo EAS profile | `frontend/eas.json` (new `demo` profile + DEV_MODE=false everywhere) |
| S1 — async email queue | `notification-service/.../Services/CodeDeliveryQueue.cs` (new), `.../BackgroundServices/CodeDeliveryBackgroundService.cs` (new), `Program.cs`, `Controller/NotificationCodeController.cs`, `Services/CodeDeliveryService.cs` (10s SMTP timeout), `auth-service/Program.cs` (5s HttpClient timeout) |
| S2 — model warmup + chat timeout | `frontend/src/services/api.js`, `frontend/src/services/chatApi.js` (+ `warmup()`), `frontend/App.js` (warmup on login), `frontend/src/screens/v2/chat/AIChatScreen.js` (5s "Waking up…" hint) |
| S3/S4 — demo-friendly rate limits + CORS | `auth-service/appsettings.json` |
| S5/S6 — error boundary + DEV_MODE lockdown | `frontend/src/components/ErrorBoundary.js` (new), `frontend/App.js` (wrap), `frontend/src/config/index.js` (force-override in prod), `frontend/src/services/sentry.js` (+ `captureException`), `frontend/eas.json` |
