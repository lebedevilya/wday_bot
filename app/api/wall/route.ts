import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Public read model for the wall page (polled every ~10s by the client).
export async function GET() {
  try {
    return await wall();
  } catch {
    return NextResponse.json({ photos: [], wishes: [], leaderboard: [] });
  }
}

async function wall() {
  const [{ data: photos }, { data: wishes }, { data: teams }] = await Promise.all([
    db.from('photos').select('id, url, created_at').eq('visible', true).order('created_at', { ascending: false }).limit(300),
    db.from('wishes').select('id, text, photo_url, created_at, teams(name)').eq('visible', true).order('created_at', { ascending: false }).limit(100),
    db.from('teams').select('id, name, points').gt('points', 0).order('points', { ascending: false }).limit(50),
  ]);
  return NextResponse.json(
    {
      photos: photos ?? [],
      wishes: (wishes ?? []).map((w) => ({
        id: w.id,
        text: w.text,
        photo_url: w.photo_url,
        created_at: w.created_at,
        author: (w.teams as unknown as { name: string } | null)?.name ?? null,
      })),
      leaderboard: teams ?? [],
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
