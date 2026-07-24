import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Guest names for the RSVP picker (public: names only).
export async function GET() {
  const { data } = await db.from('guests').select('id, name, rsvp_status').order('name');
  return NextResponse.json({ guests: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const { guest_id, status, party } = await req.json();
  if (!guest_id || !['yes', 'no'].includes(status)) return NextResponse.json({ ok: false }, { status: 400 });
  const { error } = await db
    .from('guests')
    .update({ rsvp_status: status, rsvp_party: Math.min(6, Math.max(1, Number(party) || 1)) })
    .eq('id', guest_id);
  return NextResponse.json({ ok: !error });
}
