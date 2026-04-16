import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/admin/dashboard/orders?adminUserId=xxx&status=pending
// Queries spf_orders directly — no Redis cache (cache was causing stale order data).

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const adminUserId = request.nextUrl.searchParams.get('adminUserId');
    const status      = request.nextUrl.searchParams.get('status');

    if (!adminUserId) {
      return NextResponse.json({ error: 'adminUserId required' }, { status: 400 });
    }

    const { data: user } = await supabaseAdmin
      .from('spf_users')
      .select('id, is_admin')
      .eq('id', adminUserId)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabaseAdmin
      .from('spf_orders')
      .select(`
        id, order_number, status, risk_status, customer_id, seller_id,
        subtotal, shipping_charge, shipping_address, payment_method,
        created_at, updated_at,
        spf_order_items(id, product_name, quantity, unit_price)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    // Map old payment_order statuses → spf_orders statuses for compatibility
    if (status && status !== 'all') {
      const statusMap: Record<string, string[]> = {
        pending:          ['CONFIRMED', 'SELLER_NOTIFIED'],
        captured:         ['CONFIRMED', 'SELLER_NOTIFIED'],
        accepted:         ['ACCEPTED'],
        packed:           ['PACKED', 'READY_TO_SHIP', 'PICKUP_SCHEDULED'],
        shipped:          ['IN_TRANSIT', 'OUT_FOR_DELIVERY'],
        out_for_delivery: ['OUT_FOR_DELIVERY'],
        delivered:        ['DELIVERED'],
        cancelled:        ['CANCELLED'],
      };
      const mapped = statusMap[status];
      if (mapped) {
        query = query.in('status', mapped);
      } else {
        query = query.eq('status', status.toUpperCase());
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    const orders = (data || []).map((o: any) => {
      const addr  = (o.shipping_address as any) || {};
      const items = (o.spf_order_items as any[]) || [];
      return {
        id:              o.id,
        order_id:        o.order_number || o.id,
        customer_name:   addr.name   || 'Customer',
        customer_mobile: addr.phone  || '',
        pincode:         addr.pincode || '',
        district:        addr.city   || '',
        items: items.map((i: any) => ({
          name:     i.product_name || '',
          quantity: i.quantity || 1,
          price:    Number(i.unit_price) || 0,
        })),
        total:        Number(o.subtotal) + Number(o.shipping_charge),
        status:       o.status,
        payment_mode: o.payment_method || 'cod',
        created_at:   o.created_at,
        updated_at:   o.updated_at,
      };
    });

    return NextResponse.json(orders);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
