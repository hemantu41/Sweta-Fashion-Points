// ─── QC Review Panel — Shared TypeScript Types ────────────────────────────────

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type NotifyEvent =
  | 'notify.product.approved'
  | 'notify.product.rejected'
  | 'notify.product.resubmitted'
  | 'notify.cache.invalidated';

export type RejectionReasonId =
  | 'bad_image'
  | 'bg_image'
  | 'missing_sides'
  | 'wrong_cat'
  | 'incomplete'
  | 'price_error'
  | 'copyright'
  | 'desc_mismatch';

export type Severity = 'minor' | 'major' | 'critical';

export interface RejectionReason {
  id: RejectionReasonId;
  title: string;
  sub: string;
  fixInstruction: string;
}

export interface QCProduct {
  id: string;
  product_id: string | null;
  name: string;
  name_hi: string | null;
  category: string;
  sub_category: string | null;
  price: number;
  original_price: number | null;
  main_image: string | null;
  images: string[] | null;
  approval_status: ApprovalStatus;
  is_active: boolean;
  rejection_reason: string | null;
  admin_note: string | null;
  seller_id: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  // Flattened from spf_sellers join
  seller_name: string;
  seller_email: string;
  // SLA enrichment
  waitingHours?: number;
  slaClass?: 'urgent' | 'warning' | 'ok';
}

export interface QCFeedback {
  id: string;
  product_id: string;
  message: string;
  author_type: 'admin' | 'seller';
  author_name: string;
  is_read: boolean;
  created_at: string;
}

export interface NotifyEventLog {
  id: string;
  event: string;
  product_id: string;
  product_name: string;
  seller_id: string;
  detail: string;
  status: 'sent' | 'pending' | 'failed';
  error: string | null;
  created_at: string;
}

export interface SLACounts {
  overdue: number;
  warning: number;
  onTrack: number;
  resolvedToday: number;
}

export interface ApprovePayload {
  productId: string;
  adminUserId: string;
  note?: string;
}

export interface RejectPayload {
  productId: string;
  adminUserId: string;
  reasons: RejectionReasonId[];
  severity: Severity;
  note?: string;
}

export interface NotifyPayload {
  type: 'approved' | 'rejected';
  product: QCProduct;
  adminNote?: string;
  reasons?: RejectionReasonId[];
  severity?: Severity;
  note?: string;
}

export interface NotifyResult {
  event: string;
  status: 'sent' | 'failed';
  error?: string;
}

export interface QCActionResult {
  success: boolean;
  message: string;
  notifyFired?: string[];
  notifyFailed?: string[];
}
