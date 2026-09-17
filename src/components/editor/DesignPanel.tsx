'use client';

/**
 * Template, accent colour, typeface and paper size.
 *
 * Deliberately four choices and no more. A logo, one colour and a layout are
 * enough to look like your business; anything past that turns an invoice into
 * a design task, which is not what the visitor came here to do.
 */

import { SelectField } from '@/components/ui/Field';
import { CheckIcon } from '@/components/ui/Icons';
import type { Branding, Invoice, PaperSize, TemplateId } from '@/lib/invoice';
import {
  ACCENT_PRESETS,
  FONT_CHOICES,
  PAPER_LIST,
  TEMPLATE_LIST,
  isValidHex,
  safeHex,
} from '@/lib/templates';
import { track } from '@/lib/analytics';
import { t } from '@/lib/i18n';
import { Panel } from './Panel';

export function DesignPanel({
  invoice,
  onPatch,
  onPatchBranding,
}: {
  invoice: Invoice;
  onPatch: (patch: Partial<Invoice>) => void;
  onPatchBranding: (patch: Partial<Branding>) => void;
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
                  ? 'border-ink bg-surface'
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
                  selected ? 'border-ink' : 'border-transparent'
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
              {font.name}
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
    </Panel>
  );
}

/**
 * A miniature of each template.
 *
 * Drawn as a few divs rather than a screenshot: it stays truthful when a
 * template changes, costs no image request, and picks up the chosen accent.
 */
function TemplateThumb({ id, accent }: { id: TemplateId; accent: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex aspect-[1/1.3] w-full flex-col gap-[3px] overflow-hidden rounded-sm border border-line bg-white p-1.5"
    >
      {id === 'modern' ? (
        <span className="-mx-1.5 -mt-1.5 mb-0.5 h-3.5" style={{ backgroundColor: accent }} />
      ) : null}

      <span className="flex items-start justify-between gap-1">
        <span className="flex flex-col gap-[2px]">
          <span className="block h-1 w-5 rounded-full bg-neutral-800" />
          <span className="block h-[3px] w-4 rounded-full bg-neutral-300" />
        </span>
        {id !== 'modern' ? (
          <span
            className="block h-1.5 w-3.5 rounded-sm"
            style={{ backgroundColor: id === 'minimal' ? 'transparent' : accent, border: id === 'minimal' ? `1px solid ${accent}` : undefined }}
          />
        ) : null}
      </span>

      {id === 'classic' ? (
        <span className="block h-[2px] w-full" style={{ backgroundColor: accent }} />
      ) : null}

      <span
        className="mt-0.5 block h-[5px] w-full rounded-sm"
        style={{
          backgroundColor:
            id === 'modern' ? accent : id === 'classic' ? 'rgb(229 229 229)' : 'transparent',
          borderBottom: id === 'minimal' ? '1px solid rgb(64 64 64)' : undefined,
        }}
      />

      {[0, 1, 2].map((row) => (
        <span
          key={row}
          className="block h-[3px] w-full rounded-full bg-neutral-200"
          style={{ borderBottom: id === 'minimal' ? 'none' : undefined }}
        />
      ))}

      <span className="mt-auto flex justify-end">
        <span
          className="block h-2 w-7 rounded-sm"
          style={{
            backgroundColor: id === 'modern' ? `${accent}22` : 'transparent',
            borderTop: id === 'classic' ? '2px solid rgb(23 23 23)' : id === 'minimal' ? '1px solid rgb(212 212 212)' : undefined,
            border: id === 'modern' ? `1px solid ${accent}55` : undefined,
          }}
        />
      </span>
    </span>
  );
}
