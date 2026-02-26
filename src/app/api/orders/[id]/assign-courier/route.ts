import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getTrackingUrl } from '@/lib/courier-providers';

// POST - Assign order to courier service (Admin Only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const {
      courierCompany,
      courierTrackingNumber,
      courierExpectedDeliveryDate,
      courierNotes,
      assignedBy, // Admin user ID
    } = body;

    // Validate required fields
    if (!courierCompany || !courierTrackingNumber) {
      return NextResponse.json(
        { error: 'Courier company and tracking number are required' },
        { status: 400 }
      );
    }

    // Check if order exists and is paid
    const { data: order, error: orderError } = await supabaseAdmin
      .from('spf_payment_orders')
      .select('id, status, order_number, delivery_address')
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
        { error: 'Can only assign courier to paid orders' },
        { status: 400 }
      );
    }

    // Generate tracking URL
    const trackingUrl = getTrackingUrl(courierCompany, courierTrackingNumber);

    // Check if order already has a delivery record
    const { data: existingDelivery } = await supabaseAdmin
      .from('spf_order_deliveries')
      .select('id, status')
      .eq('order_id', orderId)
      .maybeSingle();

    const deliveryData = {
      delivery_type: 'courier',
      delivery_partner_id: null, // No local partner for courier
      courier_company: courierCompany,
      courier_tracking_number: courierTrackingNumber,
      courier_tracking_url: trackingUrl,
      courier_booking_date: new Date().toISOString(),
      courier_expected_delivery_date: courierExpectedDeliveryDate || null,
      courier_notes: courierNotes || null,
      assigned_by: assignedBy || null,
      status: 'in_transit', // Courier deliveries start as in_transit
      assigned_at: new Date().toISOString(),
      in_transit_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingDelivery) {
      // Update existing delivery record
      const { data: updatedDelivery, error: updateError } = await supabaseAdmin
        .from('spf_order_deliveries')
        .update(deliveryData)
        .eq('id', existingDelivery.id)
        .select()
        .single();

      if (updateError) {
        console.error('[Courier Assignment API] Update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update courier assignment', details: updateError.message },
          { status: 500 }
        );
      }

      // Record status change in history
      await supabaseAdmin.from('spf_delivery_status_history').insert([
        {
          order_delivery_id: existingDelivery.id,
          previous_status: existingDelivery.status,
          new_status: 'in_transit',
          changed_by: assignedBy || null,
          notes: `Assigned to ${courierCompany} - Tracking: ${courierTrackingNumber}`,
        },
      ]);

      // Update order delivery status
      await supabaseAdmin
        .from('spf_payment_orders')
        .update({ delivery_status: 'in_transit' })
        .eq('id', orderId);

      return NextResponse.json({
        success: true,
        delivery: updatedDelivery,
        trackingUrl,
        message: 'Order reassigned to courier successfully',
      });
    } else {
      // Create new delivery record
      const { data: newDelivery, error: insertError } = await supabaseAdmin
        .from('spf_order_deliveries')
        .insert([
          {
            order_id: orderId,
            ...deliveryData,
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error('[Courier Assignment API] Insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to assign order to courier', details: insertError.message },
          { status: 500 }
        );
      }

      // Record initial status in history
      await supabaseAdmin.from('spf_delivery_status_history').insert([
        {
          order_delivery_id: newDelivery.id,
          previous_status: null,
          new_status: 'in_transit',
          changed_by: assignedBy || null,
          notes: `Assigned to ${courierCompany} - Tracking: ${courierTrackingNumber}`,
        },
      ]);

      // Update order delivery status
      await supabaseAdmin
        .from('spf_payment_orders')
        .update({ delivery_status: 'in_transit' })
        .eq('id', orderId);

      return NextResponse.json({
        success: true,
        delivery: newDelivery,
        trackingUrl,
        message: 'Order assigned to courier successfully',
      }, { status: 201 });
    }
  } catch (error: any) {
    console.error('[Courier Assignment API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to assign courier',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}

// PUT - Update courier tracking information
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const {
      courierTrackingNumber,
      courierExpectedDeliveryDate,
      courierNotes,
      status,
      updatedBy,
    } = body;

    // Get existing delivery record
    const { data: delivery, error: deliveryError } = await supabaseAdmin
      .from('spf_order_deliveries')
      .select('*')
      .eq('order_id', orderId)
      .eq('delivery_type', 'courier')
      .single();

    if (deliveryError || !delivery) {
      return NextResponse.json(
        { error: 'Courier delivery record not found' },
        { status: 404 }
      );
    }

    // Update tracking info
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (courierTrackingNumber) {
      updateData.courier_tracking_number = courierTrackingNumber;
      updateData.courier_tracking_url = getTrackingUrl(delivery.courier_company, courierTrackingNumber);
    }

    if (courierExpectedDeliveryDate) {
      updateData.courier_expected_delivery_date = courierExpectedDeliveryDate;
    }

    if (courierNotes) {
      updateData.courier_notes = courierNotes;
    }

    if (status) {
      updateData.status = status;
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
        updateData.actual_delivery_date = new Date().toISOString().split('T')[0];
      }

      // Record status change
      await supabaseAdmin.from('spf_delivery_status_history').insert([
        {
          order_delivery_id: delivery.id,
          previous_status: delivery.status,
          new_status: status,
          changed_by: updatedBy || null,
        },
      ]);

      // Update order delivery status
      await supabaseAdmin
        .from('spf_payment_orders')
        .update({ delivery_status: status })
        .eq('id', orderId);
    }

    const { data: updatedDelivery, error: updateError } = await supabaseAdmin
      .from('spf_order_deliveries')
      .update(updateData)
      .eq('id', delivery.id)
      .select()
      .single();

    if (updateError) {
      console.error('[Courier Update API] Error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update courier tracking', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      delivery: updatedDelivery,
      message: 'Courier tracking updated successfully',
    });
  } catch (error: any) {
    console.error('[Courier Update API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update courier tracking',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
