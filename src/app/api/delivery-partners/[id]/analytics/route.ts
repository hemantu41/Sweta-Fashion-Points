import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get delivery partner performance analytics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const timeRange = request.nextUrl.searchParams.get('range') || '30'; // days

    // Get partner info
    const { data: partner, error: partnerError } = await supabase
      .from('spf_delivery_partners')
      .select('*')
      .eq('id', id)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'Delivery partner not found' },
        { status: 404 }
      );
    }

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Get all deliveries for this partner in time range
    const { data: deliveries, error: deliveriesError } = await supabase
      .from('spf_order_deliveries')
      .select(`
        *,
        order:spf_payment_orders(amount, created_at)
      `)
      .eq('delivery_partner_id', id)
      .gte('created_at', startDate.toISOString());

    if (deliveriesError) {
      console.error('[Partner Analytics API] Error:', deliveriesError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics', details: deliveriesError.message },
        { status: 500 }
      );
    }

    // Calculate metrics
    const totalOrders = deliveries?.length || 0;
    const deliveredOrders = deliveries?.filter((d) => d.status === 'delivered').length || 0;
    const failedOrders = deliveries?.filter((d) => d.status === 'failed').length || 0;
    const pendingOrders = deliveries?.filter((d) =>
      ['assigned', 'accepted', 'picked_up', 'in_transit', 'out_for_delivery'].includes(d.status)
    ).length || 0;

    const successRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

    // Calculate average delivery time
    const deliveredWithTime = deliveries?.filter(
      (d) => d.status === 'delivered' && d.assigned_at && d.delivered_at
    ) || [];

    let avgDeliveryTime = 0;
    if (deliveredWithTime.length > 0) {
      const totalTime = deliveredWithTime.reduce((sum, d) => {
        const assigned = new Date(d.assigned_at).getTime();
        const delivered = new Date(d.delivered_at).getTime();
        return sum + (delivered - assigned);
      }, 0);

      avgDeliveryTime = totalTime / deliveredWithTime.length / (1000 * 60 * 60); // Convert to hours
    }

    // Calculate total revenue delivered
    const totalRevenue = deliveries
      ?.filter((d) => d.status === 'delivered' && d.order)
      .reduce((sum, d) => sum + (d.order.amount || 0), 0) || 0;

    // Delivery time trends (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0)).toISOString();
      const dayEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString();

      const dayDeliveries = deliveries?.filter(
        (d) => d.delivered_at && d.delivered_at >= dayStart && d.delivered_at <= dayEnd
      ).length || 0;

      last7Days.push({
        date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        deliveries: dayDeliveries,
      });
    }

    // Status distribution
    const statusDistribution = {
      assigned: deliveries?.filter((d) => d.status === 'assigned').length || 0,
      accepted: deliveries?.filter((d) => d.status === 'accepted').length || 0,
      picked_up: deliveries?.filter((d) => d.status === 'picked_up').length || 0,
      in_transit: deliveries?.filter((d) => d.status === 'in_transit').length || 0,
      out_for_delivery: deliveries?.filter((d) => d.status === 'out_for_delivery').length || 0,
      delivered: deliveredOrders,
      failed: failedOrders,
    };

    // Customer ratings breakdown
    const ratings = deliveries?.filter((d) => d.customer_rating) || [];
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, d) => sum + (d.customer_rating || 0), 0) / ratings.length
      : 0;

    const ratingDistribution = {
      5: ratings.filter((d) => d.customer_rating === 5).length,
      4: ratings.filter((d) => d.customer_rating === 4).length,
      3: ratings.filter((d) => d.customer_rating === 3).length,
      2: ratings.filter((d) => d.customer_rating === 2).length,
      1: ratings.filter((d) => d.customer_rating === 1).length,
    };

    // On-time delivery rate (if delivered before estimated date)
    const onTimeDeliveries = deliveries?.filter((d) =>
      d.status === 'delivered' &&
      d.estimated_delivery_date &&
      d.actual_delivery_date &&
      new Date(d.actual_delivery_date) <= new Date(d.estimated_delivery_date)
    ).length || 0;

    const onTimeRate = deliveredOrders > 0 ? (onTimeDeliveries / deliveredOrders) * 100 : 0;

    return NextResponse.json({
      success: true,
      analytics: {
        partner: {
          id: partner.id,
          name: partner.name,
          mobile: partner.mobile,
          vehicle_type: partner.vehicle_type,
          status: partner.status,
          availability_status: partner.availability_status,
        },
        overview: {
          totalOrders,
          deliveredOrders,
          failedOrders,
          pendingOrders,
          successRate: successRate.toFixed(2),
          avgDeliveryTimeHours: avgDeliveryTime.toFixed(2),
          totalRevenue: totalRevenue / 100, // Convert to rupees
          avgRating: avgRating.toFixed(2),
          onTimeRate: onTimeRate.toFixed(2),
        },
        trends: {
          last7Days,
        },
        distribution: {
          status: statusDistribution,
          ratings: ratingDistribution,
        },
        timeRange: {
          days: parseInt(timeRange),
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error('[Partner Analytics API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
