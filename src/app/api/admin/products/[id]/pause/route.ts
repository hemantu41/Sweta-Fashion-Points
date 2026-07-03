/**
 * POST /api/admin/products/[id]/pause
 * Body: { adminId: string, pause: boolean, reason: string }
 *
 * Toggles is_active on a product without touching approval_status.
 * pause=true  → hides listing from site + notifies seller
 * pause=false → re-activates listing + notifies seller
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { productCache } from '@/lib/cache';
import { publicInvalidate, publicDel } from '@/lib/publicCache';
import { invalidateSellerKeys } from '@/lib/sellerCache';
import { notifySellerProductPaused } from '@/lib/notifications/sellerNotify';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params;
    const body = await request.json().catch(() => ({}));
    const { adminId, pause, reason } = body as { adminId?: string; pause?: boolean; reason?: string };

    if (!adminId) return NextResponse.json({ error: 'adminId is required' }, { status: 400 });
    if (pause === undefined) return NextResponse.json({ error: 'pause (boolean) is required' }, { status: 400 });
    if (pause && !reason?.trim()) return NextResponse.json({ error: 'A reason is required when pausing' }, { status: 400 });

    // Verify admin
    const { data: adminUser } = await supabaseAdmin
      .from('spf_users')
      .select('is_admin')
      .eq('id', adminId)
      .single();

    if (!adminUser?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized — admin only' }, { status: 403 });
    }

    // Fetch product + seller info in one go
    const { data: product, error: fetchErr } = await supabaseAdmin
      .from('spf_productdetails')
      .select(`
        id, name, seller_id, is_active,
        seller:spf_sellers!spf_productdetails_seller_id_fkey (
          business_name, business_email
        )
      `)
      .eq('id', productId)
      .is('deleted_at', null)
      .single();

    if (fetchErr || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    const { error: updateErr } = await supabaseAdmin
      .from('spf_productdetails')
      .update({ is_active: !pause, updated_at: now })
      .eq('id', productId);

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }

    // Invalidate all caches
    productCache.clear();
    publicInvalidate('pub:products:*').catch(() => {});
    publicDel(`pub:product:${productId}`).catch(() => {});
    if (product.seller_id) {
      invalidateSellerKeys(product.seller_id, 'products', 'inventory').catch(() => {});
    }

    // Notify seller (fire and forget — only on pause, not on resume)
    const seller = product.seller as any;
    if (pause && seller?.business_email) {
      void notifySellerProductPaused(
        seller.business_email,
        seller.business_name ?? 'Seller',
        product.name,
        reason!.trim(),
      );
    }

    return NextResponse.json({
      success: true,
      isActive: !pause,
      message: pause ? 'Product listing paused' : 'Product listing resumed',
    });
  } catch (err: any) {
    console.error('[Admin Pause] Error:', err?.message);
    return NextResponse.json({ error: 'Something went wrong: ' + err?.message }, { status: 500 });
  }
}
