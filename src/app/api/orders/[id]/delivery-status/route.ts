import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PUT - Update delivery status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await request.json();
    const {
      status,
      deliveryNotes,
      deliveryProofPhoto,
      failedReason,
      customerRating,
      customerFeedback,
      currentLocation,
      changedBy, // User ID (admin)
      changedByPartner, // Delivery partner ID
    } = body;

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = [
      'pending_assignment',
      'assigned',
      'accepted',
      'picked_up',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'failed',
      'returned',
      'cancelled',
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid delivery status' },
        { status: 400 }
      );
    }

    // Get existing delivery record
    const { data: delivery, error: deliveryError } = await supabase
      .from('spf_order_deliveries')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    if (deliveryError) {
      console.error('[Delivery Status API] Database error:', deliveryError);
      return NextResponse.json(
        { error: 'Failed to fetch delivery record', details: deliveryError.message },
        { status: 500 }
      );
    }

    if (!delivery) {
      return NextResponse.json(
        { error: 'Delivery record not found. Please assign a delivery partner first.' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Update timestamp based on status
    const now = new Date().toISOString();
    switch (status) {
      case 'assigned':
        updateData.assigned_at = now;
        break;
      case 'accepted':
        updateData.accepted_at = now;
        break;
      case 'picked_up':
        updateData.picked_up_at = now;
        break;
      case 'in_transit':
        updateData.in_transit_at = now;
        break;
      case 'out_for_delivery':
        updateData.out_for_delivery_at = now;
        break;
      case 'delivered':
        updateData.delivered_at = now;
        updateData.actual_delivery_date = new Date().toISOString().split('T')[0]; // Date only
        break;
    }

    // Add optional fields
    if (deliveryNotes !== undefined) updateData.delivery_notes = deliveryNotes;
    if (deliveryProofPhoto !== undefined) updateData.delivery_proof_photo = deliveryProofPhoto;
    if (failedReason !== undefined) updateData.failed_reason = failedReason;
    if (customerRating !== undefined) updateData.customer_rating = customerRating;
    if (customerFeedback !== undefined) updateData.customer_feedback = customerFeedback;
    if (currentLocation !== undefined) updateData.current_location = currentLocation;

    // Update failed attempts if status is failed
    if (status === 'failed') {
      updateData.failed_attempts = (delivery.failed_attempts || 0) + 1;
    }

    // Update tracking history if location provided
    if (currentLocation) {
      const trackingHistory = delivery.tracking_history || [];
      trackingHistory.push({
        ...currentLocation,
        timestamp: now,
        status,
      });
      updateData.tracking_history = trackingHistory;
    }

    // Update delivery record
    const { data: updatedDelivery, error: updateError } = await supabase
      .from('spf_order_deliveries')
      .update(updateData)
      .eq('id', delivery.id)
      .select()
      .single();

    if (updateError) {
      console.error('[Delivery Status API] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update delivery status', details: updateError.message },
        { status: 500 }
      );
    }

    // Record status change in history
    await supabase.from('spf_delivery_status_history').insert([
      {
        order_delivery_id: delivery.id,
        previous_status: delivery.status,
        new_status: status,
        changed_by: changedBy || null,
        changed_by_partner: changedByPartner || null,
        notes: deliveryNotes || null,
        location: currentLocation || null,
      },
    ]);

    // Update order delivery status
    await supabase
      .from('spf_payment_orders')
      .update({ delivery_status: status })
      .eq('id', orderId);

    // Update delivery partner statistics if delivered
    if (status === 'delivered' && delivery.delivery_partner_id) {
      const { data: partner } = await supabase
        .from('spf_delivery_partners')
        .select('total_deliveries, successful_deliveries')
        .eq('id', delivery.delivery_partner_id)
        .single();

      if (partner) {
        await supabase
          .from('spf_delivery_partners')
          .update({
            total_deliveries: (partner.total_deliveries || 0) + 1,
            successful_deliveries: (partner.successful_deliveries || 0) + 1,
          })
          .eq('id', delivery.delivery_partner_id);
      }
    }

    // Update delivery partner statistics if failed
    if (status === 'failed' && delivery.delivery_partner_id) {
      const { data: partner } = await supabase
        .from('spf_delivery_partners')
        .select('total_deliveries')
        .eq('id', delivery.delivery_partner_id)
        .single();

      if (partner) {
        await supabase
          .from('spf_delivery_partners')
          .update({
            total_deliveries: (partner.total_deliveries || 0) + 1,
          })
          .eq('id', delivery.delivery_partner_id);
      }
    }

    return NextResponse.json({
      success: true,
      delivery: updatedDelivery,
      message: `Delivery status updated to ${status}`,
    });
  } catch (error: any) {
    console.error('[Delivery Status API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update delivery status',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}

// GET - Get delivery status and history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    // Get delivery record with partner info
    const { data: delivery, error: deliveryError } = await supabase
      .from('spf_order_deliveries')
      .select(`
        *,
        delivery_partner:spf_delivery_partners(id, name, mobile, vehicle_type, vehicle_number)
      `)
      .eq('order_id', orderId)
      .maybeSingle();

    if (deliveryError) {
      console.error('[Delivery Status API] Database error:', deliveryError);
      return NextResponse.json(
        { error: 'Failed to fetch delivery status', details: deliveryError.message },
        { status: 500 }
      );
    }

    // Get status history
    let history = [];
    if (delivery) {
      const { data: historyData } = await supabase
        .from('spf_delivery_status_history')
        .select('*')
        .eq('order_delivery_id', delivery.id)
        .order('created_at', { ascending: true });

      history = historyData || [];
    }

    return NextResponse.json({
      success: true,
      delivery: delivery || null,
      history,
    });
  } catch (error: any) {
    console.error('[Delivery Status API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch delivery status',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
