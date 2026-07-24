'use client';

import { useEffect, useRef, useState } from 'react';

type Locale = 'ru' | 'kk' | 'en';

interface WallPhoto { id: string; url: string; thumb_url: string | null; created_at: string }
interface WallWish { id: string; text: string; photo_url: string | null; thumb_url: string | null; created_at: string; author: string | null }
interface WallTeam { id: string; name: string; points: number }
interface WallData { photos: WallPhoto[]; wishes: WallWish[]; leaderboard: WallTeam[] }

const ui: Record<string, Record<Locale, string>> = {
  subtitle: {
    ru: 'Наш день — в фотографиях гостей, прямо сейчас',
    kk: 'Біздің күн — қонақтардың суреттерінде, дәл қазір',
    en: 'Our day — in our guests’ photos, live',
  },
  empty: {
    ru: 'Фотографии появятся здесь во время праздника ✨',
    kk: 'Суреттер той кезінде осында пайда болады ✨',
    en: 'Photos will appear here during the party ✨',
  },
  leaderboard: { ru: 'Игра', kk: 'Ойын', en: 'The game' },
  points: { ru: 'очков', kk: 'ұпай', en: 'pts' },
  wishesTitle: { ru: 'Пожелания', kk: 'Тілектер', en: 'Wishes' },
};

const medals = ['🥇', '🥈', '🥉'];

export default function Wall() {
  const [data, setData] = useState<WallData | null>(null);
  const [locale, setLocale] = useState<Locale>('ru');
  const seen = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  useEffect(() => {
    const saved = localStorage.getItem('wday-locale') as Locale | null;
    if (saved) setLocale(saved);
    document.documentElement.lang = saved ?? 'ru';
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch('/api/wall', { cache: 'no-store' });
        const json: WallData = await res.json();
        if (!alive) return;
        if (firstLoad.current) {
          // don't animate the initial backlog, only genuinely new arrivals
          for (const p of json.photos) seen.current.add(p.id);
          for (const w of json.wishes) seen.current.add(w.id);
          firstLoad.current = false;
        }
        setData(json);
      } catch {
        /* venue wi-fi hiccup; next poll will recover */
      }
    };
    load();
    const timer = setInterval(load, 10_000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  const pick = (l: Locale) => { setLocale(l); localStorage.setItem('wday-locale', l); document.documentElement.lang = l; };
  const t = (key: keyof typeof ui) => ui[key][locale];

  // one stream: photos and wish-cards interleaved by recency
  const stream: Array<{ kind: 'photo'; item: WallPhoto } | { kind: 'wish'; item: WallWish }> = [
    ...(data?.photos ?? []).map((p) => ({ kind: 'photo' as const, item: p })),
    ...(data?.wishes ?? []).map((w) => ({ kind: 'wish' as const, item: w })),
  ].sort((a, b) => (a.item.created_at < b.item.created_at ? 1 : -1));

  const isNew = (id: string) => {
    if (seen.current.has(id)) return false;
    seen.current.add(id);
    return true;
  };

  return (
    <main className="mx-auto w-full max-w-[1800px] px-4 pb-24 sm:px-8">
      <header className="flex flex-col items-center gap-5 pt-14 pb-10 text-center sm:pt-20">
        <h1 className="text-[clamp(2.2rem,6vw,5rem)] font-extrabold leading-tight tracking-tight">
          Илья <span className="text-accent">♥</span> Айгуль
        </h1>
        <p className="max-w-[65ch] text-lg text-ink-muted sm:text-xl">{t('subtitle')}</p>
        <nav aria-label="language" className="flex gap-1 rounded-full border border-line bg-surface p-1">
          {(['ru', 'kk', 'en'] as Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => pick(l)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                locale === l ? 'bg-accent text-accent-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {l === 'ru' ? 'Рус' : l === 'kk' ? 'Қаз' : 'Eng'}
            </button>
          ))}
        </nav>
      </header>

      {data && data.leaderboard.length > 0 && (
        <section aria-label={t('leaderboard')} className="mx-auto mb-12 w-full max-w-3xl">
          <h2 className="mb-4 text-center text-xl font-semibold text-ink-muted">{t('leaderboard')}</h2>
          <ol className="overflow-hidden rounded-2xl border border-line bg-surface">
            {data.leaderboard.slice(0, 10).map((team, i) => (
              <li
                key={team.id}
                className="flex items-center gap-4 border-b border-line px-5 py-3 text-lg last:border-b-0"
              >
                <span className="w-8 text-center text-xl">{medals[i] ?? i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-semibold">{team.name}</span>
                <span className="whitespace-nowrap text-accent">
                  {team.points} <span className="text-sm text-ink-muted">{t('points')}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {data && stream.length === 0 && (
        <p className="py-32 text-center text-2xl text-ink-muted">{t('empty')}</p>
      )}

      <section aria-label="photo wall" className="columns-2 gap-3 sm:columns-3 lg:columns-4 2xl:columns-5">
        {stream.map((entry) =>
          entry.kind === 'photo' ? (
            <figure key={entry.item.id} className={`mb-3 break-inside-avoid ${isNew(entry.item.id) ? 'arrive' : ''}`}>
              <a href={entry.item.url} target="_blank" rel="noopener">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.item.thumb_url ?? entry.item.url}
                  alt=""
                  loading="lazy"
                  className="w-full rounded-xl border border-line shadow-sm"
                />
              </a>
            </figure>
          ) : (
            <blockquote
              key={entry.item.id}
              className={`mb-3 break-inside-avoid rounded-xl bg-accent px-5 py-6 text-accent-ink ${
                isNew(entry.item.id) ? 'arrive' : ''
              }`}
            >
              <p className="text-lg font-semibold leading-snug" style={{ textWrap: 'pretty' }}>
                {entry.item.text || '💌'}
              </p>
              {entry.item.photo_url && (
                <a href={entry.item.photo_url} target="_blank" rel="noopener">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={entry.item.thumb_url ?? entry.item.photo_url} alt="" loading="lazy" className="mt-4 w-full rounded-lg" />
                </a>
              )}
              {entry.item.author && <footer className="mt-3 text-sm opacity-80">— {entry.item.author}</footer>}
            </blockquote>
          ),
        )}
      </section>
    </main>
  );
}
