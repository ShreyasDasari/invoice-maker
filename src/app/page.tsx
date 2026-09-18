import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { LandingHero } from '@/components/marketing/LandingHero';
import { LegacyShareRedirect } from '@/components/marketing/LegacyShareRedirect';
import { ExampleSheet } from '@/components/marketing/ExampleSheet';
import { SITE, absoluteUrl } from '@/lib/site';
import {
  CheckIcon,
  DownloadIcon,
  FileTextIcon,
  PencilIcon,
  PrinterIcon,
  ShareIcon,
} from '@/components/ui/Icons';

export const metadata: Metadata = {
  title: SITE.title,
  description: SITE.description,
  alternates: { canonical: '/' },
};

/**
 * The home page.
 *
 * It shows the finished invoice before asking for anything, because that is
 * what a first-time visitor wants to know: what will I end up with. The editor
 * is one click away and needs no account, so the extra step costs a click and
 * buys the answer.
 */

const STEPS = [
  {
    Icon: PencilIcon,
    title: 'Fill in the details',
    body: 'Opens with your invoice number, today’s date and a due date already set. Change what is yours.',
  },
  {
    Icon: FileTextIcon,
    title: 'Watch it build',
    body: 'The invoice updates as you type. Totals, tax and discounts are calculated for you, exactly.',
  },
  {
    Icon: DownloadIcon,
    title: 'Take the PDF',
    body: 'A print-ready file with selectable text. Download it, print it, or share a link.',
  },
];

const FEATURES = [
  { title: 'Exact totals', body: 'Money is handled as precise decimals, so a hundred-line invoice still adds up to the penny.' },
  { title: 'Tax the way you charge it', body: 'One rate across the invoice, or a different one per line. VAT, GST and sales tax all read correctly.' },
  { title: 'Any currency', body: 'Over forty, each with its own symbol, grouping and decimal places — including yen and dinar.' },
  { title: 'Your brand, lightly', body: 'A logo, one accent colour and a typeface. Enough to look like you, not a design project.' },
  { title: 'Fits one page', body: 'One switch scales the whole document down until it lands on a single sheet.' },
  { title: 'Nothing uploaded', body: 'The editor, the totals and the PDF all run in your browser. No account, no server copy.' },
];

export default function HomePage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE.name,
    url: absoluteUrl('/'),
    description: SITE.description,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free. No account required, no watermark.',
    },
    featureList: [
      'Create and download PDF invoices',
      'Automatic tax, discount and total calculation',
      'Multi-currency support',
      'Three professional templates',
      'Works without an account',
    ],
  };

  return (
    <AppShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* Share links used to point at "/" — send those straight to the editor. */}
      <LegacyShareRedirect />

      <LandingHero />

      {/* How it works */}
      <section id="how" className="scroll-mt-20 border-t border-line/60 py-14 sm:py-20">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
          <h2 className="text-center text-[24px] font-semibold tracking-tight text-ink sm:text-[30px]">
            Three steps, about a minute
          </h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="glass glass-sheen rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-ink">
                    <step.Icon size={17} />
                  </span>
                  <span className="text-[12px] font-semibold uppercase tracking-[0.09em] text-ink-subtle">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-[16px] font-semibold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* What the invoice looks like */}
      <section className="border-t border-line/60 py-14 sm:py-20">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-14">
          <div className="min-w-0">
            <h2 className="text-[24px] font-semibold tracking-tight text-ink sm:text-[30px]">
              An invoice a finance team will accept
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
              Plain, well-aligned and readable in black and white — the document an established
              supplier sends. Every field a customer needs to pay you without emailing first:
              a unique number, both addresses, tax registration, a clear breakdown and one total.
            </p>
            <ul className="mt-6 flex flex-col gap-2.5">
              {[
                'Selectable text, so accounting software can read it',
                'Sensible page breaks, with the table header repeated',
                'Prints identically to the file you download',
                'A4 or Letter, whichever your client expects',
              ].map((line) => (
                <li key={line} className="flex items-start gap-2 text-[14px] text-ink-muted">
                  <CheckIcon size={15} className="mt-0.5 shrink-0 text-success" />
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/templates"
                className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-ink transition-colors hover:bg-primary-hover"
              >
                Compare the templates
              </Link>
              <span className="inline-flex h-11 items-center gap-2 text-[13px] text-ink-subtle">
                <PrinterIcon size={15} /> Print
                <ShareIcon size={15} className="ml-2" /> Share
                <DownloadIcon size={15} className="ml-2" /> PDF
              </span>
            </div>
          </div>

          <div className="glass glass-sheen min-w-0 rounded-xl p-3 sm:p-5">
            <ExampleSheet template="modern" maxScale={0.72} cropHeight={620} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-line/60 py-14 sm:py-20">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
          <h2 className="text-[24px] font-semibold tracking-tight text-ink sm:text-[30px]">
            What it handles
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="glass glass-sheen rounded-xl p-5">
                <h3 className="text-[15px] font-semibold text-ink">{feature.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="border-t border-line/60 py-16 sm:py-24">
        <div className="mx-auto max-w-[760px] px-4 text-center sm:px-6">
          <h2 className="text-[26px] font-semibold tracking-tight text-ink sm:text-[32px]">
            Ready when you are
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-muted">
            The editor opens with everything filled in. Change what is yours and take the PDF.
          </p>
          <Link
            href="/create"
            className="mt-7 inline-flex h-12 items-center rounded-lg bg-primary px-7 text-[15px] font-semibold text-primary-ink shadow-[0_6px_20px_rgb(30_58_95/0.28)] transition-all duration-150 hover:bg-primary-hover active:scale-[0.99]"
          >
            Create an invoice
          </Link>
          <p className="mt-4 text-[12px] text-ink-subtle">
            Free to use. No account required. No watermark.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
