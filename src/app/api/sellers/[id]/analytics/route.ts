import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/sellers/[id]/analytics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sellerId } = await params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Fetch earnings for the selected period
    const { data: periodEarnings } = await supabaseAdmin
      .from('spf_seller_earnings')
      .select('order_date, seller_earning, quantity, product_id, item_name, payment_status')
      .eq('seller_id', sellerId)
      .gte('order_date', startDateStr)
      .order('order_date', { ascending: true });

    // Aggregate by day
    const dailyMap: Record<string, { date: string; revenue: number; orders: number }> = {};
    for (const item of periodEarnings || []) {
      const date = (item.order_date || '').split('T')[0];
      if (!dailyMap[date]) dailyMap[date] = { date, revenue: 0, orders: 0 };
      dailyMap[date].revenue += parseFloat(item.seller_earning?.toString() || '0');
      dailyMap[date].orders += 1;
    }
    const revenueByDay = Object.values(dailyMap).map(d => ({ date: d.date, revenue: Math.round(d.revenue) }));
    const ordersByDay = Object.values(dailyMap).map(d => ({ date: d.date, orders: d.orders }));

    // Period totals
    const periodRevenue = (periodEarnings || []).reduce((s, e) => s + parseFloat(e.seller_earning?.toString() || '0'), 0);
    const periodOrders = periodEarnings?.length || 0;
    const periodUnitsSold = (periodEarnings || []).reduce((s, e) => s + (e.quantity || 1), 0);
    const avgOrderValue = periodOrders > 0 ? Math.round(periodRevenue / periodOrders) : 0;

    // Return rate — count items with returned-like status
    const returnedCount = (periodEarnings || []).filter(e =>
      (e.payment_status || '').toLowerCase().includes('return')
    ).length;
    const returnRate = periodOrders > 0 ? parseFloat(((returnedCount / periodOrders) * 100).toFixed(1)) : 0;

    // Top products for the period
    const productMap: Record<string, { id: string; name: string; unitsSold: number; revenue: number }> = {};
    for (const item of periodEarnings || []) {
      const key = item.product_id || item.item_name || 'unknown';
      if (!productMap[key]) {
        productMap[key] = { id: item.product_id || key, name: item.item_name || 'Unknown Product', unitsSold: 0, revenue: 0 };
      }
      productMap[key].unitsSold += item.quantity || 1;
      productMap[key].revenue += parseFloat(item.seller_earning?.toString() || '0');
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(p => ({ ...p, revenue: Math.round(p.revenue) }));

    // Category breakdown — join with products table
    const productIds = [...new Set((periodEarnings || []).map(e => e.product_id).filter(Boolean))];
    let categoryData: { name: string; value: number }[] = [];
    if (productIds.length > 0) {
      const { data: products } = await supabaseAdmin
        .from('spf_productdetails')
        .select('id, category')
        .in('id', productIds);

      const catRevMap: Record<string, number> = {};
      for (const item of periodEarnings || []) {
        const prod = products?.find(p => p.id === item.product_id);
        const cat = prod?.category || 'Other';
        catRevMap[cat] = (catRevMap[cat] || 0) + parseFloat(item.seller_earning?.toString() || '0');
      }
      categoryData = Object.entries(catRevMap)
        .map(([name, value]) => ({ name, value: Math.round(value) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
    }

    return NextResponse.json({
      revenue: Math.round(periodRevenue),
      orders: periodOrders,
      productsSold: periodUnitsSold,
      returnRate,
      avgOrderValue,
      revenueByDay,
      ordersByDay,
      topProducts,
      categoryData,
    });
  } catch (error: any) {
    console.error('[Seller Analytics API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics', details: error.message }, { status: 500 });
  }
}
