import type { Metadata } from 'next';
import { AppShell } from '@/components/app/AppShell';
import { TemplateGallery } from '@/components/marketing/TemplateGallery';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Invoice Templates — See Exactly What You Get',
  description:
    'Three professional invoice templates, shown as real invoices rather than mockups. Change the accent colour and typeface, then open the editor with your choice. Free, no signup.',
  alternates: { canonical: '/templates' },
  openGraph: {
    title: 'Invoice Templates — See Exactly What You Get',
    description:
      'Three professional invoice templates, shown as real invoices. Pick a colour and typeface, then start.',
    url: absoluteUrl('/templates'),
    type: 'website',
  },
};

export default function TemplatesPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Invoice templates',
    url: absoluteUrl('/templates'),
    description:
      'Three professional invoice templates you can preview in full and use for free.',
  };

  return (
    <AppShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
        <h1 className="max-w-2xl text-[30px] font-semibold leading-tight tracking-tight text-ink sm:text-[38px]">
          Invoice templates
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-muted">
          Each one below is a real invoice built by this tool, not a picture of one. Change the
          template, colour and typeface and the document updates — what you see is what downloads.
        </p>
      </div>

      <TemplateGallery />
    </AppShell>
  );
}
