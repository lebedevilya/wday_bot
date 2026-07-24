import Link from 'next/link';
import { db } from '@/lib/db';
import type { Guest, TaskTemplate } from '@/lib/types';
import {
  isAdmin, login, saveGuest, deleteGuest, resetGuestBinding,
  saveTemplate, deleteTemplate, approveSubmission, rejectSubmission, hidePhoto, saveSettings,
} from './actions';

export const dynamic = 'force-dynamic';

const GROUPS = ['kids', 'aigul_family', 'aigul_friends', 'ilya_family', 'ilya_friends'];
const STATUSES = ['inactive', 'target', 'playing'];

const input = 'rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink';
const btn = 'rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-ink';
const btnGhost = 'rounded-lg border border-line px-3 py-2 text-sm text-ink-muted';

export default async function Admin({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  if (!(await isAdmin())) {
    return (
      <main className="mx-auto max-w-sm px-4 py-24">
        <h1 className="mb-6 text-2xl font-bold">Admin</h1>
        <form action={login} className="flex gap-2">
          <input name="secret" type="password" placeholder="Secret" className={`${input} flex-1`} />
          <button className={btn}>Enter</button>
        </form>
      </main>
    );
  }

  const { tab = 'guests' } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <nav className="mb-8 flex flex-wrap gap-2">
        {['guests', 'tasks', 'review', 'settings'].map((t) => (
          <Link
            key={t}
            href={`/admin?tab=${t}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === t ? 'bg-accent text-accent-ink' : 'border border-line text-ink-muted'}`}
          >
            {t}
          </Link>
        ))}
        <Link href="/" className="ml-auto self-center text-sm text-ink-muted underline">→ wall</Link>
      </nav>
      {tab === 'guests' && <Guests />}
      {tab === 'tasks' && <Tasks />}
      {tab === 'review' && <Review />}
      {tab === 'settings' && <SettingsTab />}
    </main>
  );
}

function GuestFields({ g }: { g?: Guest }) {
  return (
    <>
      <input type="hidden" name="id" value={g?.id ?? ''} />
      <input name="name" defaultValue={g?.name} placeholder="Name" required className={`${input} w-44`} />
      <select name="grp" defaultValue={g?.grp ?? 'ilya_friends'} className={input}>
        {GROUPS.map((x) => <option key={x}>{x}</option>)}
      </select>
      <select name="status" defaultValue={g?.status ?? 'inactive'} className={input}>
        {STATUSES.map((x) => <option key={x}>{x}</option>)}
      </select>
      <input name="phone" defaultValue={g?.phone ?? ''} placeholder="Phone" className={`${input} w-32`} />
      <input name="photo" type="file" accept="image/*" className="text-xs text-ink-muted" />
      <button className={btn}>Save</button>
    </>
  );
}

