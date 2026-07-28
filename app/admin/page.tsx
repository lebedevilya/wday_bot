import Link from 'next/link';
import { db } from '@/lib/db';
import type { Guest, TaskTemplate } from '@/lib/types';
import {
  isAdmin, login, saveGuest, deleteGuest, resetGuestBinding,
  saveTemplate, deleteTemplate, approveSubmission, rejectSubmission, hidePhoto, saveSettings,
} from './actions';
import { Flash, GROUPS, STATUSES, btn, btnGhost, input } from './ui';

export const dynamic = 'force-dynamic';


export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; msg?: string; q?: string; grp?: string; st?: string }>;
}) {
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

  const { tab = 'guests', msg, q = '', grp = '', st = '' } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <Flash msg={msg} dismissHref={`/admin?tab=${tab}`} />
      <nav className="mb-8 flex flex-wrap gap-2">
        {['guests', 'tasks', 'review', 'settings'].map((t) => (
          <Link
            key={t}
            href={`/admin?tab=${t}`}
            className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition ${tab === t ? 'bg-accent text-accent-ink' : 'border border-line text-ink-muted hover:text-ink'}`}
          >
            {t}
          </Link>
        ))}
        <Link href="/" className="ml-auto self-center text-sm text-ink-muted underline">→ wall</Link>
      </nav>
      {tab === 'guests' && <Guests q={q} grp={grp} st={st} />}
      {tab === 'tasks' && <Tasks />}
      {tab === 'review' && <Review />}
      {tab === 'settings' && <SettingsTab />}
    </main>
  );
}

// In list rows the name is a link to the guest page, so the text input is replaced by a
// hidden field (saveGuest still requires a name). The new-guest form keeps the input.
function GuestFields({ g, hideName }: { g?: Guest; hideName?: boolean }) {
  return (
    <>
      <input type="hidden" name="id" value={g?.id ?? ''} />
      {hideName
        ? <input type="hidden" name="name" value={g?.name ?? ''} />
        : <input name="name" defaultValue={g?.name} placeholder="Name" required className={`${input} w-44`} />}
      <select name="grp" defaultValue={g?.grp ?? 'ilya_friends'} className={input}>
        {GROUPS.map((x) => <option key={x}>{x}</option>)}
      </select>
      <select name="status" defaultValue={g?.status ?? 'inactive'} className={input}>
        {STATUSES.map((x) => <option key={x}>{x}</option>)}
      </select>
      <input name="relation" defaultValue={g?.relation ?? ''} placeholder="кто это (мама Ильи)" className={`${input} w-40`} />
      <input name="phone" defaultValue={g?.phone ?? ''} placeholder="Phone" className={`${input} w-28`} />
      <input name="photo" type="file" accept="image/*" className="text-xs text-ink-muted" />
      <button className={btn}>Save</button>
    </>
  );
}

async function Guests({ q, grp, st }: { q: string; grp: string; st: string }) {
  // Filtering runs in the query, so it keeps working once the list is 50 guests long.
  // Plain GET form + searchParams: no client JS, and the filtered view is linkable.
  let query = db.from('guests').select('*').order('name');
  // strip the characters that would break PostgREST's or() grammar before interpolating
  const needle = q.trim().replace(/[,()]/g, '');
  if (needle) query = query.or(`name.ilike.%${needle}%,relation.ilike.%${needle}%`);
  if (grp) query = query.eq('grp', grp);
  if (st) query = query.eq('status', st);
  const [{ data: guests }, { count: total }] = await Promise.all([
    query,
    db.from('guests').select('*', { count: 'exact', head: true }),
  ]);

  // RSVP tally is about the whole party, not the current filter
  const { data: all } = await db.from('guests').select('rsvp_status, rsvp_party');
  const yes = all?.filter((g) => g.rsvp_status === 'yes') ?? [];
  const no = all?.filter((g) => g.rsvp_status === 'no') ?? [];
  const partySum = yes.reduce((n, g) => n + (g.rsvp_party ?? 1), 0);
  const filtered = Boolean(q || grp || st);

  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm">
        RSVP: <b className="text-ok">{yes.length} yes</b> ({partySum} people) · <b className="text-danger">{no.length} no</b> · {(all?.length ?? 0) - yes.length - no.length} pending
      </p>
      <p className="text-xs text-ink-muted">
        status: <b>inactive</b> — can join via QR · <b>target</b> — appears in photo tasks, hidden from join list · <b>playing</b> — active player
      </p>

      <form method="get" action="/admin" className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-2 p-3">
        <input type="hidden" name="tab" value="guests" />
        <input name="q" defaultValue={q} placeholder="Search name or relation…" aria-label="Search by name or relation" className={`${input} w-48`} />
        <select name="grp" defaultValue={grp} aria-label="Filter by group" className={input}>
          <option value="">all groups</option>
          {GROUPS.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <select name="st" defaultValue={st} aria-label="Filter by status" className={input}>
          <option value="">all statuses</option>
          {STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <button className={btn}>Filter</button>
        {filtered && <Link href="/admin?tab=guests" className={btnGhost}>clear</Link>}
        <span className="ml-auto text-xs text-ink-muted">
          {filtered ? `${guests?.length ?? 0} of ${total ?? 0}` : `${total ?? 0} guests`}
        </span>
      </form>

      <form action={saveGuest} className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-line p-3">
        <GuestFields />
      </form>

      {guests?.length === 0 && <p className="py-6 text-center text-sm text-ink-muted">No guests match that filter.</p>}

      {(guests as Guest[] | null)?.map((g) => (
        // key includes the mutable fields: these inputs are uncontrolled, so defaultValue
        // only applies on mount — without this the row keeps showing pre-save values
        <div
          key={`${g.id}:${g.name}:${g.relation ?? ''}:${g.grp}:${g.status}:${g.phone ?? ''}:${g.telegram_user_id ?? ''}:${g.web_token ?? ''}:${g.photo_url ?? ''}`}
          className="flex flex-wrap items-center gap-2 rounded-xl bg-surface p-3"
        >
          <Link href={`/admin/guest/${g.id}`} title="Open guest page">
            {g.photo_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={g.photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-xs">—</span>}
          </Link>
          <Link href={`/admin/guest/${g.id}`} className="w-44 shrink-0 leading-tight">
            <span className="block truncate font-semibold text-accent underline decoration-transparent transition hover:decoration-inherit">
              {g.name}
            </span>
            {g.relation && <span className="block truncate text-xs text-ink-muted">{g.relation}</span>}
          </Link>
          <form action={saveGuest} className="flex flex-wrap items-center gap-2">
            <GuestFields g={g} hideName />
          </form>
          <span className="text-xs text-ink-muted">
            {g.rsvp_status === 'yes' ? `✅×${g.rsvp_party}` : g.rsvp_status === 'no' ? '🚫' : ''}
            {g.telegram_user_id ? ' tg✓' : ''}
            {g.web_token ? ' web✓' : ''}
            {g.points > 0 ? ` ${g.points}pt` : ''}
          </span>
          {/* web players have web_token and no telegram id, so check both or they can never be unbound */}
          {(g.telegram_user_id || g.web_token) && (
            <form action={resetGuestBinding}>
              <input type="hidden" name="id" value={g.id} />
              <button className={btnGhost} title="Release this name (wrong name claimed)">unbind</button>
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
      <input name="title_kk" defaultValue={tt?.title.kk} placeholder="KZ" className={`${input} w-44`} />
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
      {(templates as TaskTemplate[] | null)?.map((tt) => (
        // same uncontrolled-input remount rule as the guest rows above
        <TemplateForm key={`${tt.id}:${tt.kind}:${tt.points}:${tt.active}:${tt.target_guest_id ?? ''}:${JSON.stringify(tt.title)}`} tt={tt} />
      ))}
    </section>
  );
}

async function Review() {
  const [{ data: submissions }, { data: photos }] = await Promise.all([
    db.from('assignments')
      .select('*, player:guests!assignments_guest_id_fkey(name), task_templates(title, points), target:guests!assignments_target_guest_id_fkey(name)')
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
                <p className="font-semibold">{a.player?.name} → {title}</p>
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
