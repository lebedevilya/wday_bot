'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { db } from '@/lib/db';
import { awardPoints } from '@/lib/game';

const COOKIE = 'wday_admin';

export async function isAdmin(): Promise<boolean> {
  return (await cookies()).get(COOKIE)?.value === process.env.ADMIN_SECRET;
}

async function guard() {
  if (!(await isAdmin())) throw new Error('unauthorized');
}

// Every action ends here: re-render, then bounce back to its own tab carrying a
// message, so a successful save is visible instead of looking like a dead button.
// redirect() throws, so this must be the last statement in an action.
function done(tab: string, msg: string): never {
  revalidatePath('/admin');
  redirect(`/admin?tab=${tab}&msg=${msg}`);
}

// Same, but honours a `back` field so an action fired from a guest detail page
// returns there instead of bouncing to the tab it "belongs" to.
function doneBack(formData: FormData, tab: string, msg: string): never {
  const back = String(formData.get('back') ?? '');
  if (!back.startsWith('/admin/')) done(tab, msg); // only ever redirect inside admin
  revalidatePath(back);
  redirect(`${back}?msg=${msg}`);
}

// Supabase returns errors instead of throwing; without this a failed write looked
// exactly like a successful one.
function check(...results: { error: { message: string } | null }[]): string | null {
  for (const r of results) if (r.error) return r.error.message;
  return null;
}

export async function login(formData: FormData) {
  const secret = String(formData.get('secret') ?? '');
  if (secret !== process.env.ADMIN_SECRET) {
    revalidatePath('/admin');
    return;
  }
  (await cookies()).set(COOKIE, secret, { httpOnly: true, maxAge: 60 * 60 * 24 * 90 });
  done('guests', 'welcome');
}

export async function saveGuest(formData: FormData) {
  await guard();
  const id = String(formData.get('id') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  if (!name) done('guests', 'name_required');
  const row = {
    name,
    relation: String(formData.get('relation') ?? '').trim() || null,
    phone: String(formData.get('phone') ?? '') || null,
    grp: String(formData.get('grp')),
    status: String(formData.get('status')),
  };

  let targetId = id;
  if (id) {
    if (check(await db.from('guests').update(row).eq('id', id))) done('guests', 'error');
  } else {
    const res = await db.from('guests').insert(row).select('id').single();
    if (res.error) done('guests', 'error');
    targetId = res.data!.id;
  }

  const photo = formData.get('photo') as File | null;
  if (photo && photo.size > 0) {
    const compressed = await sharp(Buffer.from(await photo.arrayBuffer()))
      .rotate()
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const path = `ref-${randomUUID()}.webp`;
    const up = await db.storage
      .from('photos')
      .upload(path, new Blob([new Uint8Array(compressed)], { type: 'image/webp' }), { contentType: 'image/webp' });
    if (up.error) done('guests', 'photo_failed');
    const { data } = db.storage.from('photos').getPublicUrl(path);
    if (check(await db.from('guests').update({ photo_url: data.publicUrl }).eq('id', targetId))) {
      done('guests', 'photo_failed');
    }
    done('guests', 'saved_with_photo');
  }
  doneBack(formData, 'guests', id ? 'saved' : 'created');
}

export async function deleteGuest(formData: FormData) {
  await guard();
  const err = check(await db.from('guests').delete().eq('id', String(formData.get('id'))));
  done('guests', err ? 'error' : 'deleted');
}

// Fix a wrong-name claim: unbind Telegram/browser session so the guest is claimable again.
export async function resetGuestBinding(formData: FormData) {
  await guard();
  const id = String(formData.get('id'));
  const { data: g } = await db.from('guests').select('telegram_user_id').eq('id', id).single();
  if (g?.telegram_user_id) await db.from('bot_state').delete().eq('telegram_user_id', g.telegram_user_id);
  const err = check(
    await db.from('guests').update({ telegram_user_id: null, web_token: null, status: 'inactive' }).eq('id', id),
  );
  doneBack(formData, 'guests', err ? 'error' : 'unbound');
}

export async function saveTemplate(formData: FormData) {
  await guard();
  const id = String(formData.get('id') ?? '');
  const row = {
    kind: String(formData.get('kind')),
    points: Number(formData.get('points') ?? 1),
    active: formData.get('active') === 'on',
    target_guest_id: String(formData.get('target_guest_id') ?? '') || null,
    title: {
      ru: String(formData.get('title_ru')),
      en: String(formData.get('title_en')),
      kk: String(formData.get('title_kk')),
    },
  };
  if (!row.title.ru.trim()) done('tasks', 'name_required');
  const err = id
    ? check(await db.from('task_templates').update(row).eq('id', id))
    : check(await db.from('task_templates').insert(row));
  done('tasks', err ? 'error' : id ? 'saved' : 'created');
}

export async function deleteTemplate(formData: FormData) {
  await guard();
  const err = check(await db.from('task_templates').delete().eq('id', String(formData.get('id'))));
  done('tasks', err ? 'error' : 'deleted');
}

export async function approveSubmission(formData: FormData) {
  await guard();
  const id = String(formData.get('id'));
  const { data: a } = await db.from('assignments').select('*, task_templates(points)').eq('id', id).single();
  if (!a) done('review', 'error');
  if (a.status !== 'approved') {
    await awardPoints(id, (a.task_templates as { points: number }).points);
    if (a.photo_url) await db.from('photos').insert({ url: a.photo_url, guest_id: a.guest_id, source: 'task' });
  }
  doneBack(formData, 'review', 'approved');
}

export async function rejectSubmission(formData: FormData) {
  await guard();
  const id = String(formData.get('id'));
  const { data: a } = await db.from('assignments').select('*').eq('id', id).single();
  if (!a) done('review', 'error');
  if (a.status === 'approved' && a.points_awarded > 0) {
    const { data: g } = await db.from('guests').select('points').eq('id', a.guest_id).single();
    await db.from('guests').update({ points: Math.max(0, (g?.points ?? 0) - a.points_awarded) }).eq('id', a.guest_id);
    if (a.photo_url) await db.from('photos').update({ visible: false }).eq('url', a.photo_url);
  }
  const err = check(await db.from('assignments').update({ status: 'rejected', points_awarded: 0 }).eq('id', id));
  doneBack(formData, 'review', err ? 'error' : 'rejected');
}

export async function hidePhoto(formData: FormData) {
  await guard();
  const err = check(await db.from('photos').update({ visible: false }).eq('id', String(formData.get('id'))));
  doneBack(formData, 'review', err ? 'error' : 'hidden');
}

export async function saveSettings(formData: FormData) {
  await guard();
  let data: unknown;
  try {
    data = JSON.parse(String(formData.get('json')));
  } catch {
    done('settings', 'bad_json');
  }
  const err = check(await db.from('settings').update({ data }).eq('id', 1));
  done('settings', err ? 'error' : 'saved');
}

// Clear a guest's game progress: drop their tasks and zero their points. Used when a
// row carries leftover state (e.g. a test guest renamed into a real one).
export async function resetGuestProgress(formData: FormData) {
  await guard();
  const id = String(formData.get('id'));
  await db.from('assignments').delete().eq('guest_id', id);
  await db.from('photos').update({ visible: false }).eq('guest_id', id);
  const err = check(await db.from('guests').update({ points: 0 }).eq('id', id));
  doneBack(formData, 'guests', err ? 'error' : 'points_reset');
}
