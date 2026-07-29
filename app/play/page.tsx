import type { Metadata } from 'next';
import Play from '@/components/Play';
import { gameVisible } from '@/lib/gate';
import ComingSoon from '@/components/ComingSoon';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Игра · Ilya ♥ Aigul',
  description: 'Фотозадания, очки и призы для гостей свадьбы.',
};

export default async function PlayPage() {
  if (!(await gameVisible())) return <ComingSoon />;
  return <Play />;
}
