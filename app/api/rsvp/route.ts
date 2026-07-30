import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const COOKIE = 'wday_rsvp';
const MAX_UPLOAD = 12 * 1024 * 1024;
const MAX_NAME = 80;

// There is deliberately no GET any more: the old one handed every guest's name to anyone
// who asked. Guests now type their own name instead of picking from a list.

function clean(v: FormDataEntryValue | null, max = MAX_NAME): string {
  return String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const action = String(form.get('action') ?? '');
    if (action === 'attend' || action === 'decline') return await answer(form, action);

    const id = (await cookies()).get(COOKIE)?.value;
    if (!id) return NextResponse.json({ error: 'no_session' }, { status: 401 });
    if (action === 'photo') return await photo(form, id);
    if (action === 'arrival') return await arrival(form, id);
    return NextResponse.json({ error: 'bad_action' }, { status: 400 });
  } catch (e) {
    console.error('rsvp failed', e);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}

// Recorded as soon as we know who is coming — before the photo and arrival steps — so an
// abandoned upload still leaves a usable answer.
async function answer(form: FormData, action: 'attend' | 'decline') {
  const own = clean(form.get('name'));
  if (!own) return NextResponse.json({ error: 'name_required' }, { status: 400 });
  const partner = clean(form.get('pair_name'));
  const kids = Math.min(10, Math.max(0, Number(form.get('kids')) || 0));

  // A pair plays as one guest row, named "Медет + Акмарал"
  const name = partner ? `${own} + ${partner}` : own;
  const adults = partner ? 2 : 1;
  const row = {
    name,
    rsvp_status: action === 'attend' ? 'yes' : 'no',
    rsvp_party: adults + kids,
    rsvp_kids: kids,
  };

  const jar = await cookies();
  let id = jar.get(COOKIE)?.value;

  if (id) {
    // Returning guest editing their own answer.
    const { error } = await db.from('guests').update(row).eq('id', id);
    if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  } else {
    // Only reuse a row nobody has answered as yet — that covers guests we seeded by
    // hand, without letting a second "Медет" overwrite the first one's RSVP.
    const { data: free } = await db
      .from('guests')
      .select('id')
      .ilike('name', name)
      .eq('rsvp_status', 'pending')
      .limit(1)
      .maybeSingle();
    if (free) {
      const { error } = await db.from('guests').update(row).eq('id', free.id);
      if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
      id = free.id;
    } else {
      const res = await db.from('guests').insert(row).select('id').single();
      if (res.error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
      id = res.data.id;
    }
  }

  jar.set(COOKIE, id!, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 90,
    path: '/',
  });
  return NextResponse.json({ ok: true, name, party: adults + kids });
}

async function photo(form: FormData, id: string) {
  const file = form.get('photo') as File | null;
  if (!file || file.size === 0) return NextResponse.json({ error: 'no_photo' }, { status: 400 });
  if (file.size > MAX_UPLOAD) return NextResponse.json({ error: 'too_big' }, { status: 413 });
  const compressed = await sharp(Buffer.from(await file.arrayBuffer()))
    .rotate()
    .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const path = `ref-${randomUUID()}.webp`;
  // Blob, not Buffer: raw Buffers get UTF-8-mangled in the upload path on Vercel
  const up = await db.storage
    .from('photos')
    .upload(path, new Blob([new Uint8Array(compressed)], { type: 'image/webp' }), { contentType: 'image/webp' });
  if (up.error) return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
  const { data } = db.storage.from('photos').getPublicUrl(path);
  const { error } = await db.from('guests').update({ photo_url: data.publicUrl }).eq('id', id);
  return NextResponse.json({ ok: !error });
}

// Transfer travels with this call, including when the arrival time is skipped — knowing
// who needs a seat matters more than knowing when they turn up.
async function arrival(form: FormData, id: string) {
  const at = clean(form.get('arrival'), 40);
  const transfer = String(form.get('transfer') ?? '') === '1';
  const { error } = await db
    .from('guests')
    .update({ rsvp_arrival: at || null, rsvp_transfer: transfer })
    .eq('id', id);
  return NextResponse.json({ ok: !error });
}
