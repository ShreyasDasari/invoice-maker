'use client';

/**
 * Toasts.
 *
 * Small, quiet and out of the way: no modal, no focus steal. The region is
 * `aria-live="polite"` so a screen reader hears the confirmation after
 * finishing its current phrase, and any action (Undo) is a real button inside
 * the toast rather than a gesture.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertIcon, CheckIcon, CloseIcon } from './Icons';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  message: string;
  tone?: ToastTone;
  action?: ToastAction;
  /** Milliseconds on screen. Errors stay longer; 0 means until dismissed. */
  duration?: number;
}

interface ToastRecord extends Required<Omit<ToastOptions, 'action'>> {
  id: number;
  action?: ToastAction;
}

interface ToastApi {
  toast: (options: ToastOptions) => void;
  success: (message: string, action?: ToastAction) => void;
  error: (message: string) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DEFAULT_DURATION = 3500;
const ERROR_DURATION = 6000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
    const handle = timers.current.get(id);
    if (handle) {
      window.clearTimeout(handle);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({ message, tone = 'info', action, duration }: ToastOptions) => {
      const id = nextId.current;
      nextId.current += 1;
      const ttl = duration ?? (tone === 'error' ? ERROR_DURATION : DEFAULT_DURATION);

      setToasts((current) => {
        const next = [...current, { id, message, tone, action, duration: ttl }];
        // Never stack more than three; the oldest goes.
        return next.slice(-3);
      });

      if (ttl > 0) {
        const handle = window.setTimeout(() => dismiss(id), ttl);
        timers.current.set(id, handle);
      }
    },
    [dismiss],
  );

  const success = useCallback(
    (message: string, action?: ToastAction) => toast({ message, tone: 'success', action }),
    [toast],
  );
  const error = useCallback((message: string) => toast({ message, tone: 'error' }), [toast]);

  // Clear pending timers if the provider unmounts mid-flight.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((handle) => window.clearTimeout(handle));
      pending.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(() => ({ toast, success, error, dismiss }), [toast, success, error, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        // Sits above the mobile action bar and clear of the gesture area.
        className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-[1000] flex flex-col items-center gap-2 px-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:items-end sm:pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:pr-4"
        role="region"
        aria-label="Notifications"
      >
        <div aria-live="polite" aria-atomic="false" className="contents">
          {toasts.map((item) => (
            <ToastItem key={item.id} toast={item} onDismiss={dismiss} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      className={[
        'pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg px-3 py-2.5',
        'motion-safe:animate-[toast-in_200ms_var(--ease-out-quick)]',
        toast.tone === 'error'
          ? 'border border-danger/40 bg-danger-wash text-ink shadow-[var(--shadow-pop)]'
          : 'glass-strong text-ink',
      ].join(' ')}
    >
      {toast.tone === 'error' ? (
        <AlertIcon size={15} className="mt-0.5 shrink-0 text-danger" />
      ) : toast.tone === 'success' ? (
        <CheckIcon size={15} className="mt-0.5 shrink-0 text-success" />
      ) : null}

      <p className="min-w-0 flex-1 text-[13px] leading-snug">{toast.message}</p>

      {toast.action ? (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            onDismiss(toast.id);
          }}
          className="shrink-0 cursor-pointer text-[13px] font-semibold text-accent underline-offset-2 hover:underline"
        >
          {toast.action.label}
        </button>
      ) : null}

      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onDismiss(toast.id)}
        className="-mr-1 -mt-0.5 shrink-0 cursor-pointer rounded p-1 text-ink-subtle transition-colors hover:text-ink"
      >
        <CloseIcon size={13} />
      </button>
    </div>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast must be used inside ToastProvider');
  return api;
}
