'use client';

/**
 * The template gallery.
 *
 * Every control here changes the same live document, rendered by the same
 * component the editor uses. Choosing a template, an accent and a typeface
 * shows exactly what the PDF will contain, and "Use this template" carries
 * that choice into the editor rather than making the visitor set it up again.
 */

import Link from 'next/link';
import { useState } from 'react';
import type { FontStyleId, TemplateId } from '@/lib/invoice';
import { ACCENT_PRESETS, TEMPLATE_LIST } from '@/lib/templates';
import { FONT_CHOICES } from '@/lib/fonts';
import { CheckIcon, ChevronRightIcon } from '@/components/ui/Icons';
import { TemplateThumb } from '@/components/ui/TemplateThumb';
import { ExampleSheet } from './ExampleSheet';

export function TemplateGallery() {
  const [template, setTemplate] = useState<TemplateId>('classic');
  const [accent, setAccent] = useState(ACCENT_PRESETS[0]!.value);
  const [font, setFont] = useState<FontStyleId>('sans');

  const spec = TEMPLATE_LIST.find((item) => item.id === template)!;
  const useHref = `/create?template=${template}&accent=${encodeURIComponent(accent)}&font=${font}`;

  return (
    <div className="mx-auto grid max-w-[1400px] items-start gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-12">
      {/* Controls */}
      <div className="glass glass-sheen flex min-w-0 flex-col gap-6 rounded-xl p-5 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-subtle">
            Template
          </h2>
          <div role="radiogroup" aria-label="Template" className="mt-3 grid grid-cols-3 gap-2">
            {TEMPLATE_LIST.map((item) => {
              const selected = template === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setTemplate(item.id)}
                  className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-2 text-left transition-colors duration-150 ease-[var(--ease-out-quick)] ${
                    selected
                      ? 'border-primary bg-accent-wash'
                      : 'border-line hover:border-line-strong hover:bg-surface/60'
                  }`}
                >
                  <TemplateThumb id={item.id} accent={accent} />
                  <span className="flex items-center gap-1 text-[12px] font-medium text-ink">
                    {item.name}
                    {selected ? <CheckIcon size={12} className="text-primary" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">{spec.description}</p>
        </div>

        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-subtle">
            Accent
          </h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                aria-label={preset.name}
                aria-pressed={accent === preset.value}
                title={preset.name}
                onClick={() => setAccent(preset.value)}
                className={`tap-44 relative size-7 cursor-pointer rounded-full border-2 transition-transform duration-150 hover:scale-105 ${
                  accent === preset.value ? 'border-primary' : 'border-transparent'
                }`}
                style={{ backgroundColor: preset.value }}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-subtle">
            Typeface
          </h2>
          <div role="radiogroup" aria-label="Typeface" className="mt-3 flex flex-col gap-1.5">
            {FONT_CHOICES.map((choice) => {
              const selected = font === choice.id;
              return (
                <button
                  key={choice.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setFont(choice.id)}
                  className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors duration-150 ${
                    selected
                      ? 'border-primary bg-accent-wash'
                      : 'border-line hover:border-line-strong hover:bg-surface/60'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-ink">{choice.name}</span>
                    <span className="block truncate text-[11px] text-ink-subtle">
                      {choice.description.split(' — ')[1] ?? choice.description}
                    </span>
                  </span>
                  {selected ? <CheckIcon size={14} className="shrink-0 text-primary" /> : null}
                </button>
              );
            })}
          </div>
        </div>

        <Link
          href={useHref}
          className="inline-flex h-12 items-center justify-center gap-1.5 rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-ink transition-colors duration-150 hover:bg-primary-hover"
        >
          Use this template
          <ChevronRightIcon size={16} />
        </Link>
        <p className="-mt-3 text-center text-[11px] text-ink-subtle">
          Opens the editor with these settings. No account needed.
        </p>
      </div>

      {/* The document */}
      <div className="glass glass-sheen min-w-0 rounded-xl p-3 sm:p-6">
        <ExampleSheet template={template} accentColor={accent} fontStyle={font} maxScale={0.95} />
      </div>
    </div>
  );
}
