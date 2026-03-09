import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { haversineDistance, distanceScore, optimizeRoute, canMeetSla } from '@/lib/delivery-batch';

// POST - Auto-assign order to best available delivery partner (GPS-distance scoring + batch logic)
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

    // 1. Get order details (include items for seller_id lookup)
    const { data: order, error: orderError } = await supabase
      .from('spf_payment_orders')
      .select('id, order_number, status, delivery_address, items, sla_deadline')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.status !== 'captured') {
      return NextResponse.json(
        { error: 'Can only auto-assign paid orders' },
        { status: 400 }
      );
    }

    // 2. Get seller lat/lng from the first item's seller_id
    let sellerLat: number | null = null;
    let sellerLng: number | null = null;

    const firstSellerId =
      Array.isArray(order.items) && order.items.length > 0
        ? order.items[0]?.seller_id
        : null;

    if (firstSellerId) {
      const { data: seller } = await supabase
        .from('spf_sellers')
        .select('latitude, longitude')
        .eq('id', firstSellerId)
        .single();

      if (seller?.latitude != null && seller?.longitude != null) {
        sellerLat = Number(seller.latitude);
        sellerLng = Number(seller.longitude);
      }
    }

    // 3. Get customer delivery lat/lng (if stored in delivery_address)
    const customerLat =
      order.delivery_address?.latitude != null
        ? Number(order.delivery_address.latitude)
        : null;
    const customerLng =
      order.delivery_address?.longitude != null
        ? Number(order.delivery_address.longitude)
        : null;

    // 4. Fetch all active available partners
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

    // 5. Eligibility filter — GPS-within-35-km if seller coords known; else pincode fallback
    const deliveryPincode = order.delivery_address?.pincode;
    let eligiblePartners = allPartners;

    if (sellerLat != null && sellerLng != null) {
      // GPS mode: prefer partners within 35 km of the seller
      const nearby = allPartners.filter((p) => {
        if (p.latitude == null || p.longitude == null) return true; // include partners without GPS
        const dist = haversineDistance(sellerLat!, sellerLng!, Number(p.latitude), Number(p.longitude));
        return dist <= 35;
      });
      eligiblePartners = nearby.length > 0 ? nearby : allPartners;
    } else if (deliveryPincode) {
      // Pincode fallback
      const pinFiltered = allPartners.filter((partner) => {
        if (!partner.service_pincodes || partner.service_pincodes.length === 0) return true;
        return partner.service_pincodes.includes(deliveryPincode);
      });
      eligiblePartners = pinFiltered.length > 0 ? pinFiltered : allPartners;
    }

    // 6. Get pending deliveries count for each eligible partner
    const partnerIds = eligiblePartners.map((p) => p.id);
    const { data: pendingDeliveries } = await supabase
      .from('spf_order_deliveries')
      .select('delivery_partner_id')
      .in('delivery_partner_id', partnerIds)
      .in('status', ['assigned', 'accepted', 'picked_up', 'in_transit', 'out_for_delivery']);

    const pendingCounts: { [key: string]: number } = {};
    if (pendingDeliveries) {
      pendingDeliveries.forEach((d) => {
        pendingCounts[d.delivery_partner_id] = (pendingCounts[d.delivery_partner_id] || 0) + 1;
      });
    }

    // 7. Score each partner (100 pts total)
    //    Distance to seller  0–30 pts
    //    Success rate        0–40 pts
    //    Average rating      0–20 pts
    //    Pending deliveries  0–10 pts (inverse)
    const scoredPartners = eligiblePartners.map((partner) => {
      let score = 0;

      // Distance to seller (0–30 pts)
      if (
        sellerLat != null &&
        sellerLng != null &&
        partner.latitude != null &&
        partner.longitude != null
      ) {
        const dist = haversineDistance(
          sellerLat,
          sellerLng,
          Number(partner.latitude),
          Number(partner.longitude)
        );
        score += distanceScore(dist);
      } else {
        score += 15; // Neutral when GPS unavailable
      }

      // Success rate (0–40 pts)
      const successRate =
        partner.total_deliveries > 0
          ? (partner.successful_deliveries / partner.total_deliveries) * 40
          : 20; // Default for new partners
      score += successRate;

      // Average rating (0–20 pts)
      score += (partner.average_rating || 0) * 4; // max 5 × 4 = 20

      // Pending deliveries (0–10 pts, inverse)
      const pendingCount = pendingCounts[partner.id] || 0;
      score += Math.max(0, 10 - pendingCount * 2);

      return { partner, score, pendingCount };
    });

    // Sort by score descending
    scoredPartners.sort((a, b) => b.score - a.score);
    const bestPartner = scoredPartners[0].partner;

    // 8. Batch grouping (only when customer lat/lng is available)
    let batchId: string | null = null;
    let routeOrder: string[] = [];

    if (customerLat != null && customerLng != null) {
      // Find the most recent active batch for this partner
      const { data: activeBatch } = await supabase
        .from('spf_delivery_batches')
        .select('id, order_ids, route_order')
        .eq('partner_id', bestPartner.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeBatch) {
        const batchOrderIds: string[] = activeBatch.order_ids || [];

        if (batchOrderIds.length < 5) {
          // Fetch delivery addresses for orders in the current batch
          const { data: batchOrders } = await supabase
            .from('spf_payment_orders')
            .select('id, delivery_address, sla_deadline')
            .in('id', batchOrderIds);

          const batchStops = (batchOrders || [])
            .filter(
              (o) =>
                o.delivery_address?.latitude != null &&
                o.delivery_address?.longitude != null
            )
            .map((o) => ({
              id: o.id,
              lat: Number(o.delivery_address.latitude),
              lng: Number(o.delivery_address.longitude),
              slaDeadline: o.sla_deadline
                ? new Date(o.sla_deadline)
                : new Date(Date.now() + 4 * 3_600_000),
            }));

          if (batchStops.length > 0) {
            // All existing batch stops must be within 3 km of the new customer
            const allNearby = batchStops.every((stop) => {
              const dist = haversineDistance(customerLat, customerLng, stop.lat, stop.lng);
              return dist <= 3;
            });

            const newStop = {
              id: orderId,
              lat: customerLat,
              lng: customerLng,
              slaDeadline: order.sla_deadline
                ? new Date(order.sla_deadline)
                : new Date(Date.now() + 4 * 3_600_000),
            };
            const allStops = [...batchStops, newStop];

            const slaOk =
              bestPartner.latitude != null && bestPartner.longitude != null
                ? canMeetSla(
                    Number(bestPartner.latitude),
                    Number(bestPartner.longitude),
                    allStops
                  )
                : true;

            if (allNearby && slaOk) {
              // Add to existing batch
              const updatedOrderIds = [...batchOrderIds, orderId];
              const pickupLat =
                bestPartner.latitude != null ? Number(bestPartner.latitude) : customerLat;
              const pickupLng =
                bestPartner.longitude != null ? Number(bestPartner.longitude) : customerLng;
              const updatedRoute = optimizeRoute(pickupLat, pickupLng, allStops);

              await supabase
                .from('spf_delivery_batches')
                .update({
                  order_ids: updatedOrderIds,
                  route_order: updatedRoute,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', activeBatch.id);

              batchId = activeBatch.id;
              routeOrder = updatedRoute;
            }
          }
        }
      }

      // No suitable existing batch — create a new one
      if (!batchId) {
        const { data: newBatch } = await supabase
          .from('spf_delivery_batches')
          .insert([
            {
              partner_id: bestPartner.id,
              status: 'active',
              order_ids: [orderId],
              route_order: [orderId],
            },
          ])
          .select()
          .single();

        if (newBatch) {
          batchId = newBatch.id;
          routeOrder = [orderId];
        }
      }
    }

    // 9. Create delivery record
    const insertData: Record<string, unknown> = {
      order_id: orderId,
      delivery_partner_id: bestPartner.id,
      assigned_by: assignedBy || null,
      status: 'assigned',
      assigned_at: new Date().toISOString(),
      last_status_update_at: new Date().toISOString(),
    };
    if (batchId) insertData.batch_id = batchId;

    const { data: delivery, error: assignError } = await supabase
      .from('spf_order_deliveries')
      .insert([insertData])
      .select()
      .single();

    if (assignError) {
      console.error('[Auto-Assign API] Insert error:', assignError);
      return NextResponse.json(
        { error: 'Failed to assign order', details: assignError.message },
        { status: 500 }
      );
    }

    // 10. History log + order status update
    await supabase.from('spf_delivery_status_history').insert([
      {
        order_delivery_id: delivery.id,
        previous_status: null,
        new_status: 'assigned',
        changed_by: assignedBy || null,
        notes: `Auto-assigned by GPS proximity${batchId ? ' (batched delivery)' : ''}`,
      },
    ]);

    await supabase
      .from('spf_payment_orders')
      .update({ delivery_status: 'assigned' })
      .eq('id', orderId);

    return NextResponse.json(
      {
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
          sellerGpsUsed: sellerLat != null,
          batchId,
          routeOrder,
        },
      },
      { status: 201 }
    );
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
