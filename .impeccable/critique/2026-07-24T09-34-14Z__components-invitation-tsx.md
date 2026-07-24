---
target: invitation landing /
total_score: 19
max_score: 32
na_heuristics: 7,10
p0_count: 2
p1_count: 2
timestamp: 2026-07-24T09-34-14Z
slug: components-invitation-tsx
---
# Critique: invitation landing / (wday-tau.vercel.app) — 2026-07-24

Method: dual-agent. Score 19/32 (59%, heuristics 7 & 10 n/a). Detector CLI clean; browser evidence found contrast + tap-target + lang issues.

## Scores
1 Status:1 (optimistic RSVP success, no loading/error states) · 2 Real world:3 (substring name search) · 3 Control:3 (bare ← glyph) · 4 Consistency:3 · 5 Error prevention:2 (no-confirm decline, skippable party size) · 6 Recognition:3 (thanks doesn't echo party) · 7 n/a · 8 Aesthetic:4 · 9 Error recovery:0 (zero error states) · 10 n/a (no contact/help channel)

## Priority issues
- [P0] RSVP success rendered before POST resolves; fetch errors swallowed (components/Invitation.tsx answer()). Fix: await POST, pending state, thanks on 2xx only, retry + phone fallback.
- [P0] Placeholder venue (Ресторан «TODO», г. Город, dead 2GIS link) live in prod (lib/event.ts). Needs real data + city in hero date line.
- [P1] Empty name-search result renders nothing — no escape hatch. Add "Не нашли себя? Напишите нам →" WhatsApp link.
- [P1] Party size skippable, unlabeled re kids. Label "вместе с детьми", echo count into yes-button.
- [P2] lang="ru" hardcoded (layout.tsx); 12px locale pills 45×24px tap targets; per-guest ?l=kk links suggested.
- [P2] «Не смогу» single tap no confirm; change-answer link tiny.

## Browser measurements
Accent text on bg: 4.15:1 (below AA at used sizes). CTA text on accent: 4.20:1. Muted text: 5.96:1 ok. Ink: 13.39:1. No horizontal overflow at 1470px. Lang switcher 45×24px.

## Minor
Test guests in prod; /api/rsvp exposes full guest list publicly; no OG image; no dress code/gifts/kids/deadline info; font-[var(--font-literata)] arbitrary-value inconsistency; /wall lang also static.

## Strengths
Literata/rose identity without kitsch; petal motion with reduced-motion fallback; tap-your-name RSVP concept fits audience.
