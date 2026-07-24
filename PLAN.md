# Wedding Day Guest Game — "wday"

## Context

Ilya + Aigul wedding, August 2026, ~40-50 guests (~20 kids). Goal: gamified ice-breaker during the ~2h pre-ceremony window. Guests join via QR → Telegram bot, receive photo tasks ("take a picture with X"), earn points, redeem plush-toy prizes by tier. Live public website shows all photos, wishes, and leaderboard as the day unfolds — becomes the permanent photo archive afterwards.

Guests belong to **groups**: `kids`, `aigul_family`, `aigul_friends`, `ilya_family`, `ilya_friends`. Person-tasks prefer targets from a *different* group than the player's, so groups mix (any cross-group match is fine).

## Decisions

| Decision | Choice |
|---|---|
| Stack | Next.js (App Router, TypeScript) on Vercel Hobby |
| DB/Storage | Supabase free tier (Postgres + Storage) |
| Telegram | grammY, webhook mode (`/api/bot`), long-polling script for local dev |
| Photo verification | Gemini 2.5 Flash, **lenient auto-approve** (reject only on confident-no; API error → approve). Admin override both ways |
| Web scope | Telegram-first. Web = view-only (photo wall, wishes, leaderboard, polled every ~10s) + admin panel. No web play |
| Join flow | One shared QR → bot → pick own name from preloaded unclaimed list |
| Tasks | Pool of 10-15 core tasks (random subset per player, load-balanced) + N person-tasks preferring different group, least-targeted first |
| Languages | Russian + English + Kazakh (bot: per-user pick at /start; web: toggle) |
| Storage budget | Compress all uploads server-side with sharp (~1600px webp) to stay under Supabase 1GB free |
| Design | impeccable.style guidance for all web UI |

## Data model (Supabase Postgres)

- `guests` — id, name, photo_url, phone, group (`kids`|`aigul_family`|`aigul_friends`|`ilya_family`|`ilya_friends`), status (`inactive`|`target`|`playing`), telegram_user_id, team_id, locale. Default `inactive`. `target` = appears in person-tasks but doesn't play. `playing` = active (set on join or manually in admin).
- `teams` — the playing unit (points live here). Solo guest = auto team of 1. Pair = one team, two guests; either partner's Telegram can operate it.
- `task_templates` — kind (`core`|`person`), title jsonb `{ru,en,kk}`, points, optional fixed target_guest_id, active flag.
- `assignments` — team_id, task_template_id, target_guest_id, status (`pending`|`approved`|`rejected`), photo_url, ai_verdict jsonb, points_awarded, timestamps.
- `photos` — url, team_id nullable, source (`task`|`free`|`wish`), visible flag. Feeds the wall.
- `wishes` — team_id, text, photo_url nullable.
- `bot_state` — telegram_user_id → jsonb (locale before claim, pending task for photo upload).
- `settings` — single jsonb row: prize tiers `[{min_points, prize}]`, tasks-per-player counts.

## Task assignment

On join + lazy top-up when player opens task list and target pool has grown:
1. K core tasks (default 4) weighted toward least-assigned templates.
2. M person-tasks (default 5) targeting `playing`/`target` guests: different group first, least-targeted first. Same group only as fallback. Never self/teammate.

## Bot flows

`/start` → locale picker → paginated unclaimed-name keyboard → optional pair partner pick → playing + tasks. Task list → submit photo → sharp compress → Storage → Gemini verify vs target reference photo → points or "try again". Wishes (text ± photo) → wall. Free photo → wall. Score command → points, tier, prize.

## Web

- `/` — public trilingual: live photo wall (10s polling), wishes, leaderboard. Venue-TV friendly.
- `/admin` — ADMIN_SECRET cookie: guests CRUD + reference photos, status toggles, task templates CRUD, submissions queue (approve/revoke), teams fix-up, prize tiers.

## Env vars

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `GEMINI_API_KEY`, `ADMIN_SECRET`, `NEXT_PUBLIC_SITE_URL`.

## Needs from Ilya

- Supabase project (free) — URL + service role key
- Bot token from @BotFather
- Gemini API key (Google AI Studio)
- Vercel link for deploy

## Verification

Local: long-polling dev bot + seeded fake guests, full flow from real Telegram account (join → name → tasks → photo → points → wall). Then Vercel preview + webhook, repeat on phone. Dry run with ~5 real guests before printing QR.
