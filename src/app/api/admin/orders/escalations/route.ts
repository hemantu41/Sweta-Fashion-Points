import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/orders/escalations
// Returns paid orders where the seller missed the 30-minute packing deadline.
export async function GET() {
  try {
    const now = new Date().toISOString();

    const { data: orders, error } = await supabase
      .from('spf_payment_orders')
      .select('id, order_number, delivery_address, items, packing_deadline, sla_deadline, created_at, payment_completed_at')
      .eq('status', 'captured')
      .is('packed_at', null)
      .lt('packing_deadline', now)
      .order('packing_deadline', { ascending: true });

    if (error) {
      console.error('[Escalations API] DB error:', error);
      return NextResponse.json({ error: 'Failed to fetch escalations' }, { status: 500 });
    }

    const escalations = (orders || []).map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.delivery_address?.name || 'Unknown',
      customerPhone: order.delivery_address?.phone || '',
      packingDeadline: order.packing_deadline,
      slaDeadline: order.sla_deadline,
      minutesOverdue: order.packing_deadline
        ? Math.floor((Date.now() - new Date(order.packing_deadline).getTime()) / 60_000)
        : null,
      itemCount: Array.isArray(order.items) ? order.items.length : 0,
    }));

    return NextResponse.json({ escalations, count: escalations.length });
  } catch (error) {
    console.error('[Escalations API] Error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
