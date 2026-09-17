'use client';

/**
 * The header.
 *
 * A wordmark, three destinations and the theme control. No pricing link, since
 * there is nothing to sell; no eight-item navigation, since there are not eight
 * things worth doing here.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileTextIcon } from '@/components/ui/Icons';
import { ThemeToggle } from './ThemeToggle';
import { t } from '@/lib/i18n';

const LINKS = [
  { href: '/', label: t.nav.create },
  { href: '/recent', label: t.nav.recent },
  { href: '/invoice-template', label: t.nav.templates },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="app-header sticky top-0 z-40 h-[var(--header-height)] border-b border-line bg-canvas/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-[1600px] items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Link
          href="/"
          // Negative margin plus padding gives the wordmark a 44px tap target
          // on a phone without changing where it sits.
          className="-m-2 flex min-h-11 shrink-0 items-center gap-2 rounded p-2 text-[15px] font-semibold tracking-tight text-ink sm:m-0 sm:min-h-0 sm:p-0"
          aria-label={`${t.brand} — home`}
        >
          <span className="grid size-6 place-items-center rounded bg-ink text-canvas" aria-hidden="true">
            <FileTextIcon size={14} />
          </span>
          <span className="hidden sm:inline">{t.brand}</span>
        </Link>

        <nav aria-label="Main" className="min-w-0 flex-1">
          <ul className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
            {LINKS.map((link) => {
              // The editor is the home route, so only an exact match is current.
              const current = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={current ? 'page' : undefined}
                    className={`inline-flex h-11 items-center whitespace-nowrap rounded-md px-2.5 text-[13px] transition-colors duration-150 ease-[var(--ease-out-quick)] sm:h-8 ${
                      current
                        ? 'bg-surface font-medium text-ink'
                        : 'text-ink-muted hover:bg-surface hover:text-ink'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
