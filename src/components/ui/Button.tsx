'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { SpinnerIcon } from './Icons';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Shows a spinner, blocks clicks and announces the busy state. */
  loading?: boolean;
  /** Text shown while loading, in place of the label. */
  loadingLabel?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-ink text-canvas border border-ink hover:bg-ink-muted hover:border-ink-muted active:scale-[0.99]',
  secondary:
    'bg-raised text-ink border border-line-strong hover:bg-surface hover:border-ink-subtle active:scale-[0.99]',
  ghost: 'bg-transparent text-ink-muted border border-transparent hover:bg-surface hover:text-ink',
  danger:
    'bg-transparent text-danger border border-transparent hover:bg-danger-wash active:scale-[0.99]',
};

/**
 * Every size clears the 44px touch minimum on small screens, then tightens up
 * on wider ones where a mouse makes density an advantage rather than a hazard.
 */
const SIZES: Record<Size, string> = {
  sm: 'h-11 px-2.5 text-[13px] gap-1.5 sm:h-8',
  md: 'h-11 px-3.5 text-sm gap-2 sm:h-10',
  lg: 'h-11 px-5 text-sm gap-2',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  loadingLabel,
  iconLeft,
  iconRight,
  fullWidth = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      // aria-busy tells a screen reader the work is in progress, while
      // `disabled` prevents the double submit.
      aria-busy={loading || undefined}
      disabled={isDisabled}
      className={[
        'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md font-medium',
        'transition-all duration-150 ease-[var(--ease-out-quick)] select-none',
        'disabled:pointer-events-none disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? <SpinnerIcon size={size === 'sm' ? 13 : 15} /> : iconLeft}
      <span className="truncate">{loading && loadingLabel ? loadingLabel : children}</span>
      {!loading && iconRight}
    </button>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: an icon alone has no accessible name without it. */
  label: string;
  variant?: Variant;
  size?: 'sm' | 'md';
}

/**
 * A square icon control. The visual box can be small, but the tap target is
 * padded out to 44px on touch pointers so it is not a precision task.
 */
export function IconButton({
  label,
  variant = 'ghost',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={[
        'relative inline-grid cursor-pointer place-items-center rounded-md',
        'transition-colors duration-150 ease-[var(--ease-out-quick)]',
        'disabled:pointer-events-none disabled:opacity-40',
        // The visual box stays compact; the tap target is padded out to 44px.
        'tap-44',
        size === 'sm' ? 'size-7' : 'size-9',
        VARIANTS[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
