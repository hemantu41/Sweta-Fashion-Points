import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/products/[id]/qc-feedback — fetch feedback thread for a product
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    const { data, error } = await supabaseAdmin
      .from('spf_product_qc_feedback')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });

    if (error) {
      // Table may not exist yet — return empty list gracefully
      console.warn('[QC Feedback] Query error (table may not exist):', error.message);
      return NextResponse.json({ feedback: [] });
    }

    return NextResponse.json({ feedback: data || [] });
  } catch (err: any) {
    console.error('[QC Feedback GET] Error:', err);
    return NextResponse.json({ feedback: [] });
  }
}

// POST /api/products/[id]/qc-feedback — seller adds a reply
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { message, authorType = 'seller', authorName } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('spf_product_qc_feedback')
      .insert({
        product_id: productId,
        message: message.trim(),
        author_type: authorType,
        author_name: authorName || 'Seller',
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[QC Feedback POST] Error:', error);
      return NextResponse.json({ error: 'Failed to add feedback', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ feedback: data });
  } catch (err: any) {
    console.error('[QC Feedback POST] Error:', err);
    return NextResponse.json({ error: 'Failed to add feedback', details: err.message }, { status: 500 });
  }
}
