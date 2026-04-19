import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sellerCacheGet, sellerCacheSet } from '@/lib/sellerCache';

/** Compute the analytics response shape from raw earnings rows. */
function buildAnalyticsResponse(
  _sellerId: string,
  earnings: any[],
  days: number,
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  // Filter to requested period (cache may hold 90 days, UI may request 7/30/90)
  const periodEarnings = earnings.filter(e => (e.order_date || '') >= startDateStr);

  // Aggregate by day
  const dailyMap: Record<string, { date: string; revenue: number; orders: number }> = {};
  for (const item of periodEarnings) {
    const date = (item.order_date || '').split('T')[0];
    if (!dailyMap[date]) dailyMap[date] = { date, revenue: 0, orders: 0 };
    dailyMap[date].revenue += parseFloat(item.seller_earning?.toString() || '0');
    dailyMap[date].orders += 1;
  }
  const revenueByDay = Object.values(dailyMap).map(d => ({ date: d.date, revenue: Math.round(d.revenue) }));
  const ordersByDay  = Object.values(dailyMap).map(d => ({ date: d.date, orders: d.orders }));

  const periodRevenue   = periodEarnings.reduce((s, e) => s + parseFloat(e.seller_earning?.toString() || '0'), 0);
  const periodOrders    = periodEarnings.length;
  const periodUnitsSold = periodEarnings.reduce((s, e) => s + (e.quantity || 1), 0);
  const avgOrderValue   = periodOrders > 0 ? Math.round(periodRevenue / periodOrders) : 0;

  const returnedCount = periodEarnings.filter(e => (e.payment_status || '').toLowerCase().includes('return')).length;
  const returnRate    = periodOrders > 0 ? parseFloat(((returnedCount / periodOrders) * 100).toFixed(1)) : 0;

  // Top products
  const productMap: Record<string, { id: string; name: string; unitsSold: number; revenue: number }> = {};
  for (const item of periodEarnings) {
    const key = item.product_id || item.item_name || 'unknown';
    if (!productMap[key]) productMap[key] = { id: item.product_id || key, name: item.item_name || 'Unknown Product', unitsSold: 0, revenue: 0 };
    productMap[key].unitsSold += item.quantity || 1;
    productMap[key].revenue  += parseFloat(item.seller_earning?.toString() || '0');
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue).slice(0, 10)
    .map(p => ({ ...p, revenue: Math.round(p.revenue) }));

  return {
    revenue: Math.round(periodRevenue),
    orders: periodOrders,
    productsSold: periodUnitsSold,
    returnRate,
    avgOrderValue,
    revenueByDay,
    ordersByDay,
    topProducts,
    categoryData: [] as { name: string; value: number }[], // enriched below when coming from DB
  };
}

// GET /api/sellers/[id]/analytics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sellerId } = await params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const PRIVATE_CC = 'private, max-age=30, stale-while-revalidate=1800';

    // ── Cache-first (serves 7d/30d/90d from the same cached 90-day dataset) ─
    const cachedEarnings = await sellerCacheGet<any[]>(sellerId, 'analytics');
    if (cachedEarnings !== null) {
      return NextResponse.json(
        buildAnalyticsResponse(sellerId, cachedEarnings, days),
        { headers: { 'X-Cache': 'HIT', 'Cache-Control': PRIVATE_CC } }
      );
    }

    // ── Cache miss: fetch from DB ───────────────────────────────────────────
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data: periodEarnings } = await supabaseAdmin
      .from('spf_seller_earnings')
      .select('order_date, seller_earning, quantity, product_id, item_name, payment_status')
      .eq('seller_id', sellerId)
      .gte('order_date', startDateStr)
      .order('order_date', { ascending: true });

    const earnings = periodEarnings || [];

    // Write raw earnings to cache (background)
    sellerCacheSet(sellerId, 'analytics', earnings).catch(() => {});

    const response = buildAnalyticsResponse(sellerId, earnings, days);

    // Enrich with category data (requires extra DB join — only on cache miss)
    const productIds = [...new Set(earnings.map((e: any) => e.product_id).filter(Boolean))];
    if (productIds.length > 0) {
      const { data: products } = await supabaseAdmin
        .from('spf_productdetails').select('id, category').in('id', productIds);

      const catRevMap: Record<string, number> = {};
      for (const item of earnings) {
        const prod = products?.find((p: any) => p.id === item.product_id);
        const cat = prod?.category || 'Other';
        catRevMap[cat] = (catRevMap[cat] || 0) + parseFloat(item.seller_earning?.toString() || '0');
      }
      response.categoryData = Object.entries(catRevMap)
        .map(([name, value]) => ({ name, value: Math.round(value) }))
        .sort((a, b) => b.value - a.value).slice(0, 6);
    }

    return NextResponse.json(response, { headers: { 'X-Cache': 'MISS', 'Cache-Control': PRIVATE_CC } });
  } catch (error: any) {
    console.error('[Seller Analytics API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics', details: error.message }, { status: 500 });
  }
}
