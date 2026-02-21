import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { productCache } from '@/lib/cache';

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
