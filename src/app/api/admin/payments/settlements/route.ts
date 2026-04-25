/**
 * GET  /api/admin/payments/settlements  — list all seller earnings from DB
 * PATCH /api/admin/payments/settlements  — mark earnings as paid (with UTR) or disputed
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { invalidateSellerKeys } from '@/lib/sellerCache';

export const dynamic = 'force-dynamic';

async function verifyAdmin(adminUserId: string) {
  const { data } = await supabaseAdmin
    .from('spf_users')
    .select('is_admin')
    .eq('id', adminUserId)
    .single();
  return !!data?.is_admin;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminUserId = searchParams.get('adminUserId');
    const status      = searchParams.get('status');   // all | pending | paid | disputed
    const sellerId    = searchParams.get('sellerId');

    if (!adminUserId) {
      return NextResponse.json({ error: 'adminUserId required' }, { status: 400 });
    }
    if (!(await verifyAdmin(adminUserId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabaseAdmin
      .from('spf_seller_earnings')
      .select(
        'id, seller_id, order_id, order_number, order_date, ' +
        'item_name, quantity, unit_price, total_item_price, ' +
        'commission_percentage, commission_amount, seller_earning, ' +
        'payment_status, payment_date, payment_reference, payment_notes, created_at'
      )
      .order('order_date', { ascending: false })
      .limit(300);

    if (status && status !== 'all') query = query.eq('payment_status', status);
    if (sellerId) query = query.eq('seller_id', sellerId);

    const { data: earnings, error } = await query;
    if (error) throw error;

    // Batch-fetch seller info
    const sellerIds = [...new Set((earnings || []).map((e: any) => e.seller_id).filter(Boolean))];
    const sellerMap: Record<string, any> = {};
    if (sellerIds.length > 0) {
      const { data: sellers } = await supabaseAdmin
        .from('spf_sellers')
        .select('id, business_name, bank_account_name, bank_account_number, bank_ifsc')
        .in('id', sellerIds);
      (sellers || []).forEach((s: any) => { sellerMap[s.id] = s; });
    }

    const rows = (earnings || []).map((e: any) => ({
      ...e,
      seller_name:         sellerMap[e.seller_id]?.business_name     || '—',
      bank_account_name:   sellerMap[e.seller_id]?.bank_account_name  || null,
      bank_account_number: sellerMap[e.seller_id]?.bank_account_number || null,
      bank_ifsc:           sellerMap[e.seller_id]?.bank_ifsc           || null,
    }));

    // Aggregate stats
    const stats = {
      totalGross:    rows.reduce((s: number, r: any) => s + Number(r.total_item_price || 0), 0),
      totalPending:  rows.filter((r: any) => r.payment_status === 'pending')
                        .reduce((s: number, r: any) => s + Number(r.seller_earning || 0), 0),
      totalPaid:     rows.filter((r: any) => ['paid', 'settled'].includes(r.payment_status || ''))
                        .reduce((s: number, r: any) => s + Number(r.seller_earning || 0), 0),
      totalDisputed: rows.filter((r: any) => r.payment_status === 'disputed')
                        .reduce((s: number, r: any) => s + Number(r.seller_earning || 0), 0),
      count: rows.length,
    };

    return NextResponse.json({ earnings: rows, stats });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[admin/payments/settlements GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH — mark selected earnings as paid (with UTR) or as disputed
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminUserId, earningIds, action, utr, paymentDate, reason } = body;

    if (!adminUserId || !Array.isArray(earningIds) || earningIds.length === 0 || !action) {
      return NextResponse.json(
        { error: 'adminUserId, earningIds[], and action required' },
        { status: 400 },
      );
    }
    if (!(await verifyAdmin(adminUserId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();
    const updateData: Record<string, any> = { updated_at: now };

    if (action === 'pay') {
      if (!utr?.trim()) {
        return NextResponse.json({ error: 'UTR number is required to mark as paid' }, { status: 400 });
      }
      updateData.payment_status    = 'paid';
      updateData.payment_date      = paymentDate || now.split('T')[0];
      updateData.payment_reference = utr.trim();
    } else if (action === 'dispute') {
      updateData.payment_status = 'disputed';
      updateData.payment_notes  = reason?.trim() || 'Dispute raised by admin';
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('spf_seller_earnings')
      .update(updateData)
      .in('id', earningIds)
      .select('id, seller_id');

    if (error) throw error;

    // Invalidate analytics cache for each affected seller (fire-and-forget)
    const sellerIds = [...new Set((data || []).map((r: any) => r.seller_id).filter(Boolean))];
    sellerIds.forEach(sid => invalidateSellerKeys(sid, 'analytics').catch(() => {}));

    return NextResponse.json({ updated: data?.length ?? 0 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[admin/payments/settlements PATCH]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
