import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sellerCacheGet, sellerCacheSet } from '@/lib/sellerCache';

// GET /api/sellers/[id]/earnings - Fetch seller earnings with filters
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sellerId } = await params;
    const { searchParams } = new URL(request.url);

    const paymentStatus = searchParams.get('paymentStatus');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ── Cache-first (only for default unfiltered requests) ─────────────────
    const PRIVATE_CC = 'private, max-age=30, stale-while-revalidate=1800';
    const isDefaultQuery = !paymentStatus && !startDate && !endDate && limit === 100 && offset === 0;
    if (isDefaultQuery) {
      const cachedEarnings = await sellerCacheGet<any[]>(sellerId, 'analytics');
      if (cachedEarnings !== null) {
        const total   = cachedEarnings.reduce((s, e) => s + parseFloat(e.seller_earning?.toString() || '0'), 0);
        const commission = cachedEarnings.reduce((s, e) => s + parseFloat(e.commission_amount?.toString() || '0'), 0);
        const pending = cachedEarnings.filter(e => e.payment_status === 'pending').reduce((s, e) => s + parseFloat(e.seller_earning?.toString() || '0'), 0);
        const paid    = cachedEarnings.filter(e => ['paid', 'settled'].includes(e.payment_status || '')).reduce((s, e) => s + parseFloat(e.seller_earning?.toString() || '0'), 0);
        return NextResponse.json({
          earnings: cachedEarnings.slice(offset, offset + limit),
          total: cachedEarnings.length,
          summary: { totalEarnings: total, totalCommission: commission, pendingEarnings: pending, paidEarnings: paid },
          fromCache: true,
        }, { headers: { 'X-Cache': 'HIT', 'Cache-Control': PRIVATE_CC } });
      }
    }

    let query = supabaseAdmin
      .from('spf_seller_earnings')
      .select('*', { count: 'exact' })
      .eq('seller_id', sellerId)
      .order('order_date', { ascending: false });

    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }

    if (startDate) {
      query = query.gte('order_date', startDate);
    }

    if (endDate) {
      query = query.lte('order_date', endDate);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: earnings, error, count } = await query;

    if (error) throw error;

    // Calculate summary
    const { data: summary } = await supabaseAdmin
      .from('spf_seller_earnings')
      .select('seller_earning, commission_amount, payment_status')
      .eq('seller_id', sellerId);

    const totalEarnings = summary?.reduce((sum, e) => sum + parseFloat(e.seller_earning.toString()), 0) || 0;
    const totalCommission = summary?.reduce((sum, e) => sum + parseFloat(e.commission_amount.toString()), 0) || 0;
    const pendingEarnings = summary?.filter(e => e.payment_status === 'pending')
      .reduce((sum, e) => sum + parseFloat(e.seller_earning.toString()), 0) || 0;
    const paidEarnings = summary?.filter(e => e.payment_status === 'paid')
      .reduce((sum, e) => sum + parseFloat(e.seller_earning.toString()), 0) || 0;

    // Cache the raw earnings for re-use (background)
    if (isDefaultQuery && earnings) {
      sellerCacheSet(sellerId, 'analytics', earnings).catch(() => {});
    }

    return NextResponse.json({
      earnings: earnings || [],
      total: count || 0,
      summary: { totalEarnings, totalCommission, pendingEarnings, paidEarnings },
      fromCache: false,
    }, { headers: { 'X-Cache': 'MISS', 'Cache-Control': PRIVATE_CC } });
  } catch (error: any) {
    console.error('[Seller Earnings API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/sellers/[id]/earnings - Update payment status (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sellerId } = await params;
    const body = await request.json();
    const { earningIds, paymentStatus, paymentDate, paymentReference, paymentNotes, adminUserId } = body;

    if (!earningIds || !paymentStatus || !adminUserId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify admin
    const { data: user } = await supabaseAdmin
      .from('spf_users')
      .select('is_admin')
      .eq('id', adminUserId)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Update earnings
    const { data, error } = await supabaseAdmin
      .from('spf_seller_earnings')
      .update({
        payment_status: paymentStatus,
        payment_date: paymentDate || null,
        payment_reference: paymentReference || null,
        payment_notes: paymentNotes || null,
        updated_at: new Date().toISOString(),
      })
      .in('id', earningIds)
      .eq('seller_id', sellerId)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `${data.length} earning(s) updated to ${paymentStatus}`,
      updated: data,
    });
  } catch (error: any) {
    console.error('[Seller Earnings API] PUT Error:', error);
    return NextResponse.json(
      { error: 'Failed to update earnings', details: error.message },
      { status: 500 }
    );
  }
}
