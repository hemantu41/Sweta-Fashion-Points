import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Auto-assign order to best available delivery partner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, assignedBy } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('spf_payment_orders')
      .select('id, order_number, status, delivery_address')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if payment is captured
    if (order.status !== 'captured') {
      return NextResponse.json(
        { error: 'Can only auto-assign paid orders' },
        { status: 400 }
      );
    }

    const deliveryPincode = order.delivery_address?.pincode;

    if (!deliveryPincode) {
      return NextResponse.json(
        { error: 'Order does not have a delivery pincode' },
        { status: 400 }
      );
    }

    // Find best available delivery partner
    // Criteria:
    // 1. Active status
    // 2. Available (not busy or offline)
    // 3. Services the delivery pincode
    // 4. Highest success rate / rating
    // 5. Lowest number of pending deliveries

    const { data: allPartners, error: partnersError } = await supabase
      .from('spf_delivery_partners')
      .select('*')
      .eq('status', 'active')
      .eq('availability_status', 'available');

    if (partnersError || !allPartners || allPartners.length === 0) {
      return NextResponse.json(
        { error: 'No available delivery partners found' },
        { status: 404 }
      );
    }

    // Filter partners who service this pincode
    let eligiblePartners = allPartners.filter((partner) => {
      if (!partner.service_pincodes || partner.service_pincodes.length === 0) {
        return true; // Partners with no pincode restrictions can deliver anywhere
      }
      return partner.service_pincodes.includes(deliveryPincode);
    });

    if (eligiblePartners.length === 0) {
      // If no one specifically services this pincode, use all available partners
      eligiblePartners = allPartners;
    }

    // Get pending deliveries count for each partner
    const partnerIds = eligiblePartners.map((p) => p.id);
    const { data: pendingDeliveries } = await supabase
      .from('spf_order_deliveries')
      .select('delivery_partner_id')
      .in('delivery_partner_id', partnerIds)
      .in('status', ['assigned', 'accepted', 'picked_up', 'in_transit', 'out_for_delivery']);

    const pendingCounts: { [key: string]: number } = {};
    if (pendingDeliveries) {
      pendingDeliveries.forEach((delivery) => {
        const partnerId = delivery.delivery_partner_id;
        pendingCounts[partnerId] = (pendingCounts[partnerId] || 0) + 1;
      });
    }

    // Score each partner
    const scoredPartners = eligiblePartners.map((partner) => {
      let score = 0;

      // Success rate (0-40 points)
      const successRate =
        partner.total_deliveries > 0
          ? (partner.successful_deliveries / partner.total_deliveries) * 40
          : 20; // Default 20 for new partners
      score += successRate;

      // Average rating (0-30 points)
      score += (partner.average_rating || 0) * 6; // Max 5 * 6 = 30

      // Pending deliveries (0-30 points, inverse)
      const pendingCount = pendingCounts[partner.id] || 0;
      const pendingPenalty = Math.min(pendingCount * 5, 30); // -5 points per pending, max -30
      score += 30 - pendingPenalty;

      return {
        partner,
        score,
        pendingCount,
      };
    });

    // Sort by score (highest first)
    scoredPartners.sort((a, b) => b.score - a.score);

    const bestPartner = scoredPartners[0].partner;

    // Assign the order
    const { data: delivery, error: assignError } = await supabase
      .from('spf_order_deliveries')
      .insert([
        {
          order_id: orderId,
          delivery_partner_id: bestPartner.id,
          assigned_by: assignedBy || null,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (assignError) {
      console.error('[Auto-Assign API] Insert error:', assignError);
      return NextResponse.json(
        { error: 'Failed to assign order', details: assignError.message },
        { status: 500 }
      );
    }

    // Record in history
    await supabase.from('spf_delivery_status_history').insert([
      {
        order_delivery_id: delivery.id,
        previous_status: null,
        new_status: 'assigned',
        changed_by: assignedBy || null,
        notes: 'Auto-assigned based on availability and performance',
      },
    ]);

    // Update order delivery status
    await supabase
      .from('spf_payment_orders')
      .update({ delivery_status: 'assigned' })
      .eq('id', orderId);

    return NextResponse.json({
      success: true,
      delivery,
      partner: {
        id: bestPartner.id,
        name: bestPartner.name,
        mobile: bestPartner.mobile,
        vehicle_type: bestPartner.vehicle_type,
      },
      message: `Order auto-assigned to ${bestPartner.name}`,
      autoAssignDetails: {
        totalEligible: eligiblePartners.length,
        selectedScore: scoredPartners[0].score,
        pendingDeliveries: scoredPartners[0].pendingCount,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Auto-Assign API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to auto-assign order',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