async function Guests() {
  const { data: guests } = await db.from('guests').select('*').order('name');
  return (
    <section className="flex flex-col gap-3">
      <p className="text-xs text-ink-muted">
        status: <b>inactive</b> — can join via QR · <b>target</b> — appears in photo tasks, hidden from join list · <b>playing</b> — active player
      </p>
      <form action={saveGuest} className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-line p-3">
        <GuestFields />
      </form>
      {(guests as Guest[] | null)?.map((g) => (
        <div key={g.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-surface p-3">
          {g.photo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={g.photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
            : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-xs">—</span>}
          <form action={saveGuest} className="flex flex-wrap items-center gap-2">
            <GuestFields g={g} />
          </form>
          <span className="text-xs text-ink-muted">{g.telegram_user_id ? `tg✓` : ''}</span>
          {g.telegram_user_id && (
            <form action={resetGuestBinding}>
              <input type="hidden" name="id" value={g.id} />
              <button className={btnGhost} title="Unbind Telegram (wrong name claimed)">unbind</button>
            </form>
          )}
          <form action={deleteGuest}>
            <input type="hidden" name="id" value={g.id} />
            <button className={`${btnGhost} text-danger`}>delete</button>
          </form>
        </div>
      ))}
    </section>
  );
}

async function Tasks() {
  const [{ data: templates }, { data: guests }] = await Promise.all([
    db.from('task_templates').select('*').order('created_at'),
    db.from('guests').select('id, name').order('name'),
  ]);
  const TemplateForm = ({ tt }: { tt?: TaskTemplate }) => (
    <form action={saveTemplate} className="flex flex-wrap items-center gap-2 rounded-xl bg-surface p-3">
      <input type="hidden" name="id" value={tt?.id ?? ''} />
      <select name="kind" defaultValue={tt?.kind ?? 'core'} className={input}>
        <option>core</option><option>person</option>
      </select>
      <input name="title_ru" defaultValue={tt?.title.ru} placeholder="RU" required className={`${input} w-56`} />
      <input name="title_en" defaultValue={tt?.title.en} placeholder="EN" className={`${input} w-44`} />
      <input name="title_kk" defaultValue={tt?.title.kk} placeholder="KK" className={`${input} w-44`} />
      <input name="points" type="number" defaultValue={tt?.points ?? 1} className={`${input} w-16`} />
      <select name="target_guest_id" defaultValue={tt?.target_guest_id ?? ''} className={input}>
        <option value="">no fixed target</option>
        {guests?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>
      <label className="flex items-center gap-1 text-sm text-ink-muted">
        <input name="active" type="checkbox" defaultChecked={tt?.active ?? true} /> active
      </label>
      <button className={btn}>Save</button>
      {tt && (
        <button formAction={deleteTemplate} className={`${btnGhost} text-danger`}>delete</button>
      )}
    </form>
  );
  return (
    <section className="flex flex-col gap-3">
      <TemplateForm />
      {(templates as TaskTemplate[] | null)?.map((tt) => <TemplateForm key={tt.id} tt={tt} />)}
    </section>
  );
}

async function Review() {
  const [{ data: submissions }, { data: photos }] = await Promise.all([
    db.from('assignments')
      .select('*, teams(name), task_templates(title, points), target:guests!assignments_target_guest_id_fkey(name)')
      .not('photo_url', 'is', null)
      .order('submitted_at', { ascending: false })
      .limit(100),
    db.from('photos').select('*').eq('visible', true).order('created_at', { ascending: false }).limit(60),
  ]);
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Submissions</h2>
        {submissions?.map((a) => {
          const title = (a.task_templates?.title?.ru ?? '').replaceAll('{name}', a.target?.name ?? '');
          const verdict = a.ai_verdict as { match?: string; reason?: string } | null;
          return (
            <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-surface p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.photo_url!} alt="" className="h-20 w-20 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{a.teams?.name} → {title}</p>
                <p className="text-xs text-ink-muted">
                  status: {a.status} · AI: {verdict?.match ?? '—'} {verdict?.reason ? `(${verdict.reason.slice(0, 80)})` : ''}
                </p>
              </div>
              {a.status !== 'approved' && (
                <form action={approveSubmission}><input type="hidden" name="id" value={a.id} /><button className={btn}>approve</button></form>
              )}
              {a.status !== 'rejected' && (
                <form action={rejectSubmission}><input type="hidden" name="id" value={a.id} /><button className={`${btnGhost} text-danger`}>reject</button></form>
              )}
            </div>
          );
        })}
      </div>
      <div>
        <h2 className="mb-3 text-lg font-semibold">Wall photos</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {photos?.map((p) => (
            <form key={p.id} action={hidePhoto} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="aspect-square w-full rounded-lg object-cover" />
              <input type="hidden" name="id" value={p.id} />
              <button className="absolute right-1 top-1 rounded bg-bg/80 px-2 py-0.5 text-xs text-danger">hide</button>
            </form>
          ))}
        </div>
      </div>
    </section>
  );
}

async function SettingsTab() {
  const { data } = await db.from('settings').select('data').eq('id', 1).single();
  return (
    <form action={saveSettings} className="flex flex-col gap-3">
      <p className="text-sm text-ink-muted">Prize tiers + tasks-per-player (JSON).</p>
      <textarea name="json" rows={16} defaultValue={JSON.stringify(data?.data, null, 2)} className={`${input} font-mono`} />
      <button className={`${btn} self-start`}>Save</button>
    </form>
  );
}
