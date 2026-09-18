'use client';

import type { TemplateId } from '@/lib/invoice';

/**
 * A miniature of each template.
 *
 * Drawn as a few divs rather than a screenshot: it stays truthful when a
 * template changes, costs no image request, and picks up the chosen accent.
 */
export function TemplateThumb({ id, accent }: { id: TemplateId; accent: string }) {
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
