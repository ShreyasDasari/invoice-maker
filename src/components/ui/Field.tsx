'use client';

import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { AlertIcon } from './Icons';

/**
 * Form primitives.
 *
 * Every field has a real, visible <label> tied to its control — a placeholder
 * is a hint, not a label, and disappears exactly when the user needs it. Errors
 * render directly beneath the field they belong to and are announced politely.
 */

interface FieldShellProps {
  label: string;
  htmlFor: string;
  /** Hides the label visually but keeps it for screen readers. */
  hideLabel?: boolean;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FieldShell({
  label,
  htmlFor,
  hideLabel = false,
  required = false,
  hint,
  error,
  children,
  className = '',
}: FieldShellProps) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <label
        htmlFor={htmlFor}
        className={
          hideLabel
            ? 'sr-only'
            : 'text-[11px] font-medium uppercase tracking-[0.06em] text-ink-subtle'
        }
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${htmlFor}-hint`} className="text-[11px] leading-snug text-ink-subtle">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="flex items-start gap-1 text-[11px] leading-snug text-danger"
        >
          <AlertIcon size={12} className="mt-px shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

const CONTROL_BASE = [
  'w-full min-w-0 rounded-md border bg-raised px-2.5 text-ink',
  'transition-colors duration-150 ease-[var(--ease-out-quick)]',
  'placeholder:text-ink-subtle',
  'hover:border-line-strong',
  'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25',
  'disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink-subtle',
  // 16px keeps iOS from zooming the viewport on focus.
  'text-base sm:text-sm',
].join(' ');

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string;
  /** Right-aligns the value, for money and quantities. */
  numeric?: boolean;
  id?: string;
}

export function TextField({
  label,
  hideLabel,
  hint,
  error,
  numeric = false,
  className = '',
  id,
  ...props
}: TextFieldProps) {
  const generated = useId();
  const fieldId = id ?? generated;

  return (
    <FieldShell
      label={label}
      htmlFor={fieldId}
      hideLabel={hideLabel}
      required={props.required}
      hint={hint}
      error={error}
      className={className}
    >
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={[
          CONTROL_BASE,
          // 44px on touch, tightened on pointer devices where density helps.
          'h-11 sm:h-9',
          error ? 'border-danger' : 'border-line',
          numeric ? 'tabular text-right' : '',
        ].join(' ')}
        {...props}
      />
    </FieldShell>
  );
}

export interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string;
  id?: string;
}

export function TextAreaField({
  label,
  hideLabel,
  hint,
  error,
  className = '',
  rows = 3,
  id,
  ...props
}: TextAreaFieldProps) {
  const generated = useId();
  const fieldId = id ?? generated;

  return (
    <FieldShell
      label={label}
      htmlFor={fieldId}
      hideLabel={hideLabel}
      required={props.required}
      hint={hint}
      error={error}
      className={className}
    >
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={[
          CONTROL_BASE,
          'py-2 leading-snug',
          error ? 'border-danger' : 'border-line',
        ].join(' ')}
        {...props}
      />
    </FieldShell>
  );
}

export interface SelectFieldProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string;
  id?: string;
  children: ReactNode;
}

/**
 * A native <select>. Native is the right call here: it brings the platform's
 * own picker on mobile, full keyboard support and type-ahead for free.
 */
export function SelectField({
  label,
  hideLabel,
  hint,
  error,
  className = '',
  id,
  children,
  ...props
}: SelectFieldProps) {
  const generated = useId();
  const fieldId = id ?? generated;

  return (
    <FieldShell
      label={label}
      htmlFor={fieldId}
      hideLabel={hideLabel}
      hint={hint}
      error={error}
      className={className}
    >
      <select
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={[
          CONTROL_BASE,
          'h-11 cursor-pointer appearance-none pr-8 sm:h-9',
          error ? 'border-danger' : 'border-line',
          // The chevron is drawn in CSS so no extra element is needed.
          "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23737373%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_0.6rem_center] bg-no-repeat",
        ].join(' ')}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

/** A labelled on/off switch for the editor's disclosure toggles. */
export function Toggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  description?: string;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  return (
    <div className="flex items-start gap-2.5">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        // A <label for> names form controls, not buttons, so the switch takes
        // its accessible name from the visible text by reference instead.
        aria-labelledby={labelId}
        onClick={() => onChange(!checked)}
        className={`tap-44 relative mt-0.5 h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors duration-150 ease-[var(--ease-out-quick)] ${
          checked ? 'border-ink bg-ink' : 'border-line-strong bg-surface'
        }`}
      >
        <span
          className={`absolute top-0.5 size-3.5 rounded-full bg-canvas transition-[left] duration-150 ease-[var(--ease-out-quick)] ${
            checked ? 'left-[1.125rem]' : 'left-0.5'
          }`}
        />
      </button>
      <div className="min-w-0">
        <label
          id={labelId}
          htmlFor={id}
          className="cursor-pointer text-[13px] font-medium text-ink"
        >
          {label}
        </label>
        {description ? (
          <p className="text-[11px] leading-snug text-ink-subtle">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
