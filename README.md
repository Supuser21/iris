# Iris

Your personal AI executive assistant — reminders, tasks, morning briefs, and natural SMS/web chat.

## Quick start

```bash
npm install
cp .env.example .env.local
# Add OPENROUTER_API_KEY for full AI chat
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Dev mode (no Twilio)

Set `DEV_OTP_MODE=true` in `.env.local`. Sign up with any phone — OTP is always `123456` (shown on screen).

### Full setup

1. **OpenRouter** — [openrouter.ai/keys](https://openrouter.ai/keys) → `OPENROUTER_API_KEY`
2. **Twilio** — buy a number, set SID/token/number, webhook `POST /api/sms/inbound`
3. **Google Calendar** — OAuth client, redirect `http://localhost:3000/api/auth/google/callback`
4. **Deploy** — Vercel + `CRON_SECRET` for `/api/cron/process` (every 5 min)

## Routes

| Route | Description |
|-------|-------------|
| `/` | Marketing landing |
| `/signup` | Phone OTP signup |
| `/chat` | Web chat with Iris |
| `/settings` | Calendar, timezone, morning brief |

## Features

- Custom reminders (SMS when due)
- Tasks and long-term memory
- Optional Google Calendar + morning brief
- Conversational onboarding (birthday demo)
- Two-way SMS via Twilio
- Free beta (Stripe coming later)
