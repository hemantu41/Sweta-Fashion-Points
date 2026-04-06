/**
 * GET /api/admin/orders/v2/[id]
 * Full order detail for the admin drawer — includes items, history, risk flags, payout.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items:         true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        riskFlags:     { orderBy: { createdAt: 'desc' } },
        payout:        true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch customer + seller info from Supabase
    const [{ data: customer }, { data: seller }] = await Promise.all([
      supabaseAdmin
        .from('spf_users')
        .select('full_name, email, mobile')
        .eq('id', order.customerId)
        .maybeSingle(),
      supabaseAdmin
        .from('spf_sellers')
        .select('business_name, business_email, business_phone')
        .eq('id', order.sellerId)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      order: {
        ...order,
        // Convert Prisma Decimals to numbers
        subtotal:           Number(order.subtotal),
        shippingCharge:     Number(order.shippingCharge),
        platformFee:        Number(order.platformFee),
        pgFee:              Number(order.pgFee),
        sellerPayoutAmount: Number(order.sellerPayoutAmount),
        items: order.items.map(i => ({
          ...i,
          unitPrice:  Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
        })),
        payout: order.payout
          ? {
              ...order.payout,
              grossAmount:       Number(order.payout.grossAmount),
              shippingDeduction: Number(order.payout.shippingDeduction),
              pgFeeDeduction:    Number(order.payout.pgFeeDeduction),
              netPayout:         Number(order.payout.netPayout),
            }
          : null,
        // Customer + seller details
        customerName:  (customer as any)?.full_name       ?? '—',
        customerEmail: (customer as any)?.email            ?? '—',
        customerPhone: (customer as any)?.mobile           ?? '—',
        sellerName:    (seller as any)?.business_name      ?? '—',
        sellerEmail:   (seller as any)?.business_email     ?? '—',
        sellerPhone:   (seller as any)?.business_phone     ?? '—',
      },
    });
  } catch (err: any) {
    console.error('[admin/orders/v2/[id]] GET error:', err?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
