import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createShipment, generateLabel, schedulePickup, addPickupLocation } from '@/lib/shiprocket';

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

    // 0. Idempotency check — if a shipment already exists, regenerate label from existing shipment
    const { data: existingShipment } = await supabaseAdmin
      .from('spf_shipments')
      .select('id, shipment_id, awb_number, courier_name, label_url')
      .eq('order_id', orderId)
      .maybeSingle();

    if (existingShipment?.shipment_id) {
      console.log('[Ship API] Shipment already exists, regenerating label for shipment_id:', existingShipment.shipment_id);
      const labelResult = await generateLabel(existingShipment.shipment_id);

      // Update label_url in DB if regeneration succeeded
      if (labelResult.labelUrl) {
        await supabaseAdmin
          .from('spf_shipments')
          .update({ label_url: labelResult.labelUrl })
          .eq('id', existingShipment.id);
      }

      const { data: order } = await supabaseAdmin
        .from('spf_orders')
        .select('tracking_url')
        .eq('id', orderId)
        .single();

      return NextResponse.json({
        success: true,
        data: {
          awbNumber:   existingShipment.awb_number,
          courierName: existingShipment.courier_name,
          labelUrl:    labelResult.labelUrl ?? existingShipment.label_url,
          pickupDate:  null,
          trackingUrl: order?.tracking_url ?? null,
        },
      });
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
      .select('id, business_name, business_email, business_phone, shiprocket_pickup_location, pickup_pincode, address_line1, address_line2, city, state, pincode')
      .eq('id', sellerId)
      .single();

    if (sellerErr || !seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    let pickupLocation = seller.shiprocket_pickup_location as string | null;

    // Auto-register pickup location in Shiprocket if not set yet
    if (!pickupLocation) {
      // Build a full address line — Shiprocket requires ≥10 chars with house/flat/road
      const fullAddress = [seller.address_line1, seller.address_line2]
        .map((s: any) => (s || '').trim())
        .filter(Boolean)
        .join(', ');

      if (fullAddress.length < 10) {
        return NextResponse.json(
          {
            error:
              'Your business address is incomplete. Please update your seller profile with a full address ' +
              '(house/flat/road number, at least 10 characters) before generating a label.',
          },
          { status: 400 },
        );
      }

      const regResult = await addPickupLocation({
        name:    seller.business_name    || 'Seller',
        email:   seller.business_email   || '',
        phone:   seller.business_phone   || '',
        address: fullAddress,
        city:    seller.city             || '',
        state:   seller.state            || '',
        pincode: seller.pincode          || seller.pickup_pincode || '',
      });

      if (!regResult.success || !regResult.pickupLocationName) {
        console.error('[Ship API] Pickup registration failed:', regResult.error);
        return NextResponse.json(
          { error: 'Failed to register pickup address with Shiprocket: ' + regResult.error },
          { status: 500 }
        );
      }

      pickupLocation = regResult.pickupLocationName;

      // Persist so we don't re-register on the next shipment
      await supabaseAdmin
        .from('spf_sellers')
        .update({ shiprocket_pickup_location: pickupLocation })
        .eq('id', sellerId);
    }

    // 3. Parse delivery address from shipping_address JSONB
    const addr = (order.shipping_address as any) || {};

    // Fetch items — fallback to direct query if join returned nothing
    let items = (order.spf_order_items as any[]) || [];
    if (items.length === 0) {
      const { data: directItems } = await supabaseAdmin
        .from('spf_order_items')
        .select('product_id, product_name, sku, quantity, unit_price')
        .eq('order_id', orderId);
      items = directItems || [];
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'Order has no items — cannot create shipment' }, { status: 400 });
    }

    // Sanitise phone — Shiprocket needs exactly 10 digits, no country code
    const rawPhone   = String(addr.phone || '').replace(/\D/g, '');
    const phone10    = rawPhone.startsWith('91') && rawPhone.length === 12
      ? rawPhone.slice(2)
      : rawPhone.slice(-10);

    // Shiprocket order_id must be unique; use order_number if available else UUID prefix
    const srOrderId  = order.order_number
      ? String(order.order_number).replace(/[^A-Za-z0-9_-]/g, '-').substring(0, 50)
      : `IFP-${orderId.substring(0, 8).toUpperCase()}`;

    const shipPayload = {
      orderId:        srOrderId,
      orderDate:      new Date().toISOString().split('T')[0],
      pickupLocation: pickupLocation!,
      billingName:    addr.name    || 'Customer',
      billingPhone:   phone10,
      billingEmail:   seller.business_email || 'noreply@instafashionpoints.com',
      billingAddress: addr.house   || addr.address_line1 || addr.area || '',
      billingCity:    addr.city    || '',
      billingState:   addr.state   || '',
      billingPincode: String(addr.pincode || '').replace(/\D/g, ''),
      items: items.map((item: any) => ({
        name:         String(item.product_name || item.name || 'Product').substring(0, 100),
        sku:          String(item.sku || item.product_id || item.id || `SKU${orderId.substring(0, 6)}`).replace(/[^A-Za-z0-9_-]/g, '').substring(0, 40),
        units:        Number(item.quantity) || 1,
        sellingPrice: Number(item.unit_price) || 1,
      })),
      paymentMethod: (order.payment_method === 'COD' ? 'COD' : 'Prepaid') as 'Prepaid' | 'COD',
      subTotal:      Math.max(1, Number(order.subtotal) + Number(order.shipping_charge)),
    };

    console.log('[Ship API] Shiprocket payload:', JSON.stringify(shipPayload, null, 2));

    // 4. Create shipment + auto-assign cheapest courier
    const shipmentResult = await createShipment({
      ...shipPayload,
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
