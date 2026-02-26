import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/products/[id]/deletion-history - Fetch deletion history for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    // Fetch deletion history with user information
    const { data: history, error } = await supabase
      .from('spf_product_deletion_history')
      .select(`
        id,
        product_id,
        product_name,
        deleted_by,
        deleted_by_role,
        deletion_reason,
        deleted_at,
        created_at
      `)
      .eq('product_id', productId)
      .order('deleted_at', { ascending: false }); // Most recent first

    if (error) {
      console.error('[Deletion History API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deletion history' },
        { status: 500 }
      );
    }

    // Transform to camelCase for frontend
    const transformedHistory = history?.map(h => ({
      id: h.id,
      productId: h.product_id,
      productName: h.product_name,
      deletedBy: h.deleted_by,
      deletedByRole: h.deleted_by_role,
      deletionReason: h.deletion_reason,
      deletedAt: h.deleted_at,
      createdAt: h.created_at,
    })) || [];

    return NextResponse.json({
      history: transformedHistory,
      count: transformedHistory.length,
    });
  } catch (error: any) {
    console.error('[Deletion History API] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong', details: error.message },
      { status: 500 }
    );
  }
}
