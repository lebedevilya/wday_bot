import type { Metadata } from 'next';
import Play from '@/components/Play';

export const metadata: Metadata = {
  title: 'Игра · Ilya ♥ Aigul',
  description: 'Фотозадания, очки и призы для гостей свадьбы.',
};

export default function PlayPage() {
  return <Play />;
}
