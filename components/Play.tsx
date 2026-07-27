'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/types';

interface Task { id: string; title: string; points: number; done: boolean }
interface Me { id: string; name: string; locale: Locale; points: number }
interface State {
  me: Me | null;
  names?: { id: string; name: string }[];
  tasks?: Task[];
  prize?: string | null;
}

const BOT_URL = 'https://t.me/aigul_ilya_bot?start=join';

const card = 'rounded-2xl border border-line bg-surface';
const btn = 'rounded-full bg-accent px-5 py-3 font-semibold text-accent-ink transition active:scale-[0.98] disabled:opacity-50';
const btnGhost = 'rounded-full border border-line px-5 py-3 font-semibold text-ink-muted transition active:scale-[0.98]';

export default function Play() {
  const [state, setState] = useState<State | null>(null);
  const [locale, setLocale] = useState<Locale>('ru');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/play', { cache: 'no-store' });
    const data: State = await res.json();
    setState(data);
    if (data.me) setLocale(data.me.locale);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);

  const post = useCallback(async (form: FormData): Promise<Record<string, unknown>> => {
    const res = await fetch('/api/play', { method: 'POST', body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(String(data.error ?? 'server'));
    return data;
  }, []);

  const tr = (key: string, vars?: Record<string, string | number>) => t(locale, key, vars);

  if (!state) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6">
        <p className="text-ink-muted">{tr('play_title')}…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-16 pt-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl italic">{tr('play_title')}</h1>
        <div className="flex gap-1" role="group" aria-label="Language">
          {(['ru', 'kk', 'en'] as Locale[]).map((l) => (
            <button
              key={l}
              onClick={async () => {
                setLocale(l);
                if (state.me) {
                  const f = new FormData();
                  f.set('action', 'lang');
                  f.set('locale', l);
                  setState(await post(f) as unknown as State);
                }
              }}
              aria-pressed={locale === l}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${locale === l ? 'bg-accent text-accent-ink' : 'text-ink-muted'}`}
            >
              {l === 'ru' ? 'Рус' : l === 'kk' ? 'Қаз' : 'Eng'}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-surface-2 px-4 py-3 text-sm text-danger">{tr(error)}</p>
      )}

      {state.me
        ? <Tasks state={state} tr={tr} post={post} reload={load} onError={setError} />
        : <Join state={state} locale={locale} tr={tr} post={post} setState={setState} onError={setError} />}
    </main>
  );
}

// --- join: pick your own name from the guest list ---

function Join({ state, locale, tr, post, setState, onError }: {
  state: State;
  locale: Locale;
  tr: (k: string, v?: Record<string, string | number>) => string;
  post: (f: FormData) => Promise<Record<string, unknown>>;
  setState: (s: State) => void;
  onError: (e: string | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const names = state.names ?? [];
  const q = query.trim().toLocaleLowerCase();
  const shown = q.length >= 1 ? names.filter((n) => n.name.toLocaleLowerCase().includes(q)) : names;

  async function claim(id: string) {
    setBusy(id);
    onError(null);
    try {
      const f = new FormData();
      f.set('action', 'join');
      f.set('guest_id', id);
      f.set('locale', locale);
      setState(await post(f) as unknown as State);
    } catch (e) {
      onError((e as Error).message === 'name_taken' ? 'name_taken' : 'upload_failed');
      setBusy(null);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <p className="text-ink-muted">{tr('play_intro')}</p>
      {/* above the list on purpose: with ~50 guests the bottom of the page is far below the fold */}
      <a
        href={BOT_URL}
        className={`${card} flex items-center justify-between gap-3 px-4 py-3.5 font-semibold text-accent`}
      >
        {tr('prefer_telegram')}
        <span aria-hidden>→</span>
      </a>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={tr('search_name')}
        aria-label={tr('search_name')}
        autoComplete="off"
        className={`${card} w-full px-4 py-3 text-base text-ink outline-none focus-visible:border-accent`}
      />
      {names.length === 0 && <p className="text-ink-muted">{tr('no_names_left')}</p>}
      {names.length > 0 && shown.length === 0 && <p className="text-ink-muted">{tr('nothing_found')}</p>}
      <ul className="flex flex-col gap-2">
        {shown.map((n) => (
          <li key={n.id}>
            <button
              onClick={() => claim(n.id)}
              disabled={busy !== null}
              className={`${card} w-full px-4 py-3.5 text-left text-lg transition active:scale-[0.99] disabled:opacity-50`}
            >
              {n.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// --- playing: task list, camera submit, wall extras ---

function Tasks({ state, tr, post, reload, onError }: {
  state: State;
  tr: (k: string, v?: Record<string, string | number>) => string;
  post: (f: FormData) => Promise<Record<string, unknown>>;
  reload: () => Promise<void>;
  onError: (e: string | null) => void;
}) {
  const me = state.me!;
  const tasks = state.tasks ?? [];
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ id: string; ok: boolean; text: string } | null>(null);
  const [wishOpen, setWishOpen] = useState(false);
  const pending = tasks.filter((x) => !x.done);

  async function submitPhoto(file: File, action: 'submit' | 'free', assignmentId?: string) {
    const key = assignmentId ?? 'free';
    setBusy(key);
    onError(null);
    setFlash(null);
    try {
      const f = new FormData();
      f.set('action', action);
      f.set('photo', file);
      if (assignmentId) f.set('assignment_id', assignmentId);
      const res = await post(f);
      if (action === 'free') setFlash({ id: key, ok: true, text: tr('saved') });
      else if (res.approved) setFlash({ id: key, ok: true, text: tr('approved', { points: Number(res.points), total: Number(res.total) }) });
      else setFlash({ id: key, ok: false, text: tr('rejected') });
      await reload();
    } catch (e) {
      onError((e as Error).message === 'too_big' ? 'photo_too_big' : 'upload_failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <div className={`${card} flex items-baseline justify-between px-5 py-4`}>
        <div>
          <p className="font-display text-xl">{me.name}</p>
          <p className="text-sm text-ink-muted">{tr('my_points', { points: me.points })}</p>
        </div>
        <p className="max-w-[55%] text-right text-sm text-accent">
          {state.prize ? tr('prize_current', { prize: state.prize }) : tr('prize_none')}
        </p>
      </div>

      {pending.length === 0 && tasks.length > 0 && (
        <p className={`${card} px-5 py-4 text-center text-ok`}>{tr('all_done')}</p>
      )}

      <ul className="flex flex-col gap-3">
        {tasks.map((task) => (
          <li key={task.id} className={`${card} px-5 py-4 ${task.done ? 'opacity-60' : ''}`}>
            <p className="flex items-start gap-2 text-lg">
              <span aria-hidden>{task.done ? '✅' : '▫️'}</span>
              <span className="flex-1">{task.title}</span>
              <span className="shrink-0 text-sm text-ink-muted">+{task.points}</span>
            </p>
            {!task.done && (
              <CameraButton
                label={busy === task.id ? tr('checking') : tr('take_photo')}
                busy={busy === task.id}
                onPick={(file) => submitPhoto(file, 'submit', task.id)}
              />
            )}
            {flash?.id === task.id && (
              <p role="status" className={`mt-3 text-sm ${flash.ok ? 'text-ok' : 'text-ink-muted'}`}>{flash.text}</p>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <CameraButton
          label={busy === 'free' ? tr('checking') : tr('add_free_photo')}
          busy={busy === 'free'}
          ghost
          onPick={(file) => submitPhoto(file, 'free')}
        />
        <button onClick={() => setWishOpen((v) => !v)} className={btnGhost}>{tr('add_wish')}</button>
      </div>
      {flash?.id === 'free' && <p role="status" className="text-sm text-ok">{flash.text}</p>}

      {wishOpen && <WishForm tr={tr} post={post} onDone={() => setWishOpen(false)} onError={onError} />}

      <Link href="/wall" className="mt-2 text-center text-sm text-ink-muted underline">{tr('open_wall')}</Link>
      <button
        onClick={async () => {
          const f = new FormData();
          f.set('action', 'leave');
          await post(f);
          await reload();
        }}
        className="text-center text-sm text-ink-muted underline"
      >
        {tr('not_me')}
      </button>
    </section>
  );
}

// Native phone camera — no library, no permissions dance.
function CameraButton({ label, busy, ghost, onPick }: {
  label: string;
  busy: boolean;
  ghost?: boolean;
  onPick: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        onClick={() => ref.current?.click()}
        disabled={busy}
        className={`${ghost ? btnGhost : btn} ${ghost ? '' : 'mt-3 w-full'}`}
      >
        {busy ? label : `📸 ${label}`}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ''; // let the same photo be re-picked after a rejection
          if (file) onPick(file);
        }}
      />
    </>
  );
}

function WishForm({ tr, post, onDone, onError }: {
  tr: (k: string, v?: Record<string, string | number>) => string;
  post: (f: FormData) => Promise<Record<string, unknown>>;
  onDone: () => void;
  onError: (e: string | null) => void;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (done) return <p role="status" className={`${card} px-5 py-4 text-ok`}>{tr('wish_saved')}</p>;

  return (
    <form
      className={`${card} flex flex-col gap-3 p-4`}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        setBusy(true);
        onError(null);
        try {
          const f = new FormData();
          f.set('action', 'wish');
          f.set('text', text);
          await post(f);
          setDone(true);
        } catch {
          onError('upload_failed');
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="wish" className="text-sm text-ink-muted">{tr('wish_prompt')}</label>
      <textarea
        id="wish"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-base text-ink outline-none focus-visible:border-accent"
      />
      <div className="flex gap-2">
        <button disabled={busy || !text.trim()} className={btn}>{busy ? tr('checking') : tr('send')}</button>
        <button type="button" onClick={onDone} className={btnGhost}>{tr('cancel')}</button>
      </div>
    </form>
  );
}
