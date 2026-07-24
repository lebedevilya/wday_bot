'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { EVENT } from '@/lib/event';
import type { Locale } from '@/lib/types';

interface RsvpGuest { id: string; name: string; rsvp_status: 'pending' | 'yes' | 'no' }

const PETALS = [
  { left: '6%', t: '17s', d: '0s', o: 0.5, s: 22, r: 12 },
  { left: '18%', t: '23s', d: '4s', o: 0.35, s: 16, r: 80 },
  { left: '31%', t: '19s', d: '9s', o: 0.45, s: 26, r: 200 },
  { left: '44%', t: '25s', d: '2s', o: 0.3, s: 14, r: 45 },
  { left: '57%', t: '18s', d: '12s', o: 0.5, s: 20, r: 150 },
  { left: '69%', t: '22s', d: '6s', o: 0.4, s: 24, r: 260 },
  { left: '81%', t: '20s', d: '10s', o: 0.35, s: 16, r: 320 },
  { left: '92%', t: '24s', d: '3s', o: 0.45, s: 20, r: 100 },
];

function Petal({ p }: { p: (typeof PETALS)[number] }) {
  return (
    <span
      className="petal"
      style={{
        left: p.left,
        ['--petal-t' as string]: p.t,
        ['--petal-d' as string]: p.d,
        ['--petal-o' as string]: p.o,
        ['--petal-static' as string]: `${(p.s * 3) % 80}%`,
      }}
      aria-hidden
    >
      <svg width={p.s} height={p.s} viewBox="0 0 24 24" style={{ transform: `rotate(${p.r}deg)` }}>
        <path
          d="M12 2C16 7 19 10 19 14a7 7 0 1 1-14 0c0-4 3-7 7-12z"
          fill="oklch(0.85 0.07 356)"
        />
      </svg>
    </span>
  );
}

