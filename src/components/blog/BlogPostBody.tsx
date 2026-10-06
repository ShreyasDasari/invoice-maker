import Link from 'next/link';
import type { BlogPost } from '@/lib/blog-posts';
import { formatPostDate, getBlogPost } from '@/lib/blog-posts';
import { SITE, absoluteUrl } from '@/lib/site';
import { ChevronRightIcon } from '@/components/ui/Icons';
import { InvoiceDemo } from './InvoiceDemo';
import { t } from '@/lib/i18n';

/**
 * A single post.
 *
 * The same reading column as the landing pages. Emitted as BlogPosting,
 * FAQPage and BreadcrumbList structured data so search results can show the
 * date, the questions and the path back to the blog.
 */
export function BlogPostBody({ post }: { post: BlogPost }) {
  const url = absoluteUrl(`/blog/${post.slug}`);

  const articleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.h1,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: url,
    url,
    author: { '@type': 'Organization', name: SITE.name, url: absoluteUrl('/') },
    publisher: { '@type': 'Organization', name: SITE.name, url: absoluteUrl('/') },
  };

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faqs.map((faq) => ({
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
      { '@type': 'ListItem', position: 2, name: 'Blog', item: absoluteUrl('/blog') },
      { '@type': 'ListItem', position: 3, name: post.h1, item: url },
    ],
  };

  const related = post.related
    .map((slug) => getBlogPost(slug))
    .filter((entry): entry is BlogPost => entry !== undefined);

  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1 text-[12px] text-ink-subtle">
          <li>
            <Link href="/" className="underline-offset-2 hover:text-ink hover:underline">
              Invoice Maker
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRightIcon size={12} />
          </li>
          <li>
            <Link href="/blog" className="underline-offset-2 hover:text-ink hover:underline">
              Blog
            </Link>
          </li>
        </ol>
      </nav>

      <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink sm:text-[32px]">
        {post.h1}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{post.excerpt}</p>
      <p className="mt-3 text-[12px] text-ink-subtle">
        {post.updatedAt === post.publishedAt ? 'Published ' : 'Updated '}
        <time dateTime={post.updatedAt}>{formatPostDate(post.updatedAt)}</time>
      </p>

      {post.demo ? (
        <div className="mt-8">
          <InvoiceDemo />
        </div>
      ) : null}

      <div className="mt-10 flex flex-col gap-10">
        {post.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-[19px] font-semibold tracking-tight text-ink">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-2.5 text-[15px] leading-relaxed text-ink-muted">
                {paragraph}
              </p>
            ))}
            {section.points ? (
              <ul className="mt-3 flex flex-col gap-2">
                {section.points.map((point) => (
                  <li
                    key={point}
                    className="relative pl-4 text-[15px] leading-relaxed text-ink-muted before:absolute before:left-0 before:top-[0.65em] before:size-1 before:rounded-full before:bg-ink-subtle before:content-['']"
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
        <h2 className="text-[19px] font-semibold tracking-tight text-ink">Questions</h2>
        <dl className="mt-4 flex flex-col divide-y divide-line">
          {post.faqs.map((faq) => (
            <div key={faq.question} className="py-4 first:pt-0">
              <dt className="text-[15px] font-medium text-ink">{faq.question}</dt>
              <dd className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="glass glass-sheen mt-12 flex flex-col items-start gap-3 rounded-xl p-6">
        <p className="text-[15px] font-medium text-ink">Make your invoice now.</p>
        <p className="text-[13px] text-ink-muted">{t.trustLine}</p>
        <Link
          href="/create"
          className="mt-1 inline-flex h-11 items-center rounded-lg bg-primary px-4 text-[13px] font-semibold text-primary-ink transition-colors duration-150 hover:bg-primary-hover"
        >
          {t.nav.create}
        </Link>
      </div>

      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">Keep reading</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {related.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={`/blog/${entry.slug}`}
                  className="inline-flex min-h-11 items-center text-[14px] font-medium text-accent underline-offset-2 hover:underline sm:min-h-0"
                >
                  {entry.h1}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
