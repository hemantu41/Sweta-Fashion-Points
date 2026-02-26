import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/sellers/[id]/analytics - Fetch seller performance analytics
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

    // Revenue trends (daily aggregation)
    const { data: revenueTrends } = await supabaseAdmin
      .from('spf_seller_earnings')
      .select('order_date, seller_earning, quantity')
      .eq('seller_id', sellerId)
      .gte('order_date', startDate.toISOString().split('T')[0])
      .order('order_date', { ascending: true });

    // Aggregate by day
    const dailyRevenue = revenueTrends?.reduce((acc: any, item) => {
      const date = item.order_date.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, orders: 0 };
      }
      acc[date].revenue += parseFloat(item.seller_earning.toString());
      acc[date].orders += 1;
      return acc;
    }, {});

    const revenueByDay = Object.values(dailyRevenue || {});

    // Top products
    const { data: topProducts } = await supabaseAdmin
      .from('spf_seller_earnings')
      .select('product_id, item_name, seller_earning, quantity')
      .eq('seller_id', sellerId)
      .gte('order_date', startDate.toISOString().split('T')[0]);

    // Aggregate by product
    const productStats = topProducts?.reduce((acc: any, item) => {
      const key = item.product_id || item.item_name;
      if (!acc[key]) {
        acc[key] = {
          productId: item.product_id,
          name: item.item_name,
          totalRevenue: 0,
          totalOrders: 0,
          totalQuantity: 0,
        };
      }
      acc[key].totalRevenue += parseFloat(item.seller_earning.toString());
      acc[key].totalOrders += 1;
      acc[key].totalQuantity += item.quantity;
      return acc;
    }, {});

    const topProductsList = Object.values(productStats || {})
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Overall stats
    const { data: allEarnings } = await supabaseAdmin
      .from('spf_seller_earnings')
      .select('seller_earning, quantity, order_date')
      .eq('seller_id', sellerId);

    const totalRevenue = allEarnings?.reduce((sum, e) => sum + parseFloat(e.seller_earning.toString()), 0) || 0;
    const totalOrders = allEarnings?.length || 0;
    const totalProductsSold = allEarnings?.reduce((sum, e) => sum + e.quantity, 0) || 0;

    // Recent period stats (for comparison)
    const recentRevenue = revenueTrends?.reduce((sum, e) => sum + parseFloat(e.seller_earning.toString()), 0) || 0;
    const recentOrders = revenueTrends?.length || 0;

    return NextResponse.json({
      overview: {
        totalRevenue,
        totalOrders,
        totalProductsSold,
        recentRevenue,
        recentOrders,
      },
      revenueByDay,
      topProducts: topProductsList,
    });
  } catch (error: any) {
    console.error('[Seller Analytics API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    );
  }
}
