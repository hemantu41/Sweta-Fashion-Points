import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createShipment, generateLabel, schedulePickup } from '@/lib/shiprocket';

// POST /api/seller/orders/[id]/ship
// Called when seller enters package dimensions and clicks "Generate Label & Schedule Pickup"
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { sellerId, weight = 0.5, length = 25, breadth = 20, height = 10 } = body;

    if (!sellerId) {
      return NextResponse.json({ error: 'sellerId is required' }, { status: 400 });
    }

    // 1. Fetch order from spf_orders
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('spf_orders')
      .select(`
        id, order_number, customer_id, seller_id, status,
        subtotal, shipping_charge, payment_method, shipping_address,
        spf_order_items ( product_id, product_name, sku, quantity, unit_price )
      `)
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify the seller owns this order
    if (order.seller_id !== sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 2. Fetch seller's Shiprocket pickup location
    const { data: seller, error: sellerErr } = await supabaseAdmin
      .from('spf_sellers')
      .select('id, business_name, business_email, business_phone, shiprocket_pickup_location, pickup_pincode, address_line1, city, state, pincode')
      .eq('id', sellerId)
      .single();

    if (sellerErr || !seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const pickupLocation = seller.shiprocket_pickup_location;
    if (!pickupLocation) {
      return NextResponse.json(
        { error: 'Pickup address not registered with Shiprocket. Contact admin.' },
        { status: 400 }
      );
    }

    // 3. Parse delivery address from shipping_address JSONB
    const addr  = (order.shipping_address as any) || {};
    const items = (order.spf_order_items as any[]) || [];

    // 4. Create shipment + auto-assign cheapest courier
    const shipmentResult = await createShipment({
      orderId:       `IFP-${orderId.substring(0, 8).toUpperCase()}`,
      orderDate:     new Date().toISOString().split('T')[0],
      pickupLocation,
      billingName:   addr.name   || 'Customer',
      billingPhone:  addr.phone  || '',
      billingEmail:  addr.email  || '',
      billingAddress: addr.house || addr.address_line1 || '',
      billingCity:   addr.city    || '',
      billingState:  addr.state   || '',
      billingPincode: addr.pincode || '',
      items: items.map((item: any) => ({
        name:         item.product_name || item.name || 'Product',
        sku:          item.sku || item.product_id || `SKU-${orderId.substring(0, 6)}`,
        units:        item.quantity || 1,
        sellingPrice: Number(item.unit_price) || 0,
        hsn:          item.hsn,
      })),
      paymentMethod: order.payment_method === 'COD' ? 'COD' : 'Prepaid',
      subTotal:      Number(order.subtotal) + Number(order.shipping_charge),
      weight,
      length,
      breadth,
      height,
    });

    if (!shipmentResult.success) {
      console.error('[Ship API] Shipment creation failed:', shipmentResult.error);
      return NextResponse.json(
        { error: 'Failed to create shipment: ' + shipmentResult.error },
        { status: 500 }
      );
    }

    // 5. Generate shipping label
    const labelResult = await generateLabel(shipmentResult.shipmentId!);

    // 6. Schedule pickup (tomorrow)
    const pickupResult = await schedulePickup(shipmentResult.shipmentId!);

    // 7. Save to spf_shipments
    // Note: run the spf_shipments migration in Supabase before using this route.
    const { data: savedShipment } = await supabaseAdmin
      .from('spf_shipments')
      .insert({
        order_id:           orderId,
        seller_id:          sellerId,
        shiprocket_order_id: shipmentResult.shiprocketOrderId,
        shipment_id:        shipmentResult.shipmentId,
        awb_number:         shipmentResult.awbNumber,
        courier_name:       shipmentResult.courierName,
        status:             'label_generated',
        label_url:          labelResult.labelUrl ?? null,
        label_generated_at: new Date().toISOString(),
        weight_kg:          weight,
        dimensions_cm:      `${length}x${breadth}x${height}`,
      })
      .select('id')
      .single();

    // 8. Update order status in spf_orders
    const now = new Date().toISOString();
    await supabaseAdmin
      .from('spf_orders')
      .update({
        status:          'READY_TO_SHIP',
        awb_number:      shipmentResult.awbNumber   ?? null,
        courier_partner: shipmentResult.courierName ?? null,
        tracking_url:    `${process.env.NEXT_PUBLIC_SITE_URL || 'https://instafashionpoints.com'}/track/${shipmentResult.awbNumber}`,
        updated_at:      now,
      })
      .eq('id', orderId);

    await supabaseAdmin.from('spf_order_status_history').insert({
      order_id:    orderId,
      from_status: order.status,
      to_status:   'READY_TO_SHIP',
      actor_type:  'SELLER',
      actor_id:    sellerId,
      note:        `Label generated. Courier: ${shipmentResult.courierName}. AWB: ${shipmentResult.awbNumber}`,
    });

    // 9. Add initial tracking entry
    if (savedShipment?.id) {
      await supabaseAdmin.from('spf_shipment_tracking').insert({
        shipment_id: savedShipment.id,
        status:      'label_generated',
        description: `Shipment created. Courier: ${shipmentResult.courierName}. AWB: ${shipmentResult.awbNumber}`,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        awbNumber:   shipmentResult.awbNumber,
        courierName: shipmentResult.courierName,
        labelUrl:    labelResult.labelUrl,
        pickupDate:  (pickupResult as any).pickupDate ?? null,
        trackingUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://instafashionpoints.com'}/track/${shipmentResult.awbNumber}`,
      },
    });
  } catch (err: any) {
    console.error('[Ship API] Unexpected error:', err?.message);
    return NextResponse.json(
      { error: 'Something went wrong: ' + err?.message },
      { status: 500 }
    );
  }
}
