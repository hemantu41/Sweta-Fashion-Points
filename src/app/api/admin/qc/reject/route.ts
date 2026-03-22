import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getProductByIdAdmin, rejectProduct } from '@/lib/qc/db';
import { dispatchQCNotification } from '@/lib/qc/notify';
import { VALID_REASON_IDS } from '@/lib/qc/constants';
import type { RejectionReasonId, Severity } from '@/types/qc.types';

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function getAdminSession(
  request: NextRequest,
  adminUserId?: string
): Promise<{ id: string } | null> {
  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (accessToken) {
    const { data } = await supabaseAdmin.auth.getUser(accessToken);
    const role = data.user?.app_metadata?.role ?? data.user?.user_metadata?.role;
    if (role === 'admin') return { id: data.user!.id };
  }

  if (adminUserId) {
    const { data } = await supabaseAdmin
      .from('spf_users')
      .select('id, is_admin')
      .eq('id', adminUserId)
      .single();
    if (data?.is_admin) return { id: data.id };
  }

  return null;
}

const VALID_SEVERITIES: Severity[] = ['minor', 'major', 'critical'];

// ─── POST /api/admin/qc/reject ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, adminUserId, reasons, severity, note } = body;

    // ── Validate required fields ──
    if (!productId || !adminUserId) {
      return NextResponse.json(
        { error: 'productId and adminUserId are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(reasons) || reasons.length === 0) {
      return NextResponse.json(
        { error: 'At least one rejection reason is required' },
        { status: 400 }
      );
    }

    const invalidReasons = reasons.filter(
      (r: string) => !VALID_REASON_IDS.has(r as RejectionReasonId)
    );
    if (invalidReasons.length > 0) {
      return NextResponse.json(
        { error: `Invalid reason IDs: ${invalidReasons.join(', ')}` },
        { status: 400 }
      );
    }

    if (!VALID_SEVERITIES.includes(severity)) {
      return NextResponse.json(
        { error: `severity must be one of: ${VALID_SEVERITIES.join(', ')}` },
        { status: 400 }
      );
    }

    if (note && note.length > 500) {
      return NextResponse.json(
        { error: 'note must be ≤ 500 characters' },
        { status: 400 }
      );
    }

    // ── Auth ──
    const admin = await getAdminSession(request, adminUserId);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized — admin access required' }, { status: 401 });
    }

    // ── Fetch product ──
    const product = await getProductByIdAdmin(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.approval_status === 'approved') {
      return NextResponse.json(
        { error: 'Cannot reject an already-approved product', code: 'ALREADY_APPROVED' },
        { status: 409 }
      );
    }

    // ── DB update ──
    await rejectProduct(
      productId,
      admin.id,
      reasons as RejectionReasonId[],
      severity as Severity,
      note
    );

    // ── Dispatch notifications ──
    const notifyResults = await dispatchQCNotification({
      type: 'rejected',
      product: { ...product, approval_status: 'rejected', is_active: false },
      reasons: reasons as RejectionReasonId[],
      severity: severity as Severity,
      note,
    });

    const notifyFired = notifyResults.filter((r) => r.status === 'sent').map((r) => r.event);
    const notifyFailed = notifyResults.filter((r) => r.status === 'failed').map((r) => r.event);

    return NextResponse.json({
      success: true,
      message: `"${product.name}" rejected — seller notified with ${reasons.length} fix instruction(s)`,
      reasonsApplied: reasons,
      severity,
      notifyFired,
      notifyFailed,
    });
  } catch (err: any) {
    console.error('[QC Reject] POST error:', err?.message);
    return NextResponse.json(
      { error: 'Failed to reject product', details: err?.message },
      { status: 500 }
    );
  }
}
