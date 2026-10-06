import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { BLOG_POSTS, formatPostDate } from '@/lib/blog-posts';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Invoicing Guides for Freelancers and Small Businesses',
  description:
    'Plain-English guides to making invoices, what to include, and payment terms, for freelancers and small businesses in the US, UK and India.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Invoicing Guides for Freelancers and Small Businesses',
    description:
      'Plain-English guides to making invoices, what to include, and payment terms in the US, UK and India.',
    url: absoluteUrl('/blog'),
    type: 'website',
  },
};

export default function BlogIndexPage() {
  const posts = [...BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Invoice Maker blog',
    url: absoluteUrl('/blog'),
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.h1,
      url: absoluteUrl(`/blog/${post.slug}`),
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
    })),
  };

  return (
    <AppShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink sm:text-[32px]">
          Invoicing guides
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
          How to make an invoice, what it needs to include, and how to get paid on time. Written for
          freelancers and small businesses in the US, the UK and India.
        </p>

        <ul className="mt-10 flex flex-col divide-y divide-line border-t border-line">
          {posts.map((post) => (
            <li key={post.slug} className="py-6">
              <h2 className="text-[17px] font-semibold tracking-tight text-ink">
                <Link
                  href={`/blog/${post.slug}`}
                  className="underline-offset-2 hover:text-primary hover:underline"
                >
                  {post.h1}
                </Link>
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">{post.excerpt}</p>
              <p className="mt-2 text-[12px] text-ink-subtle">
                <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
