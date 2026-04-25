/**
 * POST /api/admin/orders/v2/[id]/nudge-seller
 * Sends an SLA warning email to the seller (bypasses Redis dedup guard).
 * Uses Supabase directly (no Prisma/DATABASE_URL needed).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { notifySellerSlaWarning } from '@/lib/notifications/sellerNotify';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('spf_orders')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const status = (order as any).status;
    const NUDGEABLE = ['CONFIRMED', 'SELLER_NOTIFIED', 'ACCEPTED'];
    if (!NUDGEABLE.includes(status)) {
      return NextResponse.json(
        { error: `Cannot nudge seller for order with status ${status}` },
        { status: 400 },
      );
    }

    const slaType = status === 'ACCEPTED' ? 'PACKING' : 'ACCEPTANCE';
    await notifySellerSlaWarning(id, slaType);

    const now = new Date().toISOString();
    await supabaseAdmin
      .from('spf_order_status_history')
      .insert({
        order_id:    id,
        from_status: status,
        to_status:   status,
        actor_type:  'ADMIN',
        note:        `Admin manually sent seller nudge (${slaType} SLA reminder)`,
        created_at:  now,
      });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[admin/orders/v2/nudge-seller] error:', err?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
