import Link from 'next/link';
import { EVENT } from '@/lib/event';

// Shown instead of the game while `game_public` is false, so guests who guess the URL
// don't get the surprise spoiled.
export default function ComingSoon() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-3xl italic">{EVENT.names.ru}</p>
      <p className="text-ink-muted">
        Здесь кое-что появится 8 августа. Немного терпения 💛
      </p>
      <Link href="/" className="text-sm font-semibold text-accent underline">
        ← на страницу приглашения
      </Link>
    </main>
  );
}
