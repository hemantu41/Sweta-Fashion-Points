/**
 * POST /api/admin/orders/v2/[id]/sla-extend
 * Extends the active SLA deadline by 1 hour.
 * Uses Supabase directly (no Prisma/DATABASE_URL needed).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('spf_orders')
      .select('status, acceptance_sla_deadline, packing_sla_deadline')
      .eq('id', id)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const o = order as any;
    let updateField: string | null = null;
    let newDeadline: string | null = null;

    if (o.status === 'SELLER_NOTIFIED' && o.acceptance_sla_deadline) {
      updateField  = 'acceptance_sla_deadline';
      newDeadline  = new Date(new Date(o.acceptance_sla_deadline).getTime() + ONE_HOUR_MS).toISOString();
    } else if (o.status === 'ACCEPTED' && o.packing_sla_deadline) {
      updateField  = 'packing_sla_deadline';
      newDeadline  = new Date(new Date(o.packing_sla_deadline).getTime() + ONE_HOUR_MS).toISOString();
    } else {
      return NextResponse.json(
        { error: 'No active SLA deadline to extend for this order status' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    await Promise.all([
      supabaseAdmin
        .from('spf_orders')
        .update({ [updateField]: newDeadline, updated_at: now })
        .eq('id', id),
      supabaseAdmin
        .from('spf_order_status_history')
        .insert({
          order_id:    id,
          from_status: o.status,
          to_status:   o.status,
          actor_type:  'ADMIN',
          note:        'Admin extended SLA deadline by 1 hour',
          created_at:  now,
        }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[admin/orders/v2/sla-extend] error:', err?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
