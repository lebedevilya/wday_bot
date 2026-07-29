import Link from 'next/link';

export const GROUPS = ['unknown', 'kids', 'aigul_family', 'aigul_friends', 'ilya_family', 'ilya_friends'];
export const STATUSES = ['inactive', 'target', 'playing'];

export const input = 'rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink';
export const btn =
  'cursor-pointer rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-ink transition hover:opacity-90 active:scale-[0.98]';
export const btnGhost =
  'cursor-pointer rounded-lg border border-line px-3 py-2 text-sm text-ink-muted transition hover:border-accent hover:text-ink active:scale-[0.98]';

// what each action reports back through ?msg=
const MESSAGES: Record<string, { text: string; ok: boolean }> = {
  welcome: { text: 'Signed in.', ok: true },
  saved: { text: 'Saved.', ok: true },
  created: { text: 'Created.', ok: true },
  saved_with_photo: { text: 'Saved, reference photo uploaded.', ok: true },
  deleted: { text: 'Deleted.', ok: true },
  unbound: { text: 'Unbound — that name can be claimed again.', ok: true },
  approved: { text: 'Approved, points awarded.', ok: true },
  rejected: { text: 'Rejected, points revoked.', ok: true },
  hidden: { text: 'Photo hidden from the wall.', ok: true },
  points_reset: { text: 'Points and tasks reset.', ok: true },
  name_required: { text: 'Name is required — nothing was saved.', ok: false },
  bad_json: { text: 'That is not valid JSON — settings unchanged.', ok: false },
  photo_failed: { text: 'Saved, but the photo upload failed.', ok: false },
  error: { text: 'The database rejected that. Nothing changed.', ok: false },
};

export function Flash({ msg, dismissHref }: { msg?: string; dismissHref: string }) {
  const flash = msg ? MESSAGES[msg] : undefined;
  if (!flash) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`mb-6 flex items-center justify-between gap-4 rounded-xl px-4 py-3 text-sm font-semibold ${
        flash.ok ? 'bg-ok/15 text-ok' : 'bg-danger/15 text-danger'
      }`}
    >
      <span>
        {flash.ok ? '✓' : '✕'} {flash.text}
      </span>
      <Link href={dismissHref} aria-label="Dismiss" className="cursor-pointer px-1 text-ink-muted hover:text-ink">
        ✕
      </Link>
    </div>
  );
}
