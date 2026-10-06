'use client';

/**
 * An animated walk-through of making an invoice.
 *
 * Built from HTML rather than a video file: it is a few kilobytes, it follows
 * the site theme, and it can never go out of date with the real editor's
 * wording without a code change showing up in review. A scripted timeline
 * types into a mock editor on the left while a mock preview on the right
 * fills in, then the Download button is pressed.
 *
 * It starts when scrolled into view, loops, and can be paused. Visitors who
 * ask for reduced motion get the finished frame and a play button instead.
 */

import { useEffect, useRef, useState } from 'react';
import { DownloadIcon, PauseIcon, PlayIcon, PlusIcon } from '@/components/ui/Icons';

/** One thing that happens on the timeline. `at` and durations are in ms. */
type Action =
  | { at: number; kind: 'type'; field: Field; text: string; duration: number }
  | { at: number; kind: 'focus'; field: Field | null }
  | { at: number; kind: 'add-line' }
  | { at: number; kind: 'press' }
  | { at: number; kind: 'caption'; text: string };

type Field = 'business' | 'customer' | 'description' | 'quantity' | 'rate' | 'tax';

interface Frame {
  business: string;
  customer: string;
  description: string;
  quantity: string;
  rate: string;
  tax: string;
  focus: Field | null;
  lineAdded: boolean;
  pressed: boolean;
  caption: string;
}

const EMPTY: Frame = {
  business: '',
  customer: '',
  description: '',
  quantity: '',
  rate: '',
  tax: '',
  focus: null,
  lineAdded: false,
  pressed: false,
  caption: '',
};

const SCRIPT: readonly Action[] = [
  { at: 0, kind: 'caption', text: 'Step 1: Add your business details' },
  { at: 300, kind: 'focus', field: 'business' },
  { at: 500, kind: 'type', field: 'business', text: 'Northwind Studio', duration: 1300 },

  { at: 2200, kind: 'caption', text: "Step 2: Add your customer's details" },
  { at: 2300, kind: 'focus', field: 'customer' },
  { at: 2500, kind: 'type', field: 'customer', text: 'Acme Ltd', duration: 800 },

  { at: 3700, kind: 'caption', text: 'Step 3: List the work, line by line' },
  { at: 3800, kind: 'add-line' },
  { at: 4100, kind: 'focus', field: 'description' },
  { at: 4300, kind: 'type', field: 'description', text: 'Website design', duration: 1200 },
  { at: 5700, kind: 'focus', field: 'quantity' },
  { at: 5900, kind: 'type', field: 'quantity', text: '1', duration: 150 },
  { at: 6300, kind: 'focus', field: 'rate' },
  { at: 6500, kind: 'type', field: 'rate', text: '1200', duration: 500 },

  { at: 7500, kind: 'caption', text: 'Step 4: Add tax, shown separately' },
  { at: 7600, kind: 'focus', field: 'tax' },
  { at: 7800, kind: 'type', field: 'tax', text: '10', duration: 300 },
  { at: 8400, kind: 'focus', field: null },

  { at: 9200, kind: 'caption', text: 'Step 5: Download the PDF' },
  { at: 9900, kind: 'press' },
];

/** The frame hold at the end before the loop restarts. */
const TOTAL_MS = 12_500;

