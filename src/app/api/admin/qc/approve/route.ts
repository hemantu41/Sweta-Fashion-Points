import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getProductByIdAdmin, approveProduct } from '@/lib/qc/db';
import { dispatchQCNotification } from '@/lib/qc/notify';
import { publicInvalidate, publicDel } from '@/lib/publicCache';

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function getAdminSession(
  request: NextRequest,
  adminUserId?: string
): Promise<{ id: string } | null> {
  // Option A: Supabase Auth Bearer token
  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (accessToken) {
    const { data } = await supabaseAdmin.auth.getUser(accessToken);
    const role = data.user?.app_metadata?.role ?? data.user?.user_metadata?.role;
    if (role === 'admin') return { id: data.user!.id };
  }

  // Option B (active): verify adminUserId against spf_users.is_admin
  // Option B-alt: check spf_admins table instead:
  //   const { data } = await supabaseAdmin.from('spf_admins').select('user_id').eq('user_id', adminUserId).single();
  //   if (data) return { id: adminUserId };
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

// ─── POST /api/admin/qc/approve ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, adminUserId, note } = body;

    if (!productId || !adminUserId) {
      return NextResponse.json(
        { error: 'productId and adminUserId are required' },
        { status: 400 }
      );
    }

    // Auth
    const admin = await getAdminSession(request, adminUserId);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized — admin access required' }, { status: 401 });
    }

    // Fetch product
    const product = await getProductByIdAdmin(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Idempotency check
    if (product.approval_status === 'approved') {
      return NextResponse.json(
        { error: 'Product is already approved', code: 'ALREADY_APPROVED' },
        { status: 409 }
      );
    }

    // DB update
    await approveProduct(productId, admin.id, note);

    // Dispatch notifications (in-app + email + cache invalidation)
    const notifyResults = await dispatchQCNotification({
      type: 'approved',
      product: { ...product, approval_status: 'approved', is_active: true },
      adminNote: note,
    });

    const notifyFired = notifyResults.filter((r) => r.status === 'sent').map((r) => r.event);
    const notifyFailed = notifyResults.filter((r) => r.status === 'failed').map((r) => r.event);

    // Invalidate public product cache so buyers see the approved product immediately
    publicInvalidate('pub:products:*').catch(() => {});
    publicDel(`pub:product:${product.id}`).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `"${product.name}" approved and seller notified`,
      notifyFired,
      notifyFailed,
    });
  } catch (err: any) {
    console.error('[QC Approve] POST error:', err?.message);
    return NextResponse.json(
      { error: 'Failed to approve product', details: err?.message },
      { status: 500 }
    );
  }
}
