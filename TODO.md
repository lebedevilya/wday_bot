# TODO — wday build progress

Mark `[x]` as completed. If we stop, resume from first unchecked item.

## M1 — Foundation
- [x] Scaffold Next.js (TS, App Router, Tailwind)
- [x] Install deps: grammy, @supabase/supabase-js, sharp, @google/genai
- [x] PLAN.md / TODO.md
- [x] supabase/schema.sql (tables, indexes)
- [x] supabase/seed.sql (task pool ru/en/kk, sample guests, settings)
- [x] .env.example
- [x] lib/db.ts (service client), lib/types.ts

## M2 — Bot core
- [x] lib/i18n.ts (bot strings ru/en/kk)
- [x] lib/bot.ts: /start → locale → name pick → pair pick → playing
- [x] lib/game.ts: task assignment (core load-balanced + cross-group person tasks, lazy top-up)
- [x] Task list + score commands
- [x] app/api/bot/route.ts webhook + scripts/dev-bot.ts long-polling + set-webhook.ts

## M3 — Photos + AI
- [x] lib/images.ts: download from Telegram → sharp compress → Supabase Storage
- [x] lib/verify.ts: Gemini 2.5 Flash verdict (lenient, error → approve)
- [x] Submit-photo flow: pending task state → verdict → points → reply
- [x] Free photo upload + wishes flow

## M4 — Public site (impeccable design: dusk-indigo, amber accent, Unbounded+Onest)
- [x] `/` photo wall + wishes + leaderboard, 10s polling, RU/EN/KK toggle
- [x] TV-friendly layout (verified in browser: header, empty state, lang switch)

## M5 — Admin
- [x] Secret login (cookie)
- [x] Guests CRUD + reference photo upload + status/group toggles + unbind-telegram fix
- [x] Task templates CRUD
- [x] Submissions queue (approve/reject with point revoke, hide wall photos)
- [x] Prize tiers editor (JSON settings tab)
- [ ] (skipped for now) dedicated teams merge UI — unbind + rejoin covers it

## M6 — Ship
- [x] QR deep-link (t.me/BOT?start=join — bot handles any /start payload)
- [x] scripts/set-webhook.ts (`npm run webhook`)
- [x] README.md quick-start
- [ ] Fill .env.local with real creds, run schema.sql + seed.sql in Supabase
- [ ] Local end-to-end test with real bot (npm run bot + npm run dev)
- [ ] Vercel deploy + env vars + npm run webhook
- [ ] Seed real guest list + reference photos via /admin
- [ ] Attach custom domain **wday.ilyalebe.dev** (Vercel project → Domains → add wday.ilyalebe.dev, add CNAME `wday` → cname.vercel-dns.com in ilyalebe.dev DNS; update NEXT_PUBLIC_SITE_URL + re-run `npm run webhook`)
- [ ] Dry run with test account end-to-end

## Blocked on Ilya
- [ ] Supabase project → SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- [ ] @BotFather token → TELEGRAM_BOT_TOKEN
- [ ] Google AI Studio key → GEMINI_API_KEY
- [ ] Vercel account link
