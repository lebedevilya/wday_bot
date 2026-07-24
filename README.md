# wday — Ilya ♥ Aigul wedding game

Telegram-bot guest game + live photo wall. See `PLAN.md` for design, `TODO.md` for progress.

## Setup

1. Create a free Supabase project. In the SQL editor run `supabase/schema.sql`, then `supabase/seed.sql`.
2. Create a bot via @BotFather, get the token.
3. Get a Gemini API key at https://aistudio.google.com.
4. `cp .env.example .env.local` and fill everything in.
5. `npm install`

## Develop

```bash
npm run dev   # web: http://localhost:3000 (wall) + /admin
npm run bot   # Telegram bot via long-polling (no tunnel needed)
```

## Deploy

```bash
vercel --prod          # set the same env vars in Vercel first
npm run webhook        # switch the bot from polling to the deployed webhook
```

QR code for guests: link to `https://t.me/<your_bot>?start=join`.