export default function Invitation() {
  const [locale, setLocale] = useState<Locale>('ru');
  const [guests, setGuests] = useState<RsvpGuest[]>([]);
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState<RsvpGuest | null>(null);
  const [party, setParty] = useState(1);
  const [answered, setAnswered] = useState<'yes' | 'no' | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('wday-locale') as Locale | null;
    if (saved) setLocale(saved);
    fetch('/api/rsvp').then((r) => r.json()).then((j) => setGuests(j.guests ?? [])).catch(() => {});
  }, []);

  const pickLocale = (l: Locale) => { setLocale(l); localStorage.setItem('wday-locale', l); };
  const ui = EVENT.ui;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return guests.filter((g) => g.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query, guests]);

  async function answer(status: 'yes' | 'no') {
    if (!chosen) return;
    setAnswered(status);
    await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guest_id: chosen.id, status, party }),
    }).catch(() => {});
  }

  return (
    <main className="relative overflow-x-clip">
      {/* hero */}
      <section className="relative flex min-h-[92svh] flex-col items-center justify-center px-6 text-center">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(60% 45% at 50% 32%, oklch(0.95 0.025 356 / 0.9), transparent 70%), radial-gradient(40% 30% at 78% 75%, oklch(0.94 0.03 350 / 0.6), transparent 70%)',
          }}
        />
        {PETALS.map((p, i) => <Petal key={i} p={p} />)}

        <nav aria-label="language" className="absolute right-4 top-4 flex gap-1 rounded-full border border-line bg-bg/70 p-1 backdrop-blur">
          {(['ru', 'kk', 'en'] as Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => pickLocale(l)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                locale === l ? 'bg-accent text-accent-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {l === 'ru' ? 'Рус' : l === 'kk' ? 'Қаз' : 'Eng'}
            </button>
          ))}
        </nav>

        <p className="mb-6 text-base tracking-wide text-ink-muted sm:text-lg">{EVENT.dateLine[locale]}</p>
        <h1 className="font-light italic leading-[1.08] text-[clamp(2.6rem,9vw,6rem)]">
          {EVENT.names[locale]}
        </h1>
        <p className="mt-8 max-w-[46ch] text-lg leading-relaxed text-ink-muted sm:text-xl">
          {EVENT.inviteLine[locale]}
        </p>
        <a
          href="#rsvp"
          className="mt-12 rounded-full bg-accent px-8 py-4 text-base font-semibold text-accent-ink shadow-lg shadow-accent/25 transition-transform hover:scale-[1.03]"
        >
          {ui.rsvpCta[locale]}
        </a>
      </section>

      {/* schedule */}
      <section className="mx-auto max-w-xl px-6 py-[clamp(4rem,10vw,7rem)]">
        <h2 className="mb-10 text-center text-3xl font-light italic sm:text-4xl">{ui.scheduleTitle[locale]}</h2>
        <ol className="relative ml-3 border-l border-line pl-8">
          {EVENT.schedule.map((item, i) => (
            <li key={i} className="relative pb-9 last:pb-0">
              <span aria-hidden className="absolute -left-[2.32rem] top-1.5 h-3 w-3 rounded-full border-2 border-accent bg-bg" />
              <p className="font-[var(--font-literata)] text-xl text-accent">{item.time}</p>
              <p className="mt-1 text-lg">{item.label[locale]}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* venue */}
      <section className="bg-surface px-6 py-[clamp(4rem,10vw,7rem)] text-center">
        <h2 className="text-3xl font-light italic sm:text-4xl">{ui.whereTitle[locale]}</h2>
        <p className="mt-8 text-2xl sm:text-3xl">{EVENT.venueName[locale]}</p>
        <p className="mt-3 text-lg text-ink-muted">{EVENT.venueAddress[locale]}</p>
        <a
          href={EVENT.mapUrl}
          target="_blank"
          rel="noopener"
          className="mt-8 inline-block rounded-full border border-accent px-7 py-3 font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-ink"
        >
          {ui.openMap[locale]}
        </a>
      </section>

      {/* rsvp */}
      <section id="rsvp" className="mx-auto max-w-xl px-6 py-[clamp(4rem,10vw,7rem)] text-center">
        <h2 className="text-3xl font-light italic sm:text-4xl">{ui.rsvpTitle[locale]}</h2>

        {answered ? (
          <div className="mt-10">
            <p className="text-2xl leading-relaxed">
              {answered === 'yes' ? ui.rsvpThanksYes[locale] : ui.rsvpThanksNo[locale]}
            </p>
            <button
              onClick={() => { setAnswered(null); setChosen(null); setQuery(''); }}
              className="mt-6 text-sm text-ink-muted underline"
            >
              {ui.rsvpChange[locale]}
            </button>
          </div>
        ) : !chosen ? (
          <div className="mt-8">
            <p className="mb-4 text-ink-muted">{ui.rsvpFind[locale]}</p>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={ui.rsvpSearch[locale]}
              className="w-full max-w-sm rounded-full border border-line bg-bg px-6 py-3.5 text-center text-lg text-ink outline-none focus:border-accent"
            />
            <ul className="mx-auto mt-4 flex max-w-sm flex-col gap-2">
              {matches.map((g) => (
                <li key={g.id}>
                  <button
                    onClick={() => { setChosen(g); setParty(1); }}
                    className="w-full rounded-full border border-line px-6 py-3 text-lg transition-colors hover:border-accent hover:text-accent"
                  >
                    {g.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-8">
            <p className="text-2xl">{chosen.name}</p>
            <div>
              <p className="mb-3 text-ink-muted">{ui.rsvpParty[locale]}</p>
              <div className="flex items-center justify-center gap-5">
                <button onClick={() => setParty(Math.max(1, party - 1))} aria-label="−" className="h-11 w-11 rounded-full border border-line text-xl">−</button>
                <span className="w-8 text-2xl">{party}</span>
                <button onClick={() => setParty(Math.min(6, party + 1))} aria-label="+" className="h-11 w-11 rounded-full border border-line text-xl">+</button>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => answer('yes')} className="rounded-full bg-accent px-8 py-4 text-lg font-semibold text-accent-ink shadow-lg shadow-accent/25">
                {ui.rsvpYes[locale]}
              </button>
              <button onClick={() => answer('no')} className="rounded-full border border-line px-8 py-4 text-lg text-ink-muted hover:text-ink">
                {ui.rsvpNo[locale]}
              </button>
            </div>
            <button onClick={() => setChosen(null)} className="text-sm text-ink-muted underline">←</button>
          </div>
        )}
      </section>

      <footer className="flex flex-col items-center gap-4 border-t border-line px-6 py-12 text-center">
        <Link href="/wall" className="text-lg font-semibold text-accent">{ui.wallLink[locale]}</Link>
        <p className="text-sm text-ink-muted">{EVENT.names[locale]} · {EVENT.dateLine[locale]}</p>
      </footer>
    </main>
  );
}
