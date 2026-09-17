'use client';

import { useEffect } from 'react';

/**
 * The error boundary.
 *
 * Plain language and a way forward, never a stack trace. The draft is already
 * in local storage, so a reset does not cost the user their work — and saying
 * so is the most useful thing on the screen.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Console only: invoice contents must never be shipped to a logging service.
    console.error('Unexpected error:', error.message);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-start px-4 py-20 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Something went wrong</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
        Your invoice is saved on this device, so nothing has been lost. Try again, and if it keeps
        happening, reload the page.
      </p>
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 cursor-pointer items-center rounded-md bg-ink px-5 text-sm font-medium text-canvas transition-colors hover:bg-ink-muted"
        >
          Try again
        </button>
        <button
          type="button"
          // A full page load, not a client transition: if the React tree is the
          // thing that broke, routing inside it is not a recovery.
          onClick={() => window.location.assign('/')}
          className="inline-flex h-11 cursor-pointer items-center rounded-md border border-line-strong px-5 text-sm font-medium text-ink transition-colors hover:bg-surface"
        >
          Start over
        </button>
      </div>
    </div>
  );
}
