/**
 * GET /api/admin/returns
 * List all return requests with order + customer info, sorted newest first.
 * Optional filters: ?status=PENDING  ?sellerId=<uuid>
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status   = searchParams.get('status');
    const sellerId = searchParams.get('sellerId');

    let query = supabaseAdmin
      .from('spf_return_requests')
      .select(`
        id, order_id, customer_id, seller_id,
        return_type, reason_category, reason_detail, item_condition,
        status, admin_notes, reviewed_by, reviewed_at,
        seller_verified, refund_amount, razorpay_refund_id,
        refund_status, refund_initiated_at, refund_completed_at,
        created_at, updated_at,
        spf_orders (
          order_number, subtotal, shipping_charge, payment_method,
          shipping_address
        )
      `)
      .order('created_at', { ascending: false });

    if (status)   query = query.eq('status', status);
    if (sellerId) query = query.eq('seller_id', sellerId);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with customer names (batch lookup)
    const customerIds = [...new Set((data || []).map((r: any) => r.customer_id).filter(Boolean))];
    let customerMap: Map<string, { name: string; email: string }> = new Map();
    if (customerIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('spf_users')
        .select('id, name, email')
        .in('id', customerIds);
      customerMap = new Map((users || []).map((u: any) => [u.id, { name: u.name || '', email: u.email || '' }]));
    }

    const returns = (data || []).map((r: any) => ({
      ...r,
      customer_name:  customerMap.get(r.customer_id)?.name  || '',
      customer_email: customerMap.get(r.customer_id)?.email || '',
      order_number:   (r.spf_orders as any)?.order_number || '',
      order_total:    r.spf_orders
        ? Number((r.spf_orders as any).subtotal || 0) + Number((r.spf_orders as any).shipping_charge || 0)
        : 0,
      payment_method: (r.spf_orders as any)?.payment_method || '',
    }));

    return NextResponse.json({ success: true, returns });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
