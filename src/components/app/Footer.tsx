import Link from 'next/link';
import { SEO_PAGES } from '@/lib/seo-pages';
import { t } from '@/lib/i18n';

/** A quiet footer: the trust line, the landing pages and privacy. */
export function Footer() {
  return (
    <footer className="app-footer no-print border-t border-line">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
        <p className="text-[12px] text-ink-subtle">{t.trustLine}</p>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <li>
              <Link
                href="/templates"
                className="inline-flex min-h-11 items-center text-[12px] text-ink-muted underline-offset-2 transition-colors hover:text-ink hover:underline sm:min-h-0"
              >
                Templates
              </Link>
            </li>
            {SEO_PAGES.map((page) => (
              <li key={page.slug}>
                <Link
                  href={`/${page.slug}`}
                  className="inline-flex min-h-11 items-center text-[12px] text-ink-muted underline-offset-2 transition-colors hover:text-ink hover:underline sm:min-h-0"
                >
                  {page.h1}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/privacy"
                className="inline-flex min-h-11 items-center text-[12px] text-ink-muted underline-offset-2 transition-colors hover:text-ink hover:underline sm:min-h-0"
              >
                Privacy
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
