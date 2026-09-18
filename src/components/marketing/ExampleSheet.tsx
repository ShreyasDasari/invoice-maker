'use client';

/**
 * A real invoice, shown at a readable size.
 *
 * This renders the same `InvoiceSheet` the editor previews and the PDF
 * mirrors, fed the shared example data. It is not a screenshot or a mockup, so
 * it cannot drift from the product: change a template and this changes with it.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Invoice, TemplateId } from '@/lib/invoice';
import { computeTotals } from '@/lib/calc';
import { createExampleInvoice, EXAMPLE_DATE_STYLE, EXAMPLE_LOCALE } from '@/lib/example-invoice';
import { getPaper, safeHex } from '@/lib/templates';
import { InvoiceSheet } from '@/components/preview/InvoiceSheet';

const PT = 96 / 72;

export interface ExampleSheetProps {
  template?: TemplateId;
  accentColor?: string;
  fontStyle?: Invoice['branding']['fontStyle'];
  /** Upper bound on the scale, so the page never blows the sheet up. */
  maxScale?: number;
  /**
   * Show only the top of the document, faded out at the cut. A full A4 page is
   * far taller than a hero, and the opening of an invoice is the part that
   * answers "what will I get".
   */
  cropHeight?: number;
  className?: string;
}

export function ExampleSheet({
  template = 'classic',
  accentColor,
  fontStyle,
  maxScale = 1,
  cropHeight,
  className = '',
}: ExampleSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [height, setHeight] = useState<number | null>(null);

  const invoice = useMemo(() => {
    const example = createExampleInvoice(template);
    return {
      ...example,
      branding: {
        accentColor: safeHex(accentColor ?? example.branding.accentColor),
        fontStyle: fontStyle ?? example.branding.fontStyle,
      },
    };
  }, [template, accentColor, fontStyle]);

  const totals = useMemo(() => computeTotals(invoice), [invoice]);
  const sheetWidth = getPaper(invoice.paperSize).width * PT;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      const available = container.clientWidth;
      if (available > 0) setScale(Math.min(maxScale, available / sheetWidth));
      const natural = sheetRef.current?.scrollHeight ?? 0;
      if (natural > 0) setHeight(natural);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    if (sheetRef.current) observer.observe(sheetRef.current);
    return () => observer.disconnect();
  }, [maxScale, sheetWidth, invoice]);

  const scaledHeight = height !== null ? height * scale : undefined;
  const boxHeight =
    cropHeight !== undefined && scaledHeight !== undefined
      ? Math.min(cropHeight, scaledHeight)
      : scaledHeight;
  const cropped = cropHeight !== undefined && (scaledHeight ?? 0) > cropHeight;

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <div
        // overflow-hidden matters: the sheet inside keeps its full page width
        // in layout (a transform does not resize the box), so without this it
        // would push the page wider than the viewport on a phone.
        className="mx-auto origin-top overflow-hidden"
        style={{
          width: sheetWidth * scale,
          height: boxHeight,
          ...(cropped
            ? {
                maskImage: 'linear-gradient(to bottom, #000 72%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, #000 72%, transparent 100%)',
              }
            : {}),
        }}
      >
        <div
          ref={sheetRef}
          style={{ width: sheetWidth, transform: `scale(${scale})`, transformOrigin: 'top left' }}
          className="overflow-hidden rounded-[3px] bg-white ring-1 ring-black/10 shadow-[0_2px_4px_rgb(15_23_42/0.06),0_24px_60px_rgb(15_23_42/0.16)]"
        >
          <InvoiceSheet
            invoice={invoice}
            totals={totals}
            locale={EXAMPLE_LOCALE}
            dateStyle={EXAMPLE_DATE_STYLE}
            showPlaceholders={false}
          />
        </div>
      </div>
    </div>
  );
}
