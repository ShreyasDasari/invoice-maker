/**
 * Loading placeholders.
 *
 * Used while a saved draft is read from the browser. Each block reserves the
 * space its real content will occupy, so nothing shifts when the invoice
 * arrives — a skeleton that causes layout shift is worse than no skeleton.
 */

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded bg-line motion-safe:animate-[skeleton-pulse_1.6s_ease-in-out_infinite] ${className}`}
      aria-hidden="true"
    />
  );
}

/** Mirrors the editor's field stack while the draft loads. */
export function EditorSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true">
      {[0, 1].map((block) => (
        <div key={block} className="flex flex-col gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-[4.5rem] w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
        </div>
      ))}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

/** Mirrors the invoice sheet while the draft loads. */
export function PreviewSkeleton() {
  return (
    <div
      className="mx-auto flex aspect-[1/1.414] w-full max-w-[560px] flex-col gap-6 border border-line bg-white p-10"
      aria-hidden="true"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-2.5 w-24" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="mt-4 flex justify-between gap-8">
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-2 w-10" />
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="h-2.5 w-20" />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-2 w-10" />
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <Skeleton className="mt-4 h-6 w-full" />
      {[0, 1, 2].map((row) => (
        <Skeleton key={row} className="h-4 w-full" />
      ))}
      <div className="mt-auto flex justify-end">
        <Skeleton className="h-16 w-40" />
      </div>
    </div>
  );
}
