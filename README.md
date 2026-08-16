# Iris

Iris is an AI assistant for construction teams. It turns job notes and meeting
transcripts into previewable crew texts, sends approved recaps over SMS, and
keeps replies on the right job.

The commercial offer is **$4,000/month** for Iris, a tool-building chat, and
implementation sprints.

## Product loop

1. Create a job.
2. Add crew with US phone numbers.
3. Upload notes, PDFs, images, or meeting transcripts.
4. Iris drafts a recap and suggests recipients.
5. The PM previews the message and sends.
6. Crew replies by SMS; replies stay on the job.

## Quick start

```bash
npm install
cp .env.example .env.local
# Add DATABASE_URL (Neon) and OPENROUTER_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Set `DEV_OTP_MODE=true` locally. OTP is always `123456` in dev mode.

## Required production setup

1. **Neon Postgres** — `DATABASE_URL`.
2. **OpenRouter** — `OPENROUTER_API_KEY`.
3. **SMS** — `SMS_PROVIDER` plus provider credentials.
4. **Cron secret** — `CRON_SECRET`.
5. **External 5-minute scheduler on Hobby** — required for timely reminders.

Vercel Hobby only supports daily cron schedules. Keep [`vercel.json`](vercel.json)
on `0 13 * * *` so deploys succeed, then add an external scheduler:

```text
GET https://talkwithiris.xyz/api/cron/process
Authorization: Bearer <CRON_SECRET>
Frequency: every 5 minutes
```

[cron-job.org](https://cron-job.org) works for this. Iris also runs due work
opportunistically when chat or inbound SMS traffic comes in, but the external
scheduler is the reliable reminder path.

## SMS

Set `SMS_PROVIDER` to `pingram`, `twilio`, or `telnyx`.

**Pingram**

1. Create an SMS notification, or use `iris_sms`.
2. Webhook URL: `https://talkwithiris.xyz/api/sms/inbound`.
3. Enable `SMS_INBOUND`.
4. Vercel env: `SMS_PROVIDER=pingram`, `PINGRAM_API_KEY`,
   `PINGRAM_NOTIFICATION_TYPE=iris_sms`, `DEV_OTP_MODE=false`.

Pingram replies are only forwarded when crew reply within **7 days** of the last
Iris outbound text to that phone number.

**Compliance:** STOP, START, and HELP are handled. Crew/user opt-out is stored.

## Connectors

The UI has request-only stubs for Telegram, Microsoft Teams, Procore, Email,
Google Drive, and Stripe. They do not run OAuth yet. A requested connector marks
what should be enabled in a future implementation sprint.

## Health check

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://talkwithiris.xyz/api/health/sms
```

Returns SMS/OpenRouter/env status plus `lastCronAt` for the current server
instance.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Marketing landing |
| `/signup` | Phone OTP signup |
| `/chat` | Web chat with Iris |
| `/jobs` | Job workspace home |
| `/jobs/[id]` | Crew, docs, meeting drafts, sends, replies |
| `/settings` | Calendar, briefs, team access, connector requests |
| `/api/cron/process` | Due reminders + morning briefs |
| `/api/health/sms` | SMS/cron env checklist |
