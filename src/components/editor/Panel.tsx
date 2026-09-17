'use client';

import type { ReactNode } from 'react';

/**
 * A titled block in the editor column.
 *
 * Sections are plain, separated by space and a hairline rather than boxed in
 * cards — a stack of cards inside a stack of cards is visual noise that helps
 * nobody fill in an invoice faster.
 */
export function Panel({
  title,
  action,
  children,
  id,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="flex flex-col gap-3 border-t border-line pt-5 first:border-t-0 first:pt-0">
      <div className="flex min-h-7 items-center justify-between gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-subtle">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
