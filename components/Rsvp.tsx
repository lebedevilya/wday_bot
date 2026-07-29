'use client';

import { useState } from 'react';
import { BOT_URL, EVENT, calendarUrl } from '@/lib/event';
import type { Locale } from '@/lib/types';
import PhotoCrop from './PhotoCrop';

const ui = EVENT.ui;

// name → who is coming → photo → arrival → done. Attendance is saved at the "who" step,
// so dropping out at the photo or arrival screen still leaves a complete answer.
type Step = 'name' | 'who' | 'photo' | 'arrival' | 'done' | 'declined';

const ARRIVALS = ['17:00', '18:00'];

export default function Rsvp({ locale }: { locale: Locale }) {
  const t = (d: Record<Locale, string>) => d[locale];

  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [pair, setPair] = useState('');
  const [withPair, setWithPair] = useState<boolean | null>(null);
  const [kids, setKids] = useState(0);
  const [crop, setCrop] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmNo, setConfirmNo] = useState(false);
  const [transfer, setTransfer] = useState(false);

  const post = async (form: FormData) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/rsvp', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(data.error ?? 'server'));
      return data;
    } finally {
      setBusy(false);
    }
  };

  async function submitAnswer(action: 'attend' | 'decline') {
    const f = new FormData();
    f.set('action', action);
    f.set('name', name);
    if (withPair && pair.trim()) f.set('pair_name', pair);
    f.set('kids', String(kids));
    try {
      await post(f);
      setStep(action === 'attend' ? 'photo' : 'declined');
    } catch {
      setError(t(ui.rsvpError));
    }
  }

  async function submitPhoto() {
    if (!crop) return setStep('arrival');
    if (crop.size > 12 * 1024 * 1024) return setError(t(ui.rsvpPhotoTooBig));
    const f = new FormData();
    f.set('action', 'photo');
    f.set('photo', new File([crop], 'ref.webp', { type: 'image/webp' }));
    try {
      await post(f);
      setStep('arrival');
    } catch {
      setError(t(ui.rsvpError));
    }
  }

  // Always sent, even when the time is skipped: the transfer answer rides along and is
  // the part we actually need for logistics.
  async function submitArrival(at: string) {
    const f = new FormData();
    f.set('action', 'arrival');
    f.set('arrival', at);
    f.set('transfer', transfer ? '1' : '0');
    try {
      await post(f);
    } catch {
      // optional details — never block the thank-you screen on them
    }
    setStep('done');
  }

  const card = 'rounded-2xl border border-line bg-surface';
  const primary =
    'cursor-pointer rounded-full bg-accent px-6 py-3 font-semibold text-accent-ink transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50';
  const ghost =
    'cursor-pointer rounded-full border border-line px-6 py-3 font-semibold text-ink-muted transition hover:border-accent hover:text-ink active:scale-[0.98] disabled:opacity-50';

  return (
    <div className="mx-auto w-full max-w-md">
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-surface-2 px-4 py-3 text-sm text-danger">
          {error}{' '}
          <a href={EVENT.contactUrl} className="underline">{t(ui.rsvpWrite)}</a>
        </p>
      )}

      {step === 'name' && (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => { e.preventDefault(); if (name.trim()) setStep('who'); }}
        >
          <label htmlFor="rsvp-name" className="text-lg">{t(ui.rsvpAskName)}</label>
          <input
            id="rsvp-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t(ui.rsvpSearch)}
            autoComplete="name"
            required
            className={`${card} w-full px-4 py-3 text-base text-ink outline-none focus-visible:border-accent`}
          />
          <button className={primary} disabled={!name.trim()}>{t(ui.rsvpNext)}</button>
        </form>
      )}

      {step === 'who' && (
        <div className="flex flex-col gap-5">
          <p className="text-lg">{t(ui.rsvpWho)}</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setWithPair(false); setPair(''); }}
              aria-pressed={withPair === false}
              className={withPair === false ? primary : ghost}
            >
              {t(ui.rsvpAlone)}
            </button>
            <button
              onClick={() => setWithPair(true)}
              aria-pressed={withPair === true}
              className={withPair === true ? primary : ghost}
            >
              {t(ui.rsvpWithPair)}
            </button>
          </div>

          {withPair && (
            <input
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              placeholder={t(ui.rsvpPairName)}
              aria-label={t(ui.rsvpPairName)}
              className={`${card} w-full px-4 py-3 text-base text-ink outline-none focus-visible:border-accent`}
            />
          )}

          <div className={`${card} flex items-center justify-between gap-3 px-4 py-3`}>
            <span className="text-sm text-ink-muted">{t(ui.rsvpKids)}</span>
            <span className="flex items-center gap-3">
              <button onClick={() => setKids((k) => Math.max(0, k - 1))} aria-label={t(ui.fewer)} className="cursor-pointer text-xl text-accent">−</button>
              <b className="w-6 text-center tabular-nums">{kids}</b>
              <button onClick={() => setKids((k) => Math.min(6, k + 1))} aria-label={t(ui.more)} className="cursor-pointer text-xl text-accent">+</button>
            </span>
          </div>

          <button
            onClick={() => submitAnswer('attend')}
            disabled={busy || withPair === null || (withPair && !pair.trim())}
            className={primary}
          >
            {busy ? t(ui.rsvpSending) : t(ui.rsvpYesN).replace('{n}', String((withPair ? 2 : 1) + kids))}
          </button>

          {!confirmNo ? (
            <button onClick={() => setConfirmNo(true)} className="cursor-pointer text-sm text-ink-muted underline">
              {t(ui.rsvpNo)}
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-ink-muted">{t(ui.declineConfirm)}</span>
              <button onClick={() => submitAnswer('decline')} disabled={busy} className={ghost}>{t(ui.rsvpNo)}</button>
              <button onClick={() => setConfirmNo(false)} className="cursor-pointer text-sm underline">{t(ui.back)}</button>
            </div>
          )}

          <button onClick={() => setStep('name')} className="cursor-pointer text-sm text-ink-muted underline">← {t(ui.back)}</button>
        </div>
      )}

      {step === 'photo' && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-lg">{t(ui.rsvpPhotoTitle)}</p>
            <p className="mt-1 text-sm text-ink-muted">{t(withPair ? ui.rsvpPhotoWhyPair : ui.rsvpPhotoWhySolo)}</p>
          </div>
          <PhotoCrop hint={t(ui.rsvpPickPhoto)} zoomLabel={t(ui.rsvpZoom)} onReady={setCrop} />
          {crop && <p className="text-xs text-ink-muted">{t(ui.rsvpCropHint)}</p>}
          <button onClick={submitPhoto} disabled={busy || !crop} className={primary}>
            {busy ? t(ui.rsvpSending) : t(ui.rsvpNext)}
          </button>
          <button onClick={() => setStep('arrival')} className="cursor-pointer text-sm text-ink-muted underline">
            {t(ui.rsvpSkip)}
          </button>
        </div>
      )}

      {step === 'arrival' && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-lg">{t(ui.rsvpArrivalTitle)}</p>
            <p className="mt-1 text-sm text-ink-muted">{t(ui.rsvpArrivalHint)}</p>
          </div>
          <label className={`${card} flex cursor-pointer items-start gap-3 px-4 py-3 text-left`}>
            <input
              type="checkbox"
              checked={transfer}
              onChange={(e) => setTransfer(e.target.checked)}
              className="mt-1 h-5 w-5 cursor-pointer accent-accent"
            />
            <span>
              <span className="block font-semibold">{t(ui.rsvpTransfer)}</span>
              <span className="block text-xs text-ink-muted">{t(ui.rsvpTransferHint)}</span>
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            {ARRIVALS.map((a) => (
              <button key={a} onClick={() => submitArrival(a)} disabled={busy} className={ghost}>{a}</button>
            ))}
            <button onClick={() => submitArrival('19:00')} disabled={busy} className={ghost}>
              19:00 · {t(ui.rsvpCeremonyNote)}
            </button>
          </div>
          <button onClick={() => submitArrival('')} className="cursor-pointer text-sm text-ink-muted underline">
            {t(ui.rsvpSkip)}
          </button>
        </div>
      )}

      {step === 'done' && (
        <div className="flex flex-col gap-4 text-center">
          <p className="font-display text-2xl italic">{t(ui.rsvpThanksYes)}</p>
          <p className="text-sm text-ink-muted">
            {t(ui.rsvpRecorded).replace('{n}', String((withPair ? 2 : 1) + kids))}
          </p>
          <a href={calendarUrl(locale)} target="_blank" rel="noopener" className={primary}>
            {t(ui.rsvpCalendar)}
          </a>
          <a href={BOT_URL} target="_blank" rel="noopener" className={ghost}>
            {t(ui.rsvpBot)}
          </a>
          <p className="text-xs text-ink-muted">{t(ui.rsvpBotWhy)}</p>
        </div>
      )}

      {step === 'declined' && (
        <div className="flex flex-col gap-4 text-center">
          <p className="font-display text-2xl italic">{t(ui.rsvpThanksNo)}</p>
          <button onClick={() => { setStep('name'); setConfirmNo(false); }} className="cursor-pointer text-sm text-ink-muted underline">
            {t(ui.rsvpChange)}
          </button>
        </div>
      )}
    </div>
  );
}
