/**
 * SLA (Service Level Agreement) helpers for support tickets.
 * Hours are measured from ticket creation to expected resolution.
 */

export const SLA_HOURS: Record<string, Record<string, number>> = {
  order:    { critical: 4,  high: 8,  medium: 24, low: 48 },
  payment:  { critical: 2,  high: 4,  medium: 12, low: 24 },
  delivery: { critical: 2,  high: 4,  medium: 8,  low: 24 },
  product:  { critical: 8,  high: 24, medium: 48, low: 72 },
  seller:   { critical: 4,  high: 8,  medium: 24, low: 48 },
  other:    { critical: 12, high: 24, medium: 48, low: 72 },
};

/** Returns the SLA deadline Date for a given category + priority. */
export function computeSlaDeadline(category: string, priority: string): Date {
  const hours = SLA_HOURS[category]?.[priority] ?? 48;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/** Returns SLA hours as a readable string e.g. "4h", "24h". */
export function slaLabel(category: string, priority: string): string {
  const hours = SLA_HOURS[category]?.[priority] ?? 48;
  return hours < 24 ? `${hours}h` : `${hours / 24}d`;
}

/** True if the ticket has breached its SLA and is not yet resolved/closed. */
export function isSlaBreached(deadline: string | Date, status: string): boolean {
  if (['resolved', 'closed'].includes(status)) return false;
  return new Date(deadline) < new Date();
}

/**
 * Returns SLA progress as 0–100 percentage (100 = deadline reached / breached).
 * Used to drive the progress bar width.
 */
export function slaProgress(createdAt: string | Date, deadline: string | Date): number {
  const total   = new Date(deadline).getTime() - new Date(createdAt).getTime();
  const elapsed = Date.now()                   - new Date(createdAt).getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

/** Human-readable "Xh left" or "Xh overdue" label. */
export function slaTimeLabel(deadline: string | Date): string {
  const diffMs  = new Date(deadline).getTime() - Date.now();
  const diffHrs = Math.abs(diffMs) / (1000 * 60 * 60);

  if (diffMs >= 0) {
    return diffHrs < 1
      ? `${Math.round(diffHrs * 60)}m left`
      : `${Math.round(diffHrs)}h left`;
  } else {
    return diffHrs < 24
      ? `${Math.round(diffHrs)}h overdue`
      : `${Math.round(diffHrs / 24)}d overdue`;
  }
}
