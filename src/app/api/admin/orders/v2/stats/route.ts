/**
 * GET /api/admin/orders/v2/stats
 * Returns summary counts for the admin orders header stat cards.
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now        = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const warnCutoff = new Date(now.getTime() + 30 * 60 * 1000); // now + 30 min

    const [totalToday, pendingAcceptance, slaAtRisk, fraudHold, deliveredToday] =
      await Promise.all([
        prisma.order.count({
          where: { createdAt: { gte: todayStart } },
        }),
        prisma.order.count({
          where: { status: 'SELLER_NOTIFIED' as any },
        }),
        prisma.order.count({
          where: {
            OR: [
              {
                status:                'SELLER_NOTIFIED' as any,
                acceptanceSlaDeadline: { gt: now, lte: warnCutoff },
              },
              {
                status:             'ACCEPTED' as any,
                packingSlaDeadline: { gt: now, lte: warnCutoff },
              },
            ],
          },
        }),
        prisma.order.count({
          where: { riskStatus: 'HOLD' as any },
        }),
        prisma.order.count({
          where: {
            status:      'DELIVERED' as any,
            deliveredAt: { gte: todayStart },
          },
        }),
      ]);

    return NextResponse.json({
      totalToday,
      pendingAcceptance,
      slaAtRisk,
      fraudHold,
      deliveredToday,
    });
  } catch (err: any) {
    console.error('[admin/orders/v2/stats] error:', err?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
