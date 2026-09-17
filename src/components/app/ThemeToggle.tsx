'use client';

import { useCallback, useEffect, useState } from 'react';
import { MonitorIcon, MoonIcon, SunIcon } from '@/components/ui/Icons';

type Mode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'im.theme';

function applyMode(mode: Mode): void {
  const resolved =
    mode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : mode;
  document.documentElement.setAttribute('data-theme', resolved);
}

/**
 * Light / dark / follow-system, as a three-state segmented control rather than
 * a toggle, so "follow the system" stays reachable once a choice is made.
 */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>('system');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setMode(stored === 'light' || stored === 'dark' ? stored : 'system');
    } catch {
      setMode('system');
    }
  }, []);

  // While following the system, track changes to it live.
  useEffect(() => {
    if (mode !== 'system') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyMode('system');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [mode]);

  const choose = useCallback((next: Mode) => {
    setMode(next);
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* preference simply will not persist */
    }
    applyMode(next);
  }, []);

  const options: { value: Mode; label: string; Icon: typeof SunIcon }[] = [
    { value: 'light', label: 'Light', Icon: SunIcon },
    { value: 'dark', label: 'Dark', Icon: MoonIcon },
    { value: 'system', label: 'System', Icon: MonitorIcon },
  ];

  const active = options.find((option) => option.value === mode) ?? options[2]!;
  const nextMode: Mode =
    mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';

  return (
    <>
      {/*
       * A phone header cannot afford three controls next to the wordmark and
       * the navigation, so below `sm` the same choice becomes one button that
       * cycles light -> dark -> system.
       */}
      <button
        type="button"
        onClick={() => choose(nextMode)}
        aria-label={`Colour theme: ${active.label}. Switch to ${
          options.find((o) => o.value === nextMode)?.label ?? ''
        }.`}
        className="tap-44 relative grid size-9 shrink-0 cursor-pointer place-items-center rounded-md border border-line text-ink-muted transition-colors duration-150 hover:text-ink sm:hidden"
      >
        <active.Icon size={15} />
      </button>

      <div
        className="hidden shrink-0 items-center gap-0.5 rounded-md border border-line p-0.5 sm:flex"
        role="radiogroup"
        aria-label="Colour theme"
      >
        {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mode === value}
          aria-label={label}
          title={label}
          onClick={() => choose(value)}
          className={[
            'relative grid size-7 cursor-pointer place-items-center rounded-sm',
            'transition-colors duration-150',
            'tap-44',
            mode === value
              ? 'bg-primary text-primary-ink'
              : 'text-ink-subtle hover:bg-surface hover:text-ink',
          ].join(' ')}
        >
          <Icon size={14} />
        </button>
      ))}
      </div>
    </>
  );
}
