import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { t } from '@/lib/i18n';

/**
 * The page frame: skip link, header, content, footer.
 *
 * The skip link is the first thing in the tab order, so a keyboard user reaches
 * the invoice without walking the navigation on every visit.
 */
export function AppShell({
  children,
  showFooter = true,
}: {
  children: ReactNode;
  showFooter?: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only-focusable no-print absolute left-4 top-3 z-50 rounded-md bg-ink px-3 py-2 text-[13px] font-medium text-canvas"
      >
        {t.nav.skipToEditor}
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      {showFooter ? <Footer /> : null}
    </div>
  );
}
