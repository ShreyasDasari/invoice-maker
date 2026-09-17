import Link from 'next/link';
import type { SeoPage } from '@/lib/seo-pages';
import { absoluteUrl } from '@/lib/site';
import { ChevronRightIcon } from '@/components/ui/Icons';
import { t } from '@/lib/i18n';

/**
 * The shared body for every landing page.
 *
 * Prose first, then the way into the tool. The FAQ is emitted as FAQPage
 * structured data as well as readable text, since the questions are the ones
 * people actually type.
 */
export function SeoPageBody({ page }: { page: SeoPage }) {
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Invoice Maker', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: page.h1, item: absoluteUrl(`/${page.slug}`) },
    ],
  };

  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1 text-[12px] text-ink-subtle">
          <li>
            <Link href="/" className="underline-offset-2 hover:text-ink hover:underline">
              Invoice Maker
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRightIcon size={12} />
          </li>
          <li aria-current="page" className="text-ink-muted">
            {page.h1}
          </li>
        </ol>
      </nav>

      <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink sm:text-[32px]">
        {page.h1}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{page.intro}</p>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-ink transition-colors duration-150 hover:bg-primary-hover"
        >
          {t.nav.create}
        </Link>
        <span className="text-[12px] text-ink-subtle">{t.trustLine}</span>
      </div>

      <div className="mt-12 flex flex-col gap-10">
        {page.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-[17px] font-semibold tracking-tight text-ink">
              {section.heading}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">{section.body}</p>
            {section.points ? (
              <ul className="mt-3 flex flex-col gap-2">
                {section.points.map((point) => (
                  <li
                    key={point}
                    className="relative pl-4 text-[14px] leading-relaxed text-ink-muted before:absolute before:left-0 before:top-[0.6em] before:size-1 before:rounded-full before:bg-ink-subtle before:content-['']"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <section className="mt-14 border-t border-line pt-8">
        <h2 className="text-[17px] font-semibold tracking-tight text-ink">Questions</h2>
        <dl className="mt-4 flex flex-col divide-y divide-line">
          {page.faqs.map((faq) => (
            <div key={faq.question} className="py-4 first:pt-0">
              <dt className="text-[14px] font-medium text-ink">{faq.question}</dt>
              <dd className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-12 flex flex-col items-start gap-3 rounded-md border border-line bg-surface p-6">
        <p className="text-[15px] font-medium text-ink">Ready when you are.</p>
        <p className="text-[13px] text-ink-muted">
          The editor opens with everything filled in. Change what is yours and take the PDF.
        </p>
        <Link
          href="/"
          className="mt-1 inline-flex h-10 items-center rounded-md bg-primary px-4 text-[13px] font-medium text-primary-ink transition-colors duration-150 hover:bg-primary-hover"
        >
          {t.nav.create}
        </Link>
      </div>
    </article>
  );
}
