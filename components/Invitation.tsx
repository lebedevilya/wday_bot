'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EVENT } from '@/lib/event';
import Rsvp from './Rsvp';
import Faq from './Faq';
import type { Locale } from '@/lib/types';

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
        <path d="M12 2C16 7 19 10 19 14a7 7 0 1 1-14 0c0-4 3-7 7-12z" fill="oklch(0.85 0.07 356)" />
      </svg>
    </span>
  );
}

export default function Invitation() {
  const [locale, setLocale] = useState<Locale>('ru');

  useEffect(() => {
    const saved = localStorage.getItem('wday-locale') as Locale | null;
    if (saved) setLocale(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === 'kk' ? 'kk' : locale;
  }, [locale]);

  const pickLocale = (l: Locale) => { setLocale(l); localStorage.setItem('wday-locale', l); };
  const ui = EVENT.ui;
  const t = (s: Record<Locale, string>, vars: Record<string, string | number> = {}) => {
    let out = s[locale] ?? s.ru;
    for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
    return out;
  };


  const contactLink = (
    <a href={EVENT.contactUrl} target="_blank" rel="noopener" className="font-semibold text-accent underline">
      {t(ui.rsvpWrite)} →
    </a>
  );

  return (
    <main className="relative overflow-x-clip">
      {/* hero */}
      <section className="relative flex min-h-[92svh] flex-col items-center justify-center px-6 pb-16 text-center">
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
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                locale === l ? 'bg-accent text-accent-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {l === 'ru' ? 'Рус' : l === 'kk' ? 'Қаз' : 'Eng'}
            </button>
          ))}
        </nav>

        <p className="mb-6 text-base tracking-wide text-ink-muted sm:text-lg">{t(EVENT.dateLine)}</p>
        <h1 className="font-light italic leading-[1.08] text-[clamp(2.6rem,9vw,6rem)]">
          {t(EVENT.names)}
        </h1>
        <p className="mt-8 max-w-[46ch] text-lg leading-relaxed text-ink-muted sm:text-xl">
          {t(EVENT.inviteLine)}
        </p>
        <a
          href="#rsvp"
          className="mt-12 rounded-full bg-accent px-8 py-4 text-base font-semibold text-accent-ink shadow-lg shadow-accent/25 transition-transform hover:scale-[1.03]"
        >
          {t(ui.rsvpCta)}
        </a>
        <a
          href="#schedule"
          aria-label={t(ui.scheduleTitle)}
          className="absolute bottom-5 text-2xl text-ink-muted"
        >
          ↓
        </a>
      </section>

      {/* schedule */}
      <section id="schedule" className="mx-auto max-w-xl px-6 py-[clamp(4rem,10vw,7rem)]">
        <h2 className="mb-10 text-center text-3xl font-light italic sm:text-4xl">{t(ui.scheduleTitle)}</h2>
        <ol className="relative ml-3 border-l border-line pl-8">
          {EVENT.schedule.map((item, i) => (
            <li key={i} className="relative pb-9 last:pb-0">
              <span aria-hidden className="absolute -left-[2.32rem] top-1.5 h-3 w-3 rounded-full border-2 border-accent bg-bg" />
              <p className="font-display text-xl text-accent">{item.time}</p>
              <p className="mt-1 text-lg">{t(item.label)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* venue */}
      <section className="bg-surface px-6 py-[clamp(4rem,10vw,7rem)] text-center">
        <h2 className="text-3xl font-light italic sm:text-4xl">{t(ui.whereTitle)}</h2>
        <p className="mt-8 text-2xl sm:text-3xl">{t(EVENT.venueName)}</p>
        <p className="mt-3 text-lg text-ink-muted">{t(EVENT.venueAddress)}</p>
        <a
          href={EVENT.mapUrl}
          target="_blank"
          rel="noopener"
          className="mt-8 inline-block rounded-full border border-accent px-7 py-3 font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-ink"
        >
          {t(ui.openMap)}
        </a>
      </section>

      {/* rsvp */}
      <section id="rsvp" className="border-t border-line px-6 py-20 text-center">
        <h2 className="mb-8 font-display text-3xl italic">{t(ui.rsvpTitle)}</h2>
        <Rsvp locale={locale} />
        <p className="mt-8 text-sm text-ink-muted">{t(ui.rsvpNotFound)} {contactLink}</p>
      </section>

      <Faq locale={locale} />

      <footer className="flex flex-col items-center gap-4 border-t border-line px-6 py-12 text-center">
        <p className="text-sm text-ink-muted">{t(EVENT.names)} · {t(EVENT.dateLine)}</p>
      </footer>
    </main>
  );
}
