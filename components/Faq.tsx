'use client';

import { EVENT } from '@/lib/event';
import type { Locale } from '@/lib/types';

// Native <details>: collapsed by default, keyboard accessible, and findable with the
// browser's own in-page search — none of which we'd get for free from a JS accordion.
export default function Faq({ locale }: { locale: Locale }) {
  const t = (d: Record<Locale, string>) => d[locale] ?? d.ru;

  return (
    <section id="faq" className="border-t border-line px-6 py-20">
      <h2 className="mb-10 text-center font-display text-3xl italic">{t(EVENT.ui.faqTitle)}</h2>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
        {EVENT.faq.map((item) => (
          <details key={item.q.ru} className="faq group rounded-2xl border border-line bg-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-semibold">
              <span>{t(item.q)}</span>
              <span
                aria-hidden
                className="faq-chevron shrink-0 text-xl text-accent"
              >
                +
              </span>
            </summary>
            <div className="faq-body px-5 pb-5 text-ink-muted">{t(item.a)}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
