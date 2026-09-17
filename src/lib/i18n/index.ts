/**
 * Translation lookup.
 *
 * English only for now. The shape is what matters: components read from `t`,
 * so adding a locale means adding a file that satisfies `Strings`.
 */
import { en, type Strings } from './en';

export const SUPPORTED_LOCALES = ['en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const catalogues: Record<SupportedLocale, Strings> = { en };

export function getStrings(locale: string = 'en'): Strings {
  const base = locale.split('-')[0] as SupportedLocale;
  return catalogues[base] ?? en;
}

/** The default catalogue, for components that do not switch language. */
export const t = en;
export type { Strings };
