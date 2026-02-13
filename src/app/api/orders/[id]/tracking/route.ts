import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get delivery tracking details (Customer facing)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const userId = request.nextUrl.searchParams.get('userId');

    console.log('[Tracking API] Request for order:', orderId, 'by user:', userId);

    // Get order with delivery info
    const { data: order, error: orderError } = await supabase
      .from('spf_payment_orders')
      .select('id, order_number, status, delivery_status, tracking_number, user_id, delivery_address, created_at, amount')
      .eq('id', orderId)
      .maybeSingle();

    console.log('[Tracking API] Order query result:', { order, orderError });

    if (orderError) {
      console.error('[Tracking API] Order query error:', orderError);
      return NextResponse.json(
        { error: 'Failed to fetch order', details: orderError.message },
        { status: 500 }
      );
    }

    if (!order) {
      console.log('[Tracking API] Order not found for ID:', orderId);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify user owns this order (privacy check)
    if (userId && order.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to view this order' },
        { status: 403 }
      );
    }

    // Get delivery record with partner info
    // Try to get delivery info, but handle gracefully if tables don't exist
    let delivery = null;
    let statusHistory = [];

    try {
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('spf_order_deliveries')
        .select(`
          id,
          status,
          assigned_at,
          accepted_at,
          picked_up_at,
          in_transit_at,
          out_for_delivery_at,
          delivered_at,
          estimated_delivery_date,
          actual_delivery_date,
          delivery_notes,
          customer_rating,
          customer_feedback,
          delivery_partner:spf_delivery_partners(
            id,
            name,
            mobile,
            vehicle_type,
            vehicle_number
          )
        `)
        .eq('order_id', orderId)
        .maybeSingle();

      // Only use delivery data if no error
      if (!deliveryError) {
        delivery = deliveryData;
      }

      // Get status history if delivery exists
      if (delivery) {
        const { data: historyData } = await supabase
          .from('spf_delivery_status_history')
          .select('new_status, created_at, notes')
          .eq('order_delivery_id', delivery.id)
          .order('created_at', { ascending: true });

        statusHistory = historyData || [];
      }
    } catch (deliveryTableError) {
      // Tables might not exist yet - continue without delivery data
      console.log('[Tracking API] Delivery tables not found - showing basic tracking');
    }

    // Build timeline for customer
    const timeline = [];

    // Order placed
    timeline.push({
      status: 'placed',
      title: 'Order Placed',
      timestamp: order.created_at,
      completed: true,
      description: `Order #${order.order_number} has been placed successfully`,
    });

    // Order confirmed (payment captured)
    if (order.status === 'captured') {
      timeline.push({
        status: 'confirmed',
        title: 'Payment Confirmed',
        timestamp: order.created_at,
        completed: true,
        description: 'Your payment has been confirmed',
      });
    }

    if (delivery) {
      // Assigned to partner
      if (delivery.assigned_at) {
        timeline.push({
          status: 'assigned',
          title: 'Assigned to Delivery Partner',
          timestamp: delivery.assigned_at,
          completed: true,
          description: delivery.delivery_partner
            ? `Assigned to ${delivery.delivery_partner.name}`
            : 'Assigned to delivery partner',
        });
      }

      // Accepted by partner
      if (delivery.accepted_at) {
        timeline.push({
          status: 'accepted',
          title: 'Order Accepted',
          timestamp: delivery.accepted_at,
          completed: true,
          description: 'Delivery partner has accepted your order',
        });
      }

      // Picked up
      if (delivery.picked_up_at) {
        timeline.push({
          status: 'picked_up',
          title: 'Order Picked Up',
          timestamp: delivery.picked_up_at,
          completed: true,
          description: 'Order has been picked up from warehouse',
        });
      }

      // In transit
      if (delivery.in_transit_at) {
        timeline.push({
          status: 'in_transit',
          title: 'In Transit',
          timestamp: delivery.in_transit_at,
          completed: true,
          description: 'Your order is on the way',
        });
      }

      // Out for delivery
      if (delivery.out_for_delivery_at) {
        timeline.push({
          status: 'out_for_delivery',
          title: 'Out for Delivery',
          timestamp: delivery.out_for_delivery_at,
          completed: true,
          description: 'Order is out for delivery and will arrive soon',
        });
      }

      // Delivered
      if (delivery.delivered_at) {
        timeline.push({
          status: 'delivered',
          title: 'Delivered',
          timestamp: delivery.delivered_at,
          completed: true,
          description: 'Order has been successfully delivered',
        });
      }
    }

    // Mask delivery partner contact (show only if order is accepted or later)
    let partnerContact = null;
    if (delivery && delivery.delivery_partner) {
      const showContact =
        delivery.accepted_at ||
        delivery.picked_up_at ||
        delivery.in_transit_at ||
        delivery.out_for_delivery_at;

      if (showContact) {
        partnerContact = {
          name: delivery.delivery_partner.name,
          mobile: delivery.delivery_partner.mobile,
          vehicleType: delivery.delivery_partner.vehicle_type,
        };
      } else {
        partnerContact = {
          name: delivery.delivery_partner.name,
          mobile: null, // Don't show until accepted
          vehicleType: delivery.delivery_partner.vehicle_type,
        };
      }
    }

    console.log('[Tracking API] Returning tracking data with timeline length:', timeline.length);

    return NextResponse.json({
      success: true,
      tracking: {
        orderNumber: order.order_number || orderId,
        trackingNumber: order.tracking_number || null,
        orderStatus: order.status,
        deliveryStatus: order.delivery_status || 'pending_assignment',
        estimatedDeliveryDate: delivery?.estimated_delivery_date || null,
        actualDeliveryDate: delivery?.actual_delivery_date || null,
        deliveryPartner: partnerContact,
        timeline,
        statusHistory,
        deliveryAddress: order.delivery_address || {
          name: 'N/A',
          phone: 'N/A',
          address_line1: 'N/A',
          city: 'N/A',
          state: 'N/A',
          pincode: 'N/A'
        },
      },
    });
  } catch (error: any) {
    console.error('[Order Tracking API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch tracking information',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
