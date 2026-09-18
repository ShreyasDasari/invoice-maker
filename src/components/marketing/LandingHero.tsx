'use client';

/**
 * The hero.
 *
 * The claim on the left, the finished article on the right. Showing the real
 * invoice is the argument — it answers "what will I actually get" before
 * anyone has typed a character, which is the question a first-time visitor is
 * really asking.
 */

import Link from 'next/link';
import { useState } from 'react';
import type { TemplateId } from '@/lib/invoice';
import { TEMPLATE_LIST } from '@/lib/templates';
import { ArrowDownIcon, CheckIcon } from '@/components/ui/Icons';
import { ExampleSheet } from './ExampleSheet';
import { t } from '@/lib/i18n';

const PROMISES = ['No signup', 'No watermark', 'Free forever'];

export function LandingHero() {
  const [template, setTemplate] = useState<TemplateId>('classic');

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-[1400px] items-start gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:py-16">
        <div className="flex min-w-0 flex-col items-start lg:pt-6">
          <span className="glass glass-sheen inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-medium text-ink-muted">
            <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
            Free, and it stays free
          </span>

          <h1 className="mt-5 text-[34px] font-semibold leading-[1.08] tracking-tight text-ink sm:text-[44px] lg:text-[52px]">
            Make an invoice.
            <br />
            <span className="text-primary">Free.</span>
          </h1>

          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-muted sm:text-base">
            A professional, print-ready invoice in about a minute. Fill in your details, watch it
            build beside you, download the PDF. Nothing to install, nothing to sign up for.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {PROMISES.map((promise) => (
              <li key={promise} className="flex items-center gap-1.5 text-[13px] text-ink-muted">
                <CheckIcon size={14} className="shrink-0 text-success" />
                {promise}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/create"
              className="inline-flex h-12 items-center rounded-lg bg-primary px-6 text-[15px] font-semibold text-primary-ink shadow-[0_6px_20px_rgb(30_58_95/0.28)] transition-all duration-150 ease-[var(--ease-out-quick)] hover:bg-primary-hover hover:shadow-[0_8px_26px_rgb(30_58_95/0.34)] active:scale-[0.99]"
            >
              {t.nav.create}
            </Link>
            <Link
              href="/templates"
              className="glass inline-flex h-12 items-center rounded-lg px-5 text-[15px] font-medium text-ink transition-colors duration-150 hover:text-primary"
            >
              See the templates
            </Link>
          </div>

          <p className="mt-4 text-[12px] text-ink-subtle">
            Built in your browser. Your invoice is never uploaded.
          </p>
        </div>

        {/* The actual document. */}
        <div className="relative min-w-0">
          <div
            className="glass glass-sheen rounded-xl p-3 sm:p-5"
            role="group"
            aria-label="Example invoice preview"
          >
            <div
              className="mb-3 flex items-center gap-1 rounded-lg bg-canvas/40 p-1"
              role="tablist"
              aria-label="Template"
            >
              {TEMPLATE_LIST.map((spec) => (
                <button
                  key={spec.id}
                  type="button"
                  role="tab"
                  aria-selected={template === spec.id}
                  onClick={() => setTemplate(spec.id)}
                  className={`h-11 flex-1 cursor-pointer rounded-md text-[13px] font-medium transition-colors duration-150 ease-[var(--ease-out-quick)] sm:h-9 ${
                    template === spec.id
                      ? 'bg-primary text-primary-ink'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {spec.name}
                </button>
              ))}
            </div>

            <ExampleSheet template={template} maxScale={0.78} cropHeight={520} />
          </div>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12px] text-ink-subtle">
            A real invoice from this tool — not a mockup.
            <Link href="/templates" className="inline-flex min-h-11 items-center font-medium text-accent underline-offset-2 hover:underline sm:min-h-0">
              See it in full
            </Link>
          </p>
        </div>
      </div>

      <div className="flex justify-center pb-8">
        <a
          href="#how"
          className="flex size-11 items-center justify-center rounded-full text-ink-subtle transition-colors hover:text-ink"
          aria-label="See how it works"
        >
          <ArrowDownIcon size={16} />
        </a>
      </div>
    </section>
  );
}
