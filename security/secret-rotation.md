# Secret Rotation Runbook

This runbook is the concrete execution of decision `SEC-ADV-03` (rotate-only,
no history rewrite). It lists every secret the repo or its deploy
configuration has ever touched, a generation recipe, and the rotation
checklist to mark the rotation as complete.

> Run through this document **top-to-bottom** the first time you deploy.
> Tick every box. Unticked rows are known-compromised and must be treated
> as public.

## Generation recipes

| Kind                          | Recipe                                                       |
| ----------------------------- | ------------------------------------------------------------ |
| Postgres / Redis password     | `openssl rand -base64 32`                                    |
| Internal service API key      | `openssl rand -hex 32`                                       |
| JWT signing key (HS256)       | `openssl rand -base64 48` (min 256 bits)                     |
| Generic random secret         | `python -c "import secrets;print(secrets.token_urlsafe(40))"` |

Always copy the freshly generated value straight into your secret manager
(1Password, Doppler, AWS Secrets Manager, GitHub Actions secret). Do not
paste it into Slack, Notion, an email, or a commit message.

## Secrets to rotate

### Previously leaked (hard-required before App Store submission)

- [ ] `COMMUNITY_DB_PASSWORD`
      Was committed as the literal string `postgres`.
      Rotate via `ALTER USER postgres WITH PASSWORD '<new>';` on the
      community database, then update `.env` and every deploy target.

- [ ] `OPENAI_BASE_URL`
      Was committed as a RunPod proxy URL.
      Action: do **not** re-use the RunPod endpoint. Point every
      deployment at `https://api.openai.com/v1/` (or the approved hosted
      LLM provider). The URL itself is not a credential, but it exposed
      our infra provider — rotate the downstream RunPod pod if it still
      exists.

### Application-level secrets (rotate on a schedule, and **now** because
the deploy predates App Store submission)

- [ ] `AUTH_DB_PASSWORD`
- [ ] `CHAT_DB_PASSWORD`
- [ ] `JOURNAL_DB_PASSWORD`
- [ ] `NOTIFICATION_DB_PASSWORD`
- [ ] `REDIS_PASSWORD` — coordinate: used by auth / chat / AI-wrapper /
      journal for both rate limiting and data-protection key rings.
      Rotating this forces a restart of every service that touches Redis.
- [ ] `JWT_KEY` — rotating invalidates every currently-signed access
      token. Plan the rotation for a low-traffic window and surface a
      single "please sign in again" banner on the frontend.

### Service-to-service API keys (rotate together as a set — each matching
pair must change at the same moment)

- [ ] `NOTIFICATION_INTERNAL_API_KEY`
- [ ] `JOURNAL_INTERNAL_API_KEY`
- [ ] `COMMUNITY_INTERNAL_API_KEY`
- [ ] `CHAT_INTERNAL_API_KEY`
- [ ] `AI_INTERNAL_API_KEY`

### Third-party secrets (rotate in the vendor console, then update `.env`)

- [ ] `OPENAI_API_KEY` — revoke the old key in the OpenAI dashboard.
- [ ] `SENDGRID_API_KEY` — revoke the old key in the SendGrid dashboard.
- [ ] `EXPO_PUBLIC_SENTRY_DSN` and every `SENTRY_DSN_*` — rotate by
      regenerating the DSN in Sentry if you suspect leakage; otherwise
      leave as-is (DSNs are intentionally public-ish but abuse-prone).
- [ ] Firebase service account JSON — if `Firebase__ServiceAccountPath`
      is configured, generate a fresh key in the Google Cloud console and
      delete the old one.

## Rotation procedure (per secret)

1. Generate a fresh value with the recipe above.
2. Store the new value in the secret manager; make sure at least one
   non-you teammate can recover it.
3. Update the target system first (Postgres `ALTER USER`, SendGrid key,
   etc.), then update `.env` / deploy config second. Doing it in this
   order avoids a window where both old and new secrets are valid.
4. Re-deploy the services that consume the secret.
5. Tail logs for ~15 minutes and watch for auth errors from any client
   still holding the old value.
6. Tick the checkbox above and commit the update to the rotation log at
   the bottom of this file.

## Preventing recurrence

* **Pre-commit scanner**: `gitleaks` runs locally via the pre-commit hook
  defined at `.github/hooks/pre-commit-gitleaks`.
* **CI scanner**: `gitleaks` runs on every PR in `ci.yml`. Any finding is
  a blocking failure — the author must rotate and repush.
* **Secrets layout**: production secrets live in the deploy target's
  secret store (GitHub Actions secrets or the VM-level `/etc/sakina/*.env`
  files referenced by the backup runbook). They never touch the repo.

## Rotation log

Append one line per rotation event: `<date>  <secret>  <operator>  <ticket>`.

```
2026-04-18  (initial rotation gate opened)             sec-ops  SEC-ADV-03
```
