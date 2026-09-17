/**
 * Analytics.
 *
 * No provider is wired up, and no invoice content is ever included — only the
 * name of a milestone and, at most, a template or currency code. The point of
 * this module is that when a provider is added there is exactly one place to
 * add it, and it is already impossible for it to see a customer's details.
 */

export type AnalyticsEvent =
  | 'invoice_created'
  | 'invoice_downloaded'
  | 'invoice_printed'
  | 'invoice_shared'
  | 'template_selected'
  | 'currency_selected'
  | 'profile_saved'
  | 'invoice_duplicated';

/** Only non-identifying scalars are accepted, by type. */
export type AnalyticsProps = Record<string, string | number | boolean>;

type Sink = (event: AnalyticsEvent, props?: AnalyticsProps) => void;

let sink: Sink | null = null;

/** Install a provider. Called once, from the client, if analytics are enabled. */
export function setAnalyticsSink(next: Sink | null): void {
  sink = next;
}

export function track(event: AnalyticsEvent, props?: AnalyticsProps): void {
  if (!sink) return;
  try {
    sink(event, props);
  } catch {
    // Analytics must never break the invoice workflow.
  }
}
