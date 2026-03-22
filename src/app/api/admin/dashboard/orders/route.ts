import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { adminCacheFirst } from '@/lib/adminCache';

// GET /api/admin/dashboard/orders?adminUserId=xxx&status=pending
// Redis-first: returns cached orders, falls back to Supabase.

export async function GET(request: NextRequest) {
  try {
    const adminUserId = request.nextUrl.searchParams.get('adminUserId');
    const status = request.nextUrl.searchParams.get('status');

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

    const allOrders = await adminCacheFirst<Record<string, unknown>[]>('orders', async () => {
      const { data } = await supabaseAdmin
        .from('spf_payment_orders')
        .select('id, order_number, status, items, total_amount, delivery_address, payment_method, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50);

      return (data || []).map((o: Record<string, unknown>) => {
        const addr = o.delivery_address as Record<string, unknown> | null;
        const items = (o.items as Array<Record<string, unknown>>) || [];
        return {
          id: o.id,
          order_id: o.order_number || o.id,
          customer_name: (addr?.name as string) || 'Customer',
          customer_mobile: (addr?.mobile as string) || '',
          pincode: (addr?.pincode as string) || '',
          district: (addr?.city as string) || '',
          items: items.map(i => ({
            product_id: i.product_id || '',
            name: i.name || i.product_name || '',
            quantity: Number(i.quantity) || 1,
            price: Number(i.price) || 0,
            size: (i.size as string) || '',
          })),
          total: Number(o.total_amount) || 0,
          status: o.status || 'pending',
          payment_mode: o.payment_method || 'cod',
          created_at: o.created_at,
          updated_at: o.updated_at,
        };
      });
    });

    const filtered = status && status !== 'all'
      ? allOrders.filter(o => o.status === status)
      : allOrders;

    return NextResponse.json(filtered);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
