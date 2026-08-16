# Iris

Your personal AI executive assistant — reminders, tasks, morning briefs, and natural SMS/web chat.

## Database (Neon — free)

Iris uses **Neon Postgres** (free tier, works on Vercel). Not Supabase — simpler for this stack.

1. Go to [neon.tech](https://neon.tech) → sign up → **New project** (e.g. `iris`)
2. Copy the **connection string** (use the pooled `postgresql://...` URL)
3. Add to `.env.local`:
   ```bash
   DATABASE_URL=postgresql://...
   ```
4. Create tables (first time only):
   ```bash
   npm run db:push
   ```
   Or just run the app — tables auto-create on first API request.

**On Vercel:** Project → Settings → Environment Variables → add `DATABASE_URL` (same Neon URL) for Production + Preview.

Neon free tier is enough for beta (storage + compute limits apply).

## Quick start

```bash
npm install
cp .env.example .env.local
# Add DATABASE_URL (Neon) and OPENROUTER_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Dev mode (no Twilio)

Set `DEV_OTP_MODE=true` in `.env.local`. Sign up with any phone — OTP is always `123456` (shown on screen).

### Full setup

1. **Neon** — `DATABASE_URL` (see above)
2. **OpenRouter** — [openrouter.ai/keys](https://openrouter.ai/keys) → `OPENROUTER_API_KEY`
3. **Web search** — included with `OPENROUTER_API_KEY` (OpenRouter `web_search` tool; extra cost per search on your OpenRouter balance)
4. **SMS** — see [SMS setup](#sms-pingram-twilio-or-telnyx) below
5. **Google Calendar** (optional) — [Google Cloud Console](https://console.cloud.google.com/) OAuth client; redirect URI `https://your-domain/api/auth/google/callback`; env `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
6. **Deploy** — Vercel + `CRON_SECRET` (see [Cron & reminders](#cron--reminders) below)

### SMS (Pingram, Twilio, or Telnyx)

Set `SMS_PROVIDER` to one of `pingram`, `twilio`, or `telnyx`.

**Pingram (recommended)** — [pingram.io](https://pingram.io)

1. Dashboard → create an SMS notification (or use type `iris_sms` — created on first send)
2. **Webhook** → URL `https://talkwithiris.xyz/api/sms/inbound` → enable **`SMS_INBOUND`**
3. Vercel env: `SMS_PROVIDER=pingram`, `PINGRAM_API_KEY=pingram_sk_...`, `PINGRAM_NOTIFICATION_TYPE=iris_sms`, `DEV_OTP_MODE=false`
4. Free tier sends from **+1 650 509 3842** unless you add a dedicated number

Inbound replies are forwarded when users **reply within 7 days** of your last outbound SMS to that number.

**Twilio**

- Avoid **855 toll-free** for MVP — toll-free SMS verification often takes **10–15 days**. When your account is approved, buy a **local US 10-digit** number instead.
- [Verify your personal phone](https://console.twilio.com/us1/develop/phone-numbers/manage/verified) — trial accounts can only text verified numbers until approval finishes.
- Webhook: `POST https://talkwithiris.xyz/api/sms/inbound` on your number.
- Env: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `SMS_PROVIDER=twilio`, then `DEV_OTP_MODE=false`.

**Telnyx (faster path for some teams)** — [telnyx.com](https://telnyx.com)

1. Sign up → Messaging → buy a **local US** number
2. API key → `TELNYX_API_KEY`, number → `TELNYX_PHONE_NUMBER`
3. Messaging Profile → webhook URL: same `/api/sms/inbound` (Telnyx sends JSON; Iris handles it)
4. Vercel: `SMS_PROVIDER=telnyx`, `DEV_OTP_MODE=false`, redeploy

You can run **only one** provider in production (`SMS_PROVIDER`).

### SMS troubleshooting

| Symptom | Check |
|---------|--------|
| No reply to texts | Pingram webhook URL + **`SMS_INBOUND`**; Vercel logs on `/api/sms/inbound` |
| OTP works, chat doesn't | `OPENROUTER_API_KEY`; not `DEV_OTP_MODE=true` in production |
| Logs show `[SMS dev]` | `SMS_PROVIDER` + provider API keys not set on Vercel |
| Cold text, no webhook | Pingram only forwards replies **within 7 days** of your last outbound to that number |
| User texted STOP | Reply **START** to opt back in |

**Health check** (requires `CRON_SECRET`):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://talkwithiris.xyz/api/health/sms
```

Returns env checklist (no secrets). Fix any listed `issues` before debugging further.

**Compliance:** Users can text **STOP**, **START**, or **HELP**. Opt-out is stored on the user record; transactional OTP still sends.

## Cron & reminders

Reminders and morning briefs run from `GET /api/cron/process` (authorized with `Authorization: Bearer CRON_SECRET`).

- **Vercel cron** ([`vercel.json`](vercel.json)): `0 13 * * *` (once daily, Hobby-compatible). Frequent crons fail the Hobby deploy.
- **External scheduler (recommended on Hobby):** [cron-job.org](https://cron-job.org) or similar → `GET https://talkwithiris.xyz/api/cron/process` every **5 minutes** with header `Authorization: Bearer <CRON_SECRET>`.

Response includes `ranAt`, `remindersSent`, and `briefsSent` for monitoring.

## Live site

https://talkwithiris.xyz

## GitHub

https://github.com/Supuser21/iris

## Routes

| Route | Description |
|-------|-------------|
| `/` | Marketing landing |
| `/signup` | Phone OTP signup |
| `/chat` | Web chat with Iris |
| `/settings` | Google Calendar, timezone, morning brief |
| `/api/health/sms` | SMS/cron env checklist (Bearer `CRON_SECRET`) |
| `/api/cron/process` | Due reminders + morning briefs (Bearer `CRON_SECRET`) |
