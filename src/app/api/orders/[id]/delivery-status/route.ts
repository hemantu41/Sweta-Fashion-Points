import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  notifyOrderAccepted,
  notifyOutForDelivery,
  notifyOrderDelivered,
  notifyDeliveryFailed,
} from '@/lib/delivery-notifications';

// PUT - Update delivery status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
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
    const { data: delivery, error: deliveryError } = await supabaseAdmin
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
    console.log('[Delivery Status API] Updating delivery:', delivery.id, 'with data:', JSON.stringify(updateData));
    const { data: updatedDelivery, error: updateError } = await supabaseAdmin
      .from('spf_order_deliveries')
      .update(updateData)
      .eq('id', delivery.id)
      .select()
      .single();

    if (updateError) {
      console.error('[Delivery Status API] Update error:', JSON.stringify(updateError));
      return NextResponse.json(
        { error: 'Failed to update delivery status', details: updateError.message },
        { status: 500 }
      );
    }

    // Record status change in history (non-blocking)
    try {
      const { error: historyError } = await supabaseAdmin.from('spf_delivery_status_history').insert([
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
      if (historyError) {
        console.error('[Delivery Status API] History insert error:', historyError);
      }
    } catch (histErr) {
      console.error('[Delivery Status API] History insert exception:', histErr);
    }

    // Update order delivery status (non-blocking)
    try {
      const { error: orderUpdateError } = await supabaseAdmin
        .from('spf_payment_orders')
        .update({ delivery_status: status })
        .eq('id', orderId);
      if (orderUpdateError) {
        console.error('[Delivery Status API] Order status update error:', orderUpdateError);
      }
    } catch (orderErr) {
      console.error('[Delivery Status API] Order status update exception:', orderErr);
    }

    // Update delivery partner statistics if delivered (non-blocking)
    if (status === 'delivered' && delivery.delivery_partner_id) {
      try {
        const { data: partner } = await supabaseAdmin
          .from('spf_delivery_partners')
          .select('total_deliveries, successful_deliveries')
          .eq('id', delivery.delivery_partner_id)
          .single();

        if (partner) {
          await supabaseAdmin
            .from('spf_delivery_partners')
            .update({
              total_deliveries: (partner.total_deliveries || 0) + 1,
              successful_deliveries: (partner.successful_deliveries || 0) + 1,
            })
            .eq('id', delivery.delivery_partner_id);
        }
      } catch (statsErr) {
        console.error('[Delivery Status API] Partner stats update exception:', statsErr);
      }
    }

    // Update delivery partner statistics if failed (non-blocking)
    if (status === 'failed' && delivery.delivery_partner_id) {
      try {
        const { data: partner } = await supabaseAdmin
          .from('spf_delivery_partners')
          .select('total_deliveries')
          .eq('id', delivery.delivery_partner_id)
          .single();

        if (partner) {
          await supabaseAdmin
            .from('spf_delivery_partners')
            .update({
              total_deliveries: (partner.total_deliveries || 0) + 1,
            })
            .eq('id', delivery.delivery_partner_id);
        }
      } catch (statsErr) {
        console.error('[Delivery Status API] Partner stats update exception:', statsErr);
      }
    }

    // Send notifications based on status change
    try {
      // Get order and partner details for notifications
      const { data: orderData } = await supabaseAdmin
        .from('spf_payment_orders')
        .select('order_number, tracking_number, amount, delivery_address, user_id')
        .eq('id', orderId)
        .single();

      if (orderData && delivery.delivery_partner_id) {
        const { data: partnerData } = await supabaseAdmin
          .from('spf_delivery_partners')
          .select('name, mobile')
          .eq('id', delivery.delivery_partner_id)
          .single();

        if (partnerData && orderData.delivery_address) {
          const orderDetails = {
            orderNumber: orderData.order_number,
            trackingNumber: orderData.tracking_number,
            customerName: orderData.delivery_address.name,
            customerPhone: orderData.delivery_address.phone,
            customerEmail: orderData.delivery_address.email,
            deliveryAddress: `${orderData.delivery_address.address_line1}, ${orderData.delivery_address.city}`,
            amount: orderData.amount,
          };

          const partnerDetails = {
            name: partnerData.name,
            mobile: partnerData.mobile,
          };

          // Send appropriate notification based on status
          switch (status) {
            case 'accepted':
              await notifyOrderAccepted(orderDetails, partnerDetails);
              break;
            case 'out_for_delivery':
              await notifyOutForDelivery(orderDetails, partnerDetails);
              break;
            case 'delivered':
              await notifyOrderDelivered(orderDetails);
              break;
            case 'failed':
              await notifyDeliveryFailed(orderDetails, failedReason || 'Unable to deliver');
              break;
          }
        }
      }
    } catch (notifError) {
      // Log notification errors but don't fail the request
      console.error('[Delivery Status API] Notification error:', notifError);
    }

    return NextResponse.json({
      success: true,
      delivery: updatedDelivery,
      message: `Delivery status updated to ${status}`,
    });
  } catch (error: any) {
    console.error('[Delivery Status API] Outer catch error:', error?.message || error, error?.stack);
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
    const { data: delivery, error: deliveryError } = await supabaseAdmin
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
      const { data: historyData } = await supabaseAdmin
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
