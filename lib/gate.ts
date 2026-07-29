import { cookies } from 'next/headers';
import { getSettings } from './db';

// The game is a surprise: its surfaces stay hidden until the wedding day. Flip
// `game_public` to true in the admin Settings tab on 8 August to open everything.
export async function gameOpen(): Promise<boolean> {
  return Boolean((await getSettings()).game_public);
}

// Same check for pages, except an admin always gets through so it can be tested.
export async function gameVisible(): Promise<boolean> {
  if (await gameOpen()) return true;
  return (await cookies()).get('wday_admin')?.value === process.env.ADMIN_SECRET;
}
