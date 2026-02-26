import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { notifyOrderAssigned } from '@/lib/delivery-notifications';

// POST - Assign order to delivery partner (Admin Only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const {
      deliveryPartnerId,
      estimatedDeliveryDate,
      assignedBy, // Admin user ID
    } = body;

    // Validate required fields
    if (!deliveryPartnerId) {
      return NextResponse.json(
        { error: 'Delivery partner ID is required' },
        { status: 400 }
      );
    }

    // Check if order exists
    const { data: order, error: orderError } = await supabase
      .from('spf_payment_orders')
      .select('id, status, delivery_address')
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
        { error: 'Can only assign delivery partner to paid orders' },
        { status: 400 }
      );
    }

    // Check if delivery partner exists and is active
    const { data: partner, error: partnerError } = await supabase
      .from('spf_delivery_partners')
      .select('id, name, mobile, status, availability_status, service_pincodes')
      .eq('id', deliveryPartnerId)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'Delivery partner not found' },
        { status: 404 }
      );
    }

    if (partner.status !== 'active') {
      return NextResponse.json(
        { error: 'Delivery partner is not active' },
        { status: 400 }
      );
    }

    // Check if partner services the delivery pincode
    const deliveryPincode = order.delivery_address?.pincode;
    if (deliveryPincode && partner.service_pincodes && partner.service_pincodes.length > 0) {
      const servicesPincode = partner.service_pincodes.includes(deliveryPincode);
      if (!servicesPincode) {
        return NextResponse.json(
          {
            error: 'This delivery partner does not service the delivery area',
            pincode: deliveryPincode,
          },
          { status: 400 }
        );
      }
    }

    // Check if order already has a delivery record
    const { data: existingDelivery } = await supabase
      .from('spf_order_deliveries')
      .select('id, status')
      .eq('order_id', orderId)
      .maybeSingle();

    if (existingDelivery) {
      // Update existing delivery record
      const { data: updatedDelivery, error: updateError } = await supabase
        .from('spf_order_deliveries')
        .update({
          delivery_partner_id: deliveryPartnerId,
          assigned_by: assignedBy || null,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          estimated_delivery_date: estimatedDeliveryDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingDelivery.id)
        .select()
        .single();

      if (updateError) {
        console.error('[Order Assignment API] Update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update order assignment', details: updateError.message },
          { status: 500 }
        );
      }

      // Record status change in history
      await supabase.from('spf_delivery_status_history').insert([
        {
          order_delivery_id: existingDelivery.id,
          previous_status: existingDelivery.status,
          new_status: 'assigned',
          changed_by: assignedBy || null,
        },
      ]);

      // Update order delivery status
      await supabase
        .from('spf_payment_orders')
        .update({ delivery_status: 'assigned' })
        .eq('id', orderId);

      // Send notification
      try {
        const orderDetails = {
          orderNumber: order.order_number || orderId,
          trackingNumber: order.tracking_number,
          customerName: order.delivery_address.name,
          customerPhone: order.delivery_address.phone,
          customerEmail: order.delivery_address.email,
          deliveryAddress: `${order.delivery_address.address_line1}, ${order.delivery_address.city}`,
          amount: order.amount || 0,
        };

        const partnerDetails = {
          name: partner.name,
          mobile: partner.mobile,
        };

        await notifyOrderAssigned(orderDetails, partnerDetails, estimatedDeliveryDate);
      } catch (notifError) {
        console.error('[Order Assignment API] Notification error:', notifError);
      }

      return NextResponse.json({
        success: true,
        delivery: updatedDelivery,
        message: 'Order reassigned to delivery partner successfully',
      });
    } else {
      // Create new delivery record
      const { data: newDelivery, error: insertError } = await supabase
        .from('spf_order_deliveries')
        .insert([
          {
            order_id: orderId,
            delivery_partner_id: deliveryPartnerId,
            assigned_by: assignedBy || null,
            status: 'assigned',
            assigned_at: new Date().toISOString(),
            estimated_delivery_date: estimatedDeliveryDate || null,
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error('[Order Assignment API] Insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to assign order to delivery partner', details: insertError.message },
          { status: 500 }
        );
      }

      // Record initial status in history
      await supabase.from('spf_delivery_status_history').insert([
        {
          order_delivery_id: newDelivery.id,
          previous_status: null,
          new_status: 'assigned',
          changed_by: assignedBy || null,
        },
      ]);

      // Update order delivery status
      await supabase
        .from('spf_payment_orders')
        .update({ delivery_status: 'assigned' })
        .eq('id', orderId);

      // Send notification
      try {
        const orderDetails = {
          orderNumber: order.order_number || orderId,
          trackingNumber: order.tracking_number,
          customerName: order.delivery_address.name,
          customerPhone: order.delivery_address.phone,
          customerEmail: order.delivery_address.email,
          deliveryAddress: `${order.delivery_address.address_line1}, ${order.delivery_address.city}`,
          amount: order.amount || 0,
        };

        const partnerDetails = {
          name: partner.name,
          mobile: partner.mobile,
        };

        await notifyOrderAssigned(orderDetails, partnerDetails, estimatedDeliveryDate);
      } catch (notifError) {
        console.error('[Order Assignment API] Notification error:', notifError);
      }

      return NextResponse.json({
        success: true,
        delivery: newDelivery,
        message: 'Order assigned to delivery partner successfully',
      }, { status: 201 });
    }
  } catch (error: any) {
    console.error('[Order Assignment API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to assign order',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
