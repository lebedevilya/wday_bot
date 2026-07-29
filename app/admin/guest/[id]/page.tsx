import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import type { Guest, TaskTemplate } from '@/lib/types';
import {
  isAdmin, saveGuest, resetGuestBinding, resetGuestProgress,
  approveSubmission, rejectSubmission, hidePhoto,
} from '../../actions';
import { targetLabel } from '@/lib/game';
import { Flash, GROUPS, STATUSES, btn, btnGhost, input } from '../../ui';

export const dynamic = 'force-dynamic';

const STATUS_STYLE: Record<string, string> = {
  approved: 'text-ok',
  rejected: 'text-danger',
  pending: 'text-ink-muted',
};

export default async function GuestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  if (!(await isAdmin())) return <main className="px-4 py-24 text-center">Not authorised. <Link href="/admin" className="underline">Sign in</Link></main>;

  const { id } = await params;
  const { msg } = await searchParams;
  const here = `/admin/guest/${id}`;

  const [{ data: guest }, { data: assignments }, { data: photos }, { data: wishes }] = await Promise.all([
    db.from('guests').select('*').eq('id', id).maybeSingle(),
    db
      .from('assignments')
      .select('*, task_templates(*), target:guests!assignments_target_guest_id_fkey(name, relation)')
      .eq('guest_id', id)
      .order('created_at')
      .order('id'),
    db.from('photos').select('*').eq('guest_id', id).order('created_at', { ascending: false }),
    db.from('wishes').select('*').eq('guest_id', id).order('created_at', { ascending: false }),
  ]);
  if (!guest) notFound();
  const g = guest as Guest;
  const rows = assignments ?? [];
  const submitted = rows.filter((a) => a.submitted_at);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <Flash msg={msg} dismissHref={here} />

      <Link href="/admin?tab=guests" className="text-sm text-ink-muted underline">← all guests</Link>

      <header className="mt-4 mb-8 flex flex-wrap items-center gap-4">
        {g.photo_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={g.photo_url} alt="" className="h-16 w-16 rounded-full object-cover" />
          : <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-xs text-ink-muted">no ref</span>}
        <div>
          <h1 className="text-2xl font-bold">{g.name}</h1>
          {g.relation && <p className="text-ink-muted">{g.relation}</p>}
          <p className="text-sm text-ink-muted">
            {g.grp} · {g.status} · {g.points} pt
            {g.telegram_user_id ? ` · telegram ${g.telegram_user_id}` : ''}
            {g.web_token ? ' · web session' : ''}
            {g.phone ? ` · ${g.phone}` : ''}
          </p>
          <p className="text-sm text-ink-muted">
            RSVP: {g.rsvp_status === 'yes'
              ? `coming, ${g.rsvp_party} people${g.rsvp_kids ? ` (${g.rsvp_kids} kids)` : ''}${g.rsvp_arrival ? ` · arriving ${g.rsvp_arrival}` : ''}${g.rsvp_transfer ? ' · needs a transfer 🚌' : ''}`
              : g.rsvp_status === 'no' ? 'declined' : 'no answer yet'}
          </p>
        </div>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Edit</h2>
        <form action={saveGuest} className="flex flex-wrap items-center gap-2 rounded-xl bg-surface p-3">
          <input type="hidden" name="id" value={g.id} />
          <input type="hidden" name="back" value={here} />
          <input name="name" defaultValue={g.name} required className={`${input} w-52`} />
          <select name="grp" defaultValue={g.grp} className={input}>
            {GROUPS.map((x) => <option key={x}>{x}</option>)}
          </select>
          <select name="status" defaultValue={g.status} className={input}>
            {STATUSES.map((x) => <option key={x}>{x}</option>)}
          </select>
          <input name="relation" defaultValue={g.relation ?? ''} placeholder="кто это (мама Ильи)" className={`${input} w-44`} />
          <input name="phone" defaultValue={g.phone ?? ''} placeholder="Phone" className={`${input} w-32`} />
          <input name="photo" type="file" accept="image/*" className="text-xs text-ink-muted" />
          <button className={btn}>Save</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {(g.telegram_user_id || g.web_token) && (
            <form action={resetGuestBinding}>
              <input type="hidden" name="id" value={g.id} />
              <input type="hidden" name="back" value={here} />
              <button className={btnGhost} title="Release this name so it can be claimed again">unbind session</button>
            </form>
          )}
          <form action={resetGuestProgress}>
            <input type="hidden" name="id" value={g.id} />
            <input type="hidden" name="back" value={here} />
            <button className={`${btnGhost} text-danger`} title="Delete their tasks, zero points, hide their photos">
              reset progress
            </button>
          </form>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-1 text-lg font-semibold">Tasks</h2>
        <p className="mb-3 text-sm text-ink-muted">
          {rows.length === 0
            ? 'No tasks yet — they are assigned when the guest joins.'
            : `${rows.filter((a) => a.status === 'approved').length} approved · ${submitted.length} submitted · ${rows.length} assigned`}
        </p>
        <div className="flex flex-col gap-2">
          {rows.map((a) => {
            const tt = a.task_templates as TaskTemplate;
            const target = a.target as { name: string; relation: string | null } | null;
            const title = (tt.title.ru ?? '').replaceAll('{name}', target ? targetLabel(target) : '…');
            const verdict = a.ai_verdict as { match?: string; reason?: string } | null;
            return (
              <div key={a.id} className="rounded-xl bg-surface p-3">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className={`text-sm font-semibold ${STATUS_STYLE[a.status]}`}>{a.status}</span>
                  <span className="flex-1">{title}</span>
                  <span className="text-sm text-ink-muted">+{tt.points}</span>
                </div>
                {a.submitted_at && (
                  <p className="mt-1 text-xs text-ink-muted">
                    submitted {new Date(a.submitted_at).toLocaleString('ru-RU')}
                    {verdict?.match ? ` · AI: ${verdict.match}` : ''}
                  </p>
                )}
                {verdict?.reason && <p className="mt-1 text-xs text-ink-muted italic">“{verdict.reason}”</p>}
                {a.photo_url && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <a href={a.photo_url} target="_blank" rel="noopener">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.photo_url} alt="" className="h-24 rounded-lg object-cover" />
                    </a>
                    <form action={approveSubmission}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="back" value={here} />
                      <button className={btn}>approve</button>
                    </form>
                    <form action={rejectSubmission}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="back" value={here} />
                      <button className={`${btnGhost} text-danger`}>reject</button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Photos ({photos?.length ?? 0})</h2>
        {photos?.length ? (
          <div className="flex flex-wrap gap-3">
            {photos.map((p) => (
              <div key={p.id} className="relative">
                <a href={p.url} target="_blank" rel="noopener">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.thumb_url ?? p.url}
                    alt=""
                    className={`h-28 rounded-lg object-cover ${p.visible ? '' : 'opacity-40 grayscale'}`}
                  />
                </a>
                <span className="absolute left-1 top-1 rounded bg-bg/80 px-1 text-[10px] text-ink-muted">
                  {p.source}{p.visible ? '' : ' · hidden'}
                </span>
                {p.visible && (
                  <form action={hidePhoto} className="absolute right-1 top-1">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="back" value={here} />
                    <button className="cursor-pointer rounded bg-bg/80 px-2 py-0.5 text-xs text-danger">hide</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">None.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Wishes ({wishes?.length ?? 0})</h2>
        {wishes?.length ? (
          <div className="flex flex-col gap-2">
            {wishes.map((w) => (
              <div key={w.id} className="rounded-xl bg-surface p-3">
                <p>{w.text}</p>
                <p className="mt-1 text-xs text-ink-muted">{new Date(w.created_at).toLocaleString('ru-RU')}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">None.</p>
        )}
      </section>
    </main>
  );
}