const CURRENCY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function frameAt(elapsed: number): Frame {
  const frame: Frame = { ...EMPTY };
  for (const action of SCRIPT) {
    if (action.at > elapsed) continue;
    switch (action.kind) {
      case 'type': {
        const progress = Math.min(1, (elapsed - action.at) / action.duration);
        frame[action.field] = action.text.slice(0, Math.round(progress * action.text.length));
        break;
      }
      case 'focus':
        frame.focus = action.field;
        break;
      case 'add-line':
        frame.lineAdded = true;
        break;
      case 'press':
        frame.pressed = true;
        break;
      case 'caption':
        frame.caption = action.text;
        break;
    }
  }
  return frame;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

export function InvoiceDemo() {
  const reducedMotion = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [inView, setInView] = useState(false);
  /** True once the visitor has pressed pause or play, so scrolling stops deciding. */
  const [userControlled, setUserControlled] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Autoplay while in view, unless the visitor took control or asked for less motion.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (userControlled || reducedMotion) return;
    setPlaying(inView);
  }, [inView, userControlled, reducedMotion]);

  // The clock. Wall time so a background tab does not stretch the typing.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      setElapsed((previous) => (previous + delta) % TOTAL_MS);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // Someone who asked for reduced motion sees the finished invoice.
  const frame = reducedMotion && !userControlled ? frameAt(TOTAL_MS) : frameAt(elapsed);

  const quantity = Number.parseFloat(frame.quantity) || 0;
  const rate = Number.parseFloat(frame.rate) || 0;
  const subtotal = quantity * rate;
  const tax = subtotal * ((Number.parseFloat(frame.tax) || 0) / 100);
  const total = subtotal + tax;

  const toggle = () => {
    setUserControlled(true);
    setPlaying((current) => !current);
  };

  const field = (name: Field, placeholder: string, extra = '') => (
    <div
      className={`flex h-8 items-center rounded-md border bg-raised px-2.5 text-[12px] transition-colors duration-150 ${
        frame.focus === name ? 'border-accent ring-2 ring-accent/20' : 'border-line'
      } ${extra}`}
    >
      {frame[name] ? (
        <span className="truncate text-ink">{frame[name]}</span>
      ) : (
        <span className="truncate text-ink-subtle">{placeholder}</span>
      )}
      {frame.focus === name ? (
        <span aria-hidden="true" className="demo-caret ml-px inline-block h-4 w-px bg-ink" />
      ) : null}
    </div>
  );

  return (
    <div
      ref={rootRef}
      className="glass glass-sheen overflow-hidden rounded-xl"
      role="group"
      aria-label="Demo: making an invoice in the editor"
    >
      {/* Everything that moves is decorative for a screen reader; the caption is the text. */}
      <div aria-hidden="true" className="grid gap-3 p-3 sm:grid-cols-[1.1fr_1fr] sm:gap-4 sm:p-4">
        {/* The mock editor. */}
        <div className="flex flex-col gap-4 rounded-lg bg-canvas/60 p-3 sm:p-4">
          <section className="flex flex-col gap-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-subtle">
              Your business
            </h3>
            {field('business', 'Business name')}
          </section>

          <section className="flex flex-col gap-2 border-t border-line pt-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-subtle">
              Bill to
            </h3>
            {field('customer', 'Customer name')}
          </section>

          <section className="flex flex-col gap-2 border-t border-line pt-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-subtle">
                Items
              </h3>
              <span
                className={`inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium transition-colors duration-150 ${
                  frame.lineAdded && !frame.description ? 'bg-accent-wash text-accent' : 'text-ink-muted'
                }`}
              >
                <PlusIcon size={11} /> Add line
              </span>
            </div>
            {frame.lineAdded ? (
              <div className="grid grid-cols-[1fr_44px_64px] gap-1.5">
                {field('description', 'Description')}
                {field('quantity', 'Qty', 'justify-end')}
                {field('rate', 'Rate', 'justify-end')}
              </div>
            ) : (
              <div className="h-8 rounded-md border border-dashed border-line" />
            )}
          </section>

          <section className="flex flex-col gap-2 border-t border-line pt-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-subtle">
              Tax
            </h3>
            <div className="grid grid-cols-[64px_1fr] gap-1.5">
              {field('tax', '0', 'justify-end')}
              <div className="flex h-8 items-center px-1 text-[12px] text-ink-muted">%</div>
            </div>
          </section>

          <div className="mt-auto border-t border-line pt-3">
            <span
              className={`inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[12px] font-semibold text-primary-ink transition-transform duration-150 ${
                frame.pressed ? 'scale-[0.97] brightness-110' : ''
              }`}
            >
              <DownloadIcon size={13} />
              {frame.pressed ? 'Downloading…' : 'Download PDF'}
            </span>
          </div>
        </div>

        {/* The mock preview: a sheet that fills in as the editor is typed into. */}
        <div className="flex min-h-[260px] flex-col rounded-md bg-white p-4 text-[11px] text-slate-700 shadow-[var(--shadow-pop)] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                Invoice
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-slate-500">INV-0001</div>
            </div>
            <div className="min-h-[14px] text-right text-[12px] font-semibold text-slate-900">
              {frame.business}
            </div>
          </div>

          <div className="mt-4 min-h-[26px]">
            <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Bill to
            </div>
            <div className="mt-0.5 text-[11px] text-slate-900">{frame.customer}</div>
          </div>

          <table className="mt-4 w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[9px] uppercase tracking-[0.08em] text-slate-400">
                <th className="py-1 text-left font-semibold">Description</th>
                <th className="py-1 text-right font-semibold">Qty</th>
                <th className="py-1 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="min-h-[20px] py-1.5 text-slate-900">{frame.description}</td>
                <td className="py-1.5 text-right tabular-nums">{frame.quantity}</td>
                <td className="py-1.5 text-right tabular-nums">
                  {subtotal > 0 ? CURRENCY.format(subtotal) : ''}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-auto flex flex-col items-end gap-0.5 pt-4 tabular-nums">
            <div className="flex w-32 justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{CURRENCY.format(subtotal)}</span>
            </div>
            <div className="flex w-32 justify-between text-slate-500">
              <span>Tax {frame.tax ? `${frame.tax}%` : ''}</span>
              <span>{CURRENCY.format(tax)}</span>
            </div>
            <div className="mt-1 flex w-32 justify-between border-t border-slate-900 pt-1 text-[12px] font-semibold text-slate-900">
              <span>Total</span>
              <span>{CURRENCY.format(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* The player bar: caption, progress and the one control. */}
      <div className="flex items-center gap-3 border-t border-line/70 px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={playing}
          aria-label={playing ? 'Pause demo' : 'Play demo'}
          className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-ink transition-colors hover:bg-surface"
        >
          {playing ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
        </button>
        <p className="min-w-0 flex-1 truncate text-[12px] text-ink-muted" aria-live="polite">
          {frame.caption || 'Making an invoice, start to finish'}
        </p>
        <div className="hidden h-1 w-24 overflow-hidden rounded-full bg-line sm:block">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${(Math.min(elapsed, TOTAL_MS) / TOTAL_MS) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
