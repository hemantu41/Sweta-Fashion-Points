import { supabaseAdmin } from '@/lib/supabase-admin';
import type { QCProduct, QCFeedback, RejectionReasonId, Severity, SLACounts } from '@/types/qc.types';
import {
  enrichWithSla,
  encodeReasons,
  buildRejectionMessage,
  hoursWaiting,
  getSlaClass,
} from './constants';

export type SortBy = 'oldest' | 'newest' | 'price';

// ─── Queue fetch ──────────────────────────────────────────────────────────────

export async function getProductsByStatus(
  status: 'pending' | 'approved' | 'rejected',
  { sortBy = 'oldest', limit = 50 }: { sortBy?: SortBy; limit?: number } = {}
): Promise<QCProduct[]> {
  let query = supabaseAdmin
    .from('spf_productdetails')
    .select(`
      id, product_id, name, name_hi, category, sub_category,
      price, original_price, main_image, images,
      approval_status, is_active, rejection_reason,
      admin_note, seller_id, approved_by, approved_at,
      created_at, updated_at, deleted_at,
      spf_sellers!spf_productdetails_seller_id_fkey (
        business_name,
        spf_users!spf_sellers_user_id_fkey ( email )
      )
    `)
    .eq('approval_status', status)
    .is('deleted_at', null)
    .limit(Math.min(limit, 200));

  if (sortBy === 'oldest') query = query.order('created_at', { ascending: true });
  else if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
  else if (sortBy === 'price') query = query.order('price', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;

  const products: QCProduct[] = ((data as any[]) || []).map((row) => ({
    ...row,
    seller_name: row.spf_sellers?.business_name ?? 'Unknown Seller',
    seller_email: row.spf_sellers?.spf_users?.email ?? '',
    spf_sellers: undefined,
  }));

  return enrichWithSla(products);
}

// ─── Single product ───────────────────────────────────────────────────────────

export async function getProductByIdAdmin(id: string): Promise<QCProduct | null> {
  const { data, error } = await supabaseAdmin
    .from('spf_productdetails')
    .select(`
      id, product_id, name, name_hi, category, sub_category,
      price, original_price, main_image, images,
      approval_status, is_active, rejection_reason,
      admin_note, seller_id, approved_by, approved_at,
      created_at, updated_at, deleted_at,
      spf_sellers!spf_productdetails_seller_id_fkey (
        business_name,
        spf_users!spf_sellers_user_id_fkey ( email )
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !data) return null;
  const row = data as any;
  return {
    ...row,
    seller_name: row.spf_sellers?.business_name ?? 'Unknown Seller',
    seller_email: row.spf_sellers?.spf_users?.email ?? '',
    spf_sellers: undefined,
    waitingHours: hoursWaiting(row.created_at),
    slaClass: getSlaClass(row.created_at),
  };
}

// ─── Approve ──────────────────────────────────────────────────────────────────

export async function approveProduct(
  productId: string,
  adminUserId: string,
  note?: string
): Promise<void> {
  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from('spf_productdetails')
    .update({
      approval_status: 'approved',
      is_active: true,
      approved_by: adminUserId,
      approved_at: now,
      admin_note: note ?? null,
      rejection_reason: null,
      updated_at: now,
    })
    .eq('id', productId);

  if (error) throw error;

  // Log to QC feedback thread
  await supabaseAdmin.from('spf_product_qc_feedback').insert({
    product_id: productId,
    message: note ? `Approved \n\nAdmin note: ${note}` : 'Approved ',
    author_type: 'admin',
    author_name: 'Admin',
    is_read: false,
  });
}

// ─── Reject ───────────────────────────────────────────────────────────────────

export async function rejectProduct(
  productId: string,
  adminUserId: string,
  reasons: RejectionReasonId[],
  severity: Severity,
  note?: string
): Promise<void> {
  const now = new Date().toISOString();
  const message = buildRejectionMessage(reasons, severity, note);

  const { error } = await supabaseAdmin
    .from('spf_productdetails')
    .update({
      approval_status: 'rejected',
      is_active: false,
      rejection_reason: encodeReasons(reasons),
      admin_note: note ?? null,
      approved_by: null,
      approved_at: null,
      updated_at: now,
    })
    .eq('id', productId);

  if (error) throw error;

  // Log fix instructions into QC feedback thread for seller to read
  await supabaseAdmin.from('spf_product_qc_feedback').insert({
    product_id: productId,
    message,
    author_type: 'admin',
    author_name: 'Admin',
    is_read: false,
  });
}

// ─── Feedback thread ──────────────────────────────────────────────────────────

export async function getQCFeedback(productId: string): Promise<QCFeedback[]> {
  const { data, error } = await supabaseAdmin
    .from('spf_product_qc_feedback')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as QCFeedback[]) ?? [];
}

// ─── SLA Counts ───────────────────────────────────────────────────────────────

export async function getQCSLACounts(): Promise<SLACounts> {
  const { data: pending } = await supabaseAdmin
    .from('spf_productdetails')
    .select('created_at')
    .eq('approval_status', 'pending')
    .is('deleted_at', null);

  let overdue = 0;
  let warning = 0;
  let onTrack = 0;

  for (const row of pending ?? []) {
    const cls = getSlaClass(row.created_at);
    if (cls === 'urgent') overdue++;
    else if (cls === 'warning') warning++;
    else onTrack++;
  }

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const { count: resolvedToday } = await supabaseAdmin
    .from('spf_productdetails')
    .select('id', { count: 'exact', head: true })
    .in('approval_status', ['approved', 'rejected'])
    .is('deleted_at', null)
    .gte('updated_at', todayMidnight.toISOString());

  return { overdue, warning, onTrack, resolvedToday: resolvedToday ?? 0 };
}
