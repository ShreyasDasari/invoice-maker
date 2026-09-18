import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { SEO_PAGES } from '@/lib/seo-pages';

export default function NotFound() {
  return (
    <AppShell>
      <div className="mx-auto flex max-w-lg flex-col items-start px-4 py-20 sm:px-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.09em] text-ink-subtle">
          404
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
          That page does not exist
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
          The invoice editor is where you probably meant to go.
        </p>
        <Link
          href="/create"
          className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-ink transition-colors hover:bg-primary-hover"
        >
          Create an invoice
        </Link>
        <nav className="mt-8" aria-label="Other pages">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {SEO_PAGES.map((page) => (
              <li key={page.slug}>
                <Link
                  href={`/${page.slug}`}
                  className="text-[13px] text-ink-muted underline-offset-2 hover:text-ink hover:underline"
                >
                  {page.h1}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </AppShell>
  );
}
