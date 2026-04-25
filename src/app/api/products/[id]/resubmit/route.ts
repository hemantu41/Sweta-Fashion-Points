import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST /api/products/[id]/resubmit — reset product to pending after seller fixes rejection
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { sellerId, note } = await request.json();

    if (!sellerId) {
      return NextResponse.json({ error: 'sellerId is required' }, { status: 400 });
    }

    // Verify product belongs to this seller and is rejected
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('spf_productdetails')
      .select('id, seller_id, approval_status, name')
      .eq('id', productId)
      .eq('seller_id', sellerId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 });
    }

    if (product.approval_status !== 'rejected') {
      return NextResponse.json({ error: 'Only rejected products can be resubmitted' }, { status: 400 });
    }

    // Reset to pending + clear rejection reason
    const { error: updateError } = await supabaseAdmin
      .from('spf_productdetails')
      .update({
        approval_status: 'pending',
        rejection_reason: null,
        admin_note: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (updateError) {
      console.error('[Resubmit] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to resubmit product', details: updateError.message }, { status: 500 });
    }

    // Log seller's resubmission note in feedback thread (if message provided)
    if (note?.trim()) {
      await supabaseAdmin
        .from('spf_product_qc_feedback')
        .insert({
          product_id: productId,
          message: `[Resubmitted] ${note.trim()}`,
          author_type: 'seller',
          author_name: 'Seller',
          is_read: false,
          created_at: new Date().toISOString(),
        })
        .select();
    }

    return NextResponse.json({ success: true, message: 'Product resubmitted for review' });
  } catch (err: any) {
    console.error('[Resubmit] Error:', err);
    return NextResponse.json({ error: 'Failed to resubmit', details: err.message }, { status: 500 });
  }
}
