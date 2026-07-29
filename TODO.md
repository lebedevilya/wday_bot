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

## M7 — Web version (many Kazakh guests have no Telegram)
- [x] Drop `teams`: a pair is one guest row ("Медет + Акмарал"); points live on guests (migration 003)
- [x] Remove pair flow from the bot (one less screen for everyone)
- [x] `/play` — mobile browser version: name pick → cookie session → tasks → native camera submit → verify → points
- [x] Wish + free wall photo from the browser
- [x] `lib/images.ts`: shared upload helper; browser uploads capped at 1600px webp (Telegram compresses its own)
- [x] Link to `/play` from the invitation footer
- [ ] WhatsApp bot — **skipped on purpose**: needs a dedicated phone number + Meta business verification,
      weaker UI (3 buttons / 10-row lists) and buys nothing over `/play`. Game core is adapter-ready
      (`lib/game.ts` + `lib/verify.ts`) if this ever changes.

## M8 — RSVP as self-registration (Aigul's feedback)
- [x] Schedule moved to 17:00 / 19:00 / 19:30 / 22:00 / 23:00 afterparty
- [x] RSVP: guests type their own name instead of picking from a list (creates the guest row)
- [x] Alone / with-a-pair (pair becomes one row "Медет + Акмарал") + optional kids count
- [x] Guest uploads their own photo with a square crop tool — this IS the AI reference photo
- [x] Optional approximate arrival time
- [x] "Add to Google Calendar" + "Subscribe to the bot" on the thank-you screen
- [x] Game hidden until the day: `game_public` flag gates /play, /wall, both game APIs and the bot
- [ ] **On 8 August: set `game_public` to true** in admin → Settings (one JSON edit) to open the game
- [ ] Assign real groups to self-registered guests (they arrive as `grp = unknown`)

## M6 — Ship
- [x] QR deep-link (t.me/BOT?start=join — bot handles any /start payload)
- [x] scripts/set-webhook.ts (`npm run webhook`)
- [x] README.md quick-start
- [x] Fill .env.local with real creds, run schema.sql + seed.sql in Supabase
- [x] Local end-to-end test with real bot (join → task → photo → Gemini approve → wall)
- [x] Vercel deploy (https://wday-tau.vercel.app) + env vars + webhook set
- [x] Light white-pink redesign (Comfortaa + Onest, dusty-rose accent)
- [x] Real venue: Tau Resort, ул. Жамбыла Жабаева 21, с. Бескайнар, Талгарский р-н (2GIS link in lib/event.ts)
- [ ] Seed real guest list + reference photos via /admin (mark non-players who should appear in photo tasks as **target**)
- [ ] Attach custom domain **wday.ilyalebe.dev** (Vercel project → Domains → add wday.ilyalebe.dev, add CNAME `wday` → cname.vercel-dns.com in ilyalebe.dev DNS; update NEXT_PUBLIC_SITE_URL + re-run `npm run webhook`)
- [ ] Dry run with test account end-to-end (both Telegram and /play)
- [ ] Print ONE QR pointing at /play (it links onward to the bot for Telegram users)

## Blocked on Ilya
- [ ] Supabase project → SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- [ ] @BotFather token → TELEGRAM_BOT_TOKEN
- [x] ~~Google AI Studio key~~ → now OPENAI_API_KEY (set in Vercel production + development; preview env refused via CLI, add in dashboard if preview deploys ever matter)
- [ ] Vercel account link
- [x] ~~Gemini credits depleted~~ → switched verification to OpenAI `gpt-5.4-mini` (measured ~$0.40 for the whole event; $3 balance is ample). Gemini dropped entirely.
