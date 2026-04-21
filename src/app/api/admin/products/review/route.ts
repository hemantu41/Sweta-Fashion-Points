import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { productCache } from '@/lib/cache';
import { sendEmail } from '@/lib/email';
import { invalidateSellerKeys } from '@/lib/sellerCache';
import { publicInvalidate, publicDel } from '@/lib/publicCache';
import { productApprovedEmail, productRejectedEmail } from '@/lib/emailTemplates/productEmails';

// GET /api/admin/products/review - Fetch products pending approval
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const { data: products, error } = await supabaseAdmin
      .from('spf_productdetails')
      .select(`
        *,
        seller:spf_sellers!spf_productdetails_seller_id_fkey (
          id,
          business_name,
          business_name_hi,
          business_phone,
          city,
          state
        )
      `)
      .eq('approval_status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ products: products || [] });
  } catch (error: any) {
    console.error('[Admin Product Review API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products/review - Approve or reject product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, action, rejectionReason, adminUserId } = body;

    if (!productId || !action || !adminUserId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve or reject' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Verify admin
    const { data: user } = await supabaseAdmin
      .from('spf_users')
      .select('is_admin')
      .eq('id', adminUserId)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Update product
    const updateData: any = {
      approval_status: action === 'approve' ? 'approved' : 'rejected',
      updated_at: new Date().toISOString(),
    };

    if (action === 'approve') {
      updateData.approved_by = adminUserId;
      updateData.approved_at = new Date().toISOString();
      updateData.is_active = true; // Activate product
    } else {
      updateData.rejected_at = new Date().toISOString();
      updateData.rejection_reason = rejectionReason;
      updateData.is_active = false; // Keep product inactive
    }

    const { data: product, error } = await supabaseAdmin
      .from('spf_productdetails')
      .update(updateData)
      .eq('product_id', productId)
      .select()
      .single();

    if (error) throw error;

    // Clear product cache after approval/rejection
    productCache.clear();
    console.log('[Admin Product Review API] Cache cleared after product approval/rejection');

    // Invalidate seller's Redis cache so they see the updated status immediately
    invalidateSellerKeys(product.seller_id, 'products', 'inventory', 'pricing').catch(() => {});

    // Invalidate public product cache so buyers see the change immediately
    publicInvalidate('pub:products:*').catch(() => {});
    publicDel(`pub:product:${product.id}`).catch(() => {});

    // ── Send email + in-app notification (non-blocking) ──
    void (async () => {
      try {
        // Fetch seller name + email
        const { data: sellerRow } = await supabaseAdmin
          .from('spf_sellers')
          .select('business_name, spf_users!spf_sellers_user_id_fkey(email)')
          .eq('id', product.seller_id)
          .single();

        const sellerName  = (sellerRow as any)?.business_name ?? 'Seller';
        const sellerEmail = (sellerRow as any)?.spf_users?.email as string | undefined;

        const productId  = `IFP-PRD-${product.id.slice(0, 8).toUpperCase()}`;
        const category   = [product.category, product.sub_category].filter(Boolean).join(' > ');

        // In-app notification
        await supabaseAdmin.from('spf_notifications').insert({
          seller_id:    product.seller_id,
          type:         'qc',
          title:        action === 'approve'
            ? `✅ "${product.name}" is now live!`
            : `❌ "${product.name}" needs changes`,
          message:      action === 'approve'
            ? `Your product has been approved and is now visible to customers.`
            : `Your product was rejected. Please review the feedback and resubmit.`,
          product_id:   product.id,
          product_name: product.name,
          is_read:      false,
        });

        if (!sellerEmail) {
          console.warn('[Admin Product Review API] No seller email — skipping email notification');
          return;
        }

        let subject: string;
        let html: string;

        if (action === 'approve') {
          ({ subject, html } = productApprovedEmail({
            sellerName,
            shopName:        sellerName,
            productTitle:    product.name,
            productCategory: category,
            sellingPrice:    product.price,
            productId,
            productSlug:     product.product_id ?? product.id,
          }));
        } else {
          ({ subject, html } = productRejectedEmail({
            sellerName,
            shopName:     sellerName,
            productTitle: product.name,
            productId,
            rejectionTags: [],
            adminNote:    rejectionReason,
          }));
        }

        await sendEmail({ to: sellerEmail, subject, html });
      } catch (err: any) {
        console.error('[Admin Product Review API] Notification error (non-fatal):', err?.message);
      }
    })();

    return NextResponse.json({
      success: true,
      message: `Product ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      product,
    });
  } catch (error: any) {
    console.error('[Admin Product Review API] PUT Error:', error);
    return NextResponse.json(
      { error: 'Failed to update product', details: error.message },
      { status: 500 }
    );
  }
}
