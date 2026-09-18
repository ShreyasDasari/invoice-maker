import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'What Invoice Maker stores and what it does not. Invoices are built in your browser and never uploaded.',
  alternates: { canonical: '/privacy' },
};

/**
 * The privacy page.
 *
 * Short, specific and checkable against the code, which is the only kind of
 * privacy statement worth writing.
 */
export default function PrivacyPage() {
  return (
    <AppShell>
      <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink">
          Privacy
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
          An invoice carries your customer&apos;s name, address and what you charged them. That
          is not data this site wants to hold.
        </p>

        <section className="mt-10">
          <h2 className="text-[17px] font-semibold tracking-tight text-ink">
            Your invoice is never uploaded
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
            The editor, the totals and the PDF all run in your browser. There is no server that
            receives an invoice, because there is no step that needs one. Closing the tab is
            enough to be rid of it.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-[17px] font-semibold tracking-tight text-ink">
            What is stored, and where
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
            So that a second invoice takes seconds rather than minutes, the following is kept in
            this browser&apos;s local storage — on your own device, readable by nothing but this
            site:
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {[
              'The invoice you are working on, so a closed tab is not lost work.',
              'Your business details, if you choose to save them.',
              'Your recent invoices, up to the last 25.',
              'Preferences: currency, template, accent colour, date format and theme.',
            ].map((line) => (
              <li
                key={line}
                className="relative pl-4 text-[14px] leading-relaxed text-ink-muted before:absolute before:left-0 before:top-[0.6em] before:size-1 before:rounded-full before:bg-ink-subtle before:content-['']"
              >
                {line}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
            Clearing your browser&apos;s site data removes all of it. Nothing is synced between
            devices, because nothing leaves the one you are on.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-[17px] font-semibold tracking-tight text-ink">Share links</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
            A share link carries the invoice inside the part of the URL after the{' '}
            <code className="rounded bg-surface px-1 py-0.5 text-[13px]">#</code>. Browsers never
            send that part to a server, so a shared invoice stays between the people holding the
            link. There are no invoice IDs to guess, because there is no store to look them up in.
            Treat the link itself as confidential.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-[17px] font-semibold tracking-tight text-ink">Logos</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
            A logo you add is read, resized and redrawn by your browser, then embedded in your PDF.
            It is not uploaded anywhere.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-[17px] font-semibold tracking-tight text-ink">
            Cookies and tracking
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
            No cookies are set, and no analytics or advertising scripts are loaded. Nothing about
            this site requires consent to a banner, so there is no banner.
          </p>
        </section>

        <div className="mt-12">
          <Link
            href="/create"
            className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-[13px] font-medium text-primary-ink transition-colors hover:bg-primary-hover"
          >
            Create an invoice
          </Link>
        </div>
      </article>
    </AppShell>
  );
}
