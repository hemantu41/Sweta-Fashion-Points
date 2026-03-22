import type { RejectionReasonId, RejectionReason, QCProduct } from '@/types/qc.types';

// ─── Rejection Reasons ────────────────────────────────────────────────────────

export const REJECTION_REASONS: RejectionReason[] = [
  {
    id: 'bad_image',
    title: 'Poor image quality',
    sub: 'Blurry, dark or low resolution photos',
    fixInstruction: 'Upload minimum 800×800px images with good lighting',
  },
  {
    id: 'bg_image',
    title: 'Wrong image background',
    sub: 'Background must be white or plain',
    fixInstruction: 'Use white/plain background, remove watermarks',
  },
  {
    id: 'missing_sides',
    title: 'Missing product angles',
    sub: 'Need front, back and side views',
    fixInstruction: 'Upload at least 3 angles: front, back, side',
  },
  {
    id: 'wrong_cat',
    title: 'Wrong category',
    sub: 'Product placed in incorrect category',
    fixInstruction: 'Re-list under correct category/sub-category',
  },
  {
    id: 'incomplete',
    title: 'Incomplete attributes',
    sub: 'Missing size chart, fabric, colour',
    fixInstruction: 'Fill all mandatory fields: fabric, size chart, colours, care label',
  },
  {
    id: 'price_error',
    title: 'Price issue',
    sub: 'MRP lower than selling price or unrealistic',
    fixInstruction: 'Selling price must be ≤ MRP. Verify GST-inclusive price',
  },
  {
    id: 'copyright',
    title: 'Copyright/brand issue',
    sub: 'Unauthorised brand name or logo',
    fixInstruction: 'Remove brand references unless authorised reseller',
  },
  {
    id: 'desc_mismatch',
    title: 'Description mismatch',
    sub: "Title/description doesn't match images",
    fixInstruction: 'Update title and description to match actual product',
  },
];

export const REASON_MAP: Record<RejectionReasonId, RejectionReason> = Object.fromEntries(
  REJECTION_REASONS.map((r) => [r.id, r])
) as Record<RejectionReasonId, RejectionReason>;

export const VALID_REASON_IDS = new Set<RejectionReasonId>(
  REJECTION_REASONS.map((r) => r.id)
);

// ─── SLA Constants ────────────────────────────────────────────────────────────

export const SLA_HOURS = {
  URGENT: 24,   // >24h = overdue
  WARNING: 12,  // 12-24h = warning
} as const;

// ─── SLA Helpers ──────────────────────────────────────────────────────────────

export function hoursWaiting(createdAt: string): number {
  return (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
}

export function minutesWaiting(createdAt: string): number {
  return (Date.now() - new Date(createdAt).getTime()) / (1000 * 60);
}

export function getSlaClass(createdAt: string): 'urgent' | 'warning' | 'ok' {
  const h = hoursWaiting(createdAt);
  if (h >= SLA_HOURS.URGENT) return 'urgent';
  if (h >= SLA_HOURS.WARNING) return 'warning';
  return 'ok';
}

export function getSlaLabel(createdAt: string): string {
  const h = hoursWaiting(createdAt);
  if (h < 1) {
    const m = Math.round(minutesWaiting(createdAt));
    return m < 2 ? 'Just submitted' : `${m}m ago`;
  }
  if (h >= SLA_HOURS.URGENT) return `${Math.round(h)}h waiting`;
  return `${h.toFixed(1)}h ago`;
}

export function getSlaPercent(createdAt: string): number {
  const h = hoursWaiting(createdAt);
  return Math.min(100, (h / 48) * 100);
}

export function enrichWithSla(products: QCProduct[]): QCProduct[] {
  return products.map((p) => ({
    ...p,
    waitingHours: hoursWaiting(p.created_at),
    slaClass: getSlaClass(p.created_at),
  }));
}

// ─── Serialisation ────────────────────────────────────────────────────────────

export function encodeReasons(reasons: RejectionReasonId[]): string {
  return JSON.stringify(reasons);
}

export function decodeReasons(raw?: string | null): RejectionReasonId[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RejectionReasonId[]) : [];
  } catch {
    return [];
  }
}

export function buildRejectionMessage(
  reasons: RejectionReasonId[],
  severity: string,
  note?: string
): string {
  const severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1);
  const lines: string[] = [
    `Your product has been rejected (Severity: ${severityLabel}).`,
    '',
    'Please fix the following issues before resubmitting:',
    '',
  ];
  for (const id of reasons) {
    const r = REASON_MAP[id];
    if (r) lines.push(`• ${r.title}: ${r.fixInstruction}`);
  }
  if (note) {
    lines.push('', `Admin note: ${note}`);
  }
  return lines.join('\n');
}
