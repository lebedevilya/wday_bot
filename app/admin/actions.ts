'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
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

export async function login(formData: FormData) {
  const secret = String(formData.get('secret') ?? '');
  if (secret === process.env.ADMIN_SECRET) {
    (await cookies()).set(COOKIE, secret, { httpOnly: true, maxAge: 60 * 60 * 24 * 90 });
  }
  revalidatePath('/admin');
}

export async function saveGuest(formData: FormData) {
  await guard();
  const id = String(formData.get('id') ?? '');
  const row = {
    name: String(formData.get('name')),
    phone: String(formData.get('phone') ?? '') || null,
    grp: String(formData.get('grp')),
    status: String(formData.get('status')),
  };
  if (id) await db.from('guests').update(row).eq('id', id);
  else await db.from('guests').insert(row);

  const photo = formData.get('photo') as File | null;
  if (photo && photo.size > 0) {
    const compressed = await sharp(Buffer.from(await photo.arrayBuffer()))
      .rotate()
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const path = `ref-${randomUUID()}.webp`;
    await db.storage.from('photos').upload(path, compressed, { contentType: 'image/webp' });
    const { data } = db.storage.from('photos').getPublicUrl(path);
    const target = id || (await db.from('guests').select('id').eq('name', row.name).order('created_at', { ascending: false }).limit(1).single()).data?.id;
    if (target) await db.from('guests').update({ photo_url: data.publicUrl }).eq('id', target);
  }
  revalidatePath('/admin');
}

export async function deleteGuest(formData: FormData) {
  await guard();
  await db.from('guests').delete().eq('id', String(formData.get('id')));
  revalidatePath('/admin');
}

// Fix a wrong-name claim: unbind Telegram account + team so the guest is claimable again.
export async function resetGuestBinding(formData: FormData) {
  await guard();
  const id = String(formData.get('id'));
  const { data: g } = await db.from('guests').select('telegram_user_id').eq('id', id).single();
  if (g?.telegram_user_id) await db.from('bot_state').delete().eq('telegram_user_id', g.telegram_user_id);
  await db.from('guests').update({ telegram_user_id: null, team_id: null, status: 'inactive' }).eq('id', id);
  revalidatePath('/admin');
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
  if (id) await db.from('task_templates').update(row).eq('id', id);
  else await db.from('task_templates').insert(row);
  revalidatePath('/admin');
}

export async function deleteTemplate(formData: FormData) {
  await guard();
  await db.from('task_templates').delete().eq('id', String(formData.get('id')));
  revalidatePath('/admin');
}

export async function approveSubmission(formData: FormData) {
  await guard();
  const id = String(formData.get('id'));
  const { data: a } = await db.from('assignments').select('*, task_templates(points)').eq('id', id).single();
  if (a && a.status !== 'approved') {
    await awardPoints(id, (a.task_templates as { points: number }).points);
    if (a.photo_url) await db.from('photos').insert({ url: a.photo_url, team_id: a.team_id, source: 'task' });
  }
  revalidatePath('/admin');
}

export async function rejectSubmission(formData: FormData) {
  await guard();
  const id = String(formData.get('id'));
  const { data: a } = await db.from('assignments').select('*').eq('id', id).single();
  if (!a) return;
  if (a.status === 'approved' && a.points_awarded > 0) {
    const { data: team } = await db.from('teams').select('points').eq('id', a.team_id).single();
    await db.from('teams').update({ points: Math.max(0, (team?.points ?? 0) - a.points_awarded) }).eq('id', a.team_id);
    if (a.photo_url) await db.from('photos').update({ visible: false }).eq('url', a.photo_url);
  }
  await db.from('assignments').update({ status: 'rejected', points_awarded: 0 }).eq('id', id);
  revalidatePath('/admin');
}

export async function hidePhoto(formData: FormData) {
  await guard();
  await db.from('photos').update({ visible: false }).eq('id', String(formData.get('id')));
  revalidatePath('/admin');
}

export async function saveSettings(formData: FormData) {
  await guard();
  const data = JSON.parse(String(formData.get('json')));
  await db.from('settings').update({ data }).eq('id', 1);
  revalidatePath('/admin');
}
