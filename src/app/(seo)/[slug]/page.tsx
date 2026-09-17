import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { SeoPageBody } from '@/components/seo/SeoPageBody';
import { SEO_PAGES, getSeoPage } from '@/lib/seo-pages';
import { absoluteUrl } from '@/lib/site';

/**
 * Landing pages for high-intent searches.
 *
 * One route backed by the `SEO_PAGES` registry, statically generated at build
 * time. Adding a page — a country, a currency, an industry — is a new entry in
 * that list, but only when there is something real to say on it: a route that
 * can spawn pages cheaply is exactly the route that must not spawn empty ones.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return SEO_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getSeoPage(slug);
  if (!page) return {};

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/${page.slug}` },
    openGraph: {
      title: page.title,
      description: page.description,
      url: absoluteUrl(`/${page.slug}`),
      type: 'website',
    },
  };
}

export default async function SeoLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getSeoPage(slug);
  if (!page) notFound();

  return (
    <AppShell>
      <SeoPageBody page={page} />
    </AppShell>
  );
}
