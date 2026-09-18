'use client';

/**
 * Template, accent colour, typeface and paper size.
 *
 * Deliberately four choices and no more. A logo, one colour and a layout are
 * enough to look like your business; anything past that turns an invoice into
 * a design task, which is not what the visitor came here to do.
 */

import { SelectField, Toggle } from '@/components/ui/Field';
import { CheckIcon } from '@/components/ui/Icons';
import type { Branding, Invoice, PaperSize, TemplateId } from '@/lib/invoice';
import { TemplateThumb } from '@/components/ui/TemplateThumb';
import {
  ACCENT_PRESETS,
  MIN_FIT_SCALE,
  PAPER_LIST,
  TEMPLATE_LIST,
  isValidHex,
  safeHex,
} from '@/lib/templates';
import { FONT_CHOICES } from '@/lib/fonts';
import { track } from '@/lib/analytics';
import { t } from '@/lib/i18n';
import { Panel } from './Panel';

export function DesignPanel({
  invoice,
  fitScale,
  onPatch,
  onPatchBranding,
  onToggleOption,
}: {
  invoice: Invoice;
  /** The measured shrink factor, so the control can say what it will do. */
  fitScale: number;
  onPatch: (patch: Partial<Invoice>) => void;
  onPatchBranding: (patch: Partial<Branding>) => void;
  onToggleOption: (patch: Partial<Invoice['options']>) => void;
}) {
  const accent = safeHex(invoice.branding.accentColor);

  const selectTemplate = (template: TemplateId) => {
    onPatch({ template });
    track('template_selected', { template });
  };

  return (
    <Panel title={t.sections.design}>
      {/* Templates, as radio cards: the choice is visual, so the control is too. */}
      <div role="radiogroup" aria-label={t.fields.template} className="grid grid-cols-3 gap-2">
        {TEMPLATE_LIST.map((template) => {
          const selected = invoice.template === template.id;
          return (
            <button
              key={template.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => selectTemplate(template.id)}
              title={template.description}
              className={`group flex cursor-pointer flex-col gap-2 rounded-md border p-2 text-left transition-colors duration-150 ease-[var(--ease-out-quick)] ${
                selected
                  ? 'border-primary bg-accent-wash'
                  : 'border-line hover:border-line-strong hover:bg-surface'
              }`}
            >
              <TemplateThumb id={template.id} accent={accent} />
              <span className="flex items-center gap-1 text-[12px] font-medium text-ink">
                {template.name}
                {selected ? <CheckIcon size={12} className="text-accent" /> : null}
              </span>
            </button>
          );
        })}
      </div>

      {/* Accent */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-subtle">
          {t.fields.accent}
        </legend>
        <div className="flex flex-wrap items-center gap-1.5">
          {ACCENT_PRESETS.map((preset) => {
            const selected = accent === safeHex(preset.value);
            return (
              <button
                key={preset.value}
                type="button"
                aria-label={preset.name}
                aria-pressed={selected}
                title={preset.name}
                onClick={() => onPatchBranding({ accentColor: preset.value })}
                className={`tap-44 relative size-7 cursor-pointer rounded-full border-2 transition-transform duration-150 ease-[var(--ease-out-quick)] hover:scale-105 ${
                  selected ? 'border-primary' : 'border-transparent'
                }`}
                style={{ backgroundColor: preset.value }}
              />
            );
          })}

          {/* A custom colour, for a brand that is not in the row above. */}
          <label
            className="ml-1 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-[12px] text-ink-muted transition-colors hover:border-line-strong hover:text-ink sm:min-h-8"
            title="Choose a custom colour"
          >
            <input
              type="color"
              value={accent}
              onChange={(event) => {
                const next = event.target.value;
                if (isValidHex(next)) onPatchBranding({ accentColor: next });
              }}
              className="size-4 cursor-pointer appearance-none border-0 bg-transparent p-0"
              aria-label="Custom accent colour"
            />
            Custom
          </label>
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label={t.fields.font}
          value={invoice.branding.fontStyle}
          onChange={(event) =>
            onPatchBranding({ fontStyle: event.target.value as Branding['fontStyle'] })
          }
        >
          {FONT_CHOICES.map((font) => (
            <option key={font.id} value={font.id}>
              {font.name} — {font.description.split(' — ')[1] ?? font.description}
            </option>
          ))}
        </SelectField>

        <SelectField
          label={t.fields.paper}
          value={invoice.paperSize}
          onChange={(event) => onPatch({ paperSize: event.target.value as PaperSize })}
        >
          {PAPER_LIST.map((paper) => (
            <option key={paper.id} value={paper.id}>
              {paper.name}
            </option>
          ))}
        </SelectField>
      </div>

      {/*
       * Fit to one page.
       *
       * Scales the whole document — type, margins and row spacing together —
       * until it lands on a single sheet, rather than letting an invoice spill
       * two lines onto a second page.
       */}
      <div className="glass glass-sheen flex flex-col gap-1.5 rounded-xl p-3">
        <Toggle
          label="Fit to one page"
          checked={invoice.options.fitToPage}
          onChange={(next) => onToggleOption({ fitToPage: next })}
          description={
            invoice.options.fitToPage
              ? fitScale >= 0.999
                ? 'Already fits — nothing to shrink.'
                : fitScale <= MIN_FIT_SCALE + 0.001
                  ? `Scaled to ${Math.round(fitScale * 100)}%, the smallest size that stays readable. This invoice may still run over.`
                  : `Everything scaled to ${Math.round(fitScale * 100)}% to fit on one page.`
              : 'Shrink type and spacing together so the invoice lands on a single sheet.'
          }
        />
      </div>
    </Panel>
  );
}
