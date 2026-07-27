import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { db, getSettings } from '@/lib/db';
import { ensureAssignments, getTaskList, awardPoints, prizeFor } from '@/lib/game';
import { storeUploadedPhoto, fetchImage } from '@/lib/images';
import { verifyPhoto } from '@/lib/verify';
import type { Guest, Locale, TaskTemplate } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const COOKIE = 'wday_play';
const MAX_UPLOAD = 15 * 1024 * 1024;

async function currentPlayer(): Promise<Guest | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const { data } = await db.from('guests').select('*').eq('web_token', token).maybeSingle();
  return data as Guest | null;
}

// Everything the /play screen needs: either the joinable name list, or my tasks.
async function state(me: Guest | null) {
  if (!me) {
    // 'target' guests (small kids, grandparents) appear in tasks but never in the join list
    const { data } = await db
      .from('guests')
      .select('id, name')
      .is('telegram_user_id', null)
      .is('web_token', null)
      .neq('status', 'target')
      .order('name');
    return { me: null, names: data ?? [] };
  }
  await ensureAssignments(me.id); // lazy top-up as more guests join
  const [tasks, settings] = await Promise.all([getTaskList(me.id, me.locale), getSettings()]);
  return {
    me: { id: me.id, name: me.name, locale: me.locale, points: me.points },
    prize: prizeFor(me.points, settings.prize_tiers, me.locale),
    tasks: tasks.map((tv) => ({ id: tv.assignment.id, title: tv.title, points: tv.points, done: tv.done })),
  };
}

export async function GET() {
  try {
    return NextResponse.json(await state(await currentPlayer()), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ me: null, names: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const action = String(form.get('action') ?? '');
    if (action === 'join') return await join(form);

    const me = await currentPlayer();
    if (!me) return NextResponse.json({ error: 'not_joined' }, { status: 401 });
    if (action === 'lang') return await setLang(me, form);
    if (action === 'leave') return await leave(me);
    if (action === 'wish') return await wish(me, form);
    if (action === 'submit' || action === 'free') return await photo(me, form, action);
    return NextResponse.json({ error: 'bad_action' }, { status: 400 });
  } catch (e) {
    console.error('play POST failed', e);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}

async function join(form: FormData) {
  const guestId = String(form.get('guest_id') ?? '');
  const locale = (String(form.get('locale') ?? 'ru') as Locale) ?? 'ru';
  const token = randomUUID();
  // Conditional update: whoever writes first wins, so two phones can't claim one name.
  const { data } = await db
    .from('guests')
    .update({ web_token: token, status: 'playing', locale })
    .eq('id', guestId)
    .is('web_token', null)
    .is('telegram_user_id', null)
    .neq('status', 'target')
    .select('*')
    .maybeSingle();
  if (!data) return NextResponse.json({ error: 'name_taken' }, { status: 409 });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 90,
    path: '/',
  });
  return NextResponse.json(await state(data as Guest));
}

async function setLang(me: Guest, form: FormData) {
  const locale = String(form.get('locale') ?? 'ru') as Locale;
  await db.from('guests').update({ locale }).eq('id', me.id);
  return NextResponse.json(await state({ ...me, locale }));
}

// Wrong name tapped from the shared QR: release it so someone else can claim it.
// Points and assignments stay put — rejoining the same name resumes where you left off.
async function leave(me: Guest) {
  await db.from('guests').update({ web_token: null, status: 'inactive' }).eq('id', me.id);
  (await cookies()).delete(COOKIE);
  return NextResponse.json(await state(null));
}

async function wish(me: Guest, form: FormData) {
  const text = String(form.get('text') ?? '').trim().slice(0, 2000);
  if (!text) return NextResponse.json({ error: 'empty' }, { status: 400 });
  await db.from('wishes').insert({ guest_id: me.id, text });
  return NextResponse.json({ ok: true });
}

async function photo(me: Guest, form: FormData, action: 'submit' | 'free') {
  const file = form.get('photo') as File | null;
  if (!file || file.size === 0) return NextResponse.json({ error: 'no_photo' }, { status: 400 });
  if (file.size > MAX_UPLOAD) return NextResponse.json({ error: 'too_big' }, { status: 413 });
  const { url, thumbUrl, buffer, mime } = await storeUploadedPhoto(Buffer.from(await file.arrayBuffer()));

  if (action === 'free') {
    await db.from('photos').insert({ url, thumb_url: thumbUrl, guest_id: me.id, source: 'free' });
    return NextResponse.json({ ok: true });
  }

  const { data: a } = await db
    .from('assignments')
    .select('*, task_templates(*), target:guests!assignments_target_guest_id_fkey(name, photo_url)')
    .eq('id', String(form.get('assignment_id') ?? ''))
    .eq('guest_id', me.id) // can only submit your own task
    .maybeSingle();
  if (!a || a.status === 'approved') return NextResponse.json({ error: 'no_task' }, { status: 404 });

  const tt = a.task_templates as TaskTemplate;
  const target = a.target as { name: string; photo_url: string | null } | null;
  let title = tt.title[me.locale] ?? tt.title.ru;
  if (target) title = title.replaceAll('{name}', target.name);
  const reference = target?.photo_url ? await fetchImage(target.photo_url) : null;
  const verdict = await verifyPhoto(buffer, title, reference, mime);
  await db
    .from('assignments')
    .update({ photo_url: url, ai_verdict: verdict, submitted_at: new Date().toISOString() })
    .eq('id', a.id);

  if (verdict.match === 'no') return NextResponse.json({ approved: false });
  const total = await awardPoints(a.id, tt.points);
  await db.from('photos').insert({ url, thumb_url: thumbUrl, guest_id: me.id, source: 'task' });
  const settings = await getSettings();
  return NextResponse.json({
    approved: true,
    points: tt.points,
    total,
    prize: prizeFor(total, settings.prize_tiers, me.locale),
  });
}
