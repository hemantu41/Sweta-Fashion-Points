import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { adminCacheFirst } from '@/lib/adminCache';
import type { DashboardStats } from '@/types/admin';

// GET /api/admin/dashboard/stats
// Redis-first: returns cached stats if available, otherwise fetches from Supabase.

export async function GET(request: NextRequest) {
  try {
    const adminUserId = request.nextUrl.searchParams.get('adminUserId');

    if (!adminUserId) {
      return NextResponse.json({ error: 'adminUserId required' }, { status: 400 });
    }

    // Verify admin
    const { data: user } = await supabaseAdmin
      .from('spf_users')
      .select('id, is_admin')
      .eq('id', adminUserId)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await adminCacheFirst<DashboardStats>('stats', async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      const [
        totalOrdersRes, todayOrdersRes, returnedOrdersRes,
        productsRes, activeProductsRes, pendingRes,
        sellersRes, activeSellersRes, customersRes,
        earningsRes, todayEarningsRes,
      ] = await Promise.all([
        // Use spf_orders — same table as the Orders page
        supabaseAdmin.from('spf_orders').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('spf_orders').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabaseAdmin.from('spf_orders').select('id', { count: 'exact', head: true }).eq('status', 'RETURNED'),
        supabaseAdmin.from('spf_productdetails').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabaseAdmin.from('spf_productdetails').select('id', { count: 'exact', head: true }).eq('is_active', true).is('deleted_at', null),
        // Pending approvals — same source as QC Review Queue page
        supabaseAdmin.from('spf_productdetails').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending').is('deleted_at', null),
        supabaseAdmin.from('spf_sellers').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('spf_sellers').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabaseAdmin.from('spf_users').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('spf_seller_earnings').select('seller_earning').limit(1000),
        supabaseAdmin.from('spf_seller_earnings').select('seller_earning').gte('order_date', todayStart.split('T')[0]),
      ]);

      const totalRevenue = (earningsRes.data || []).reduce((s, r) => s + (Number(r.seller_earning) || 0), 0);
      const todayRevenue = (todayEarningsRes.data || []).reduce((s, r) => s + (Number(r.seller_earning) || 0), 0);
      const totalOrders = totalOrdersRes.count || 0;
      const returnedOrders = returnedOrdersRes.count || 0;
      const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
      const returnRate = totalOrders > 0 ? Math.round((returnedOrders / totalOrders) * 1000) / 10 : 0;

      return {
        totalOrders,
        todayOrders: todayOrdersRes.count || 0,
        totalRevenue: Math.round(totalRevenue),
        todayRevenue: Math.round(todayRevenue),
        totalProducts: productsRes.count || 0,
        activeProducts: activeProductsRes.count || 0,
        pendingApprovals: pendingRes.count || 0,
        totalSellers: sellersRes.count || 0,
        activeSellers: activeSellersRes.count || 0,
        totalCustomers: customersRes.count || 0,
        avgOrderValue,
        returnRate,
      };
    });

    return NextResponse.json(stats);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[AdminStats] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
