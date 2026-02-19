import { NextRequest, NextResponse } from 'next/server';
import { shiprocketService } from '@/lib/shiprocket';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/shiprocket/create-shipment
 * Create shipment via Shiprocket and automatically generate AWB
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      courierCompanyId, // Optional: If not provided, uses cheapest
      pickupLocation = 'Primary',
      weight, // in kg
      dimensions, // { length, breadth, height } in cm
      pickupDate, // Optional: Format YYYY-MM-DD
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Fetch order details from database
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('spf_payment_orders')
      .select('*, delivery_address')
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (orderData.status !== 'captured') {
      return NextResponse.json(
        { error: 'Order payment not completed' },
        { status: 400 }
      );
    }

    // Format order for Shiprocket
    const shiprocketOrder = shiprocketService.formatOrderForShiprocket(orderData, pickupLocation);

    // Apply custom dimensions if provided
    if (dimensions) {
      shiprocketOrder.length = dimensions.length || shiprocketOrder.length;
      shiprocketOrder.breadth = dimensions.breadth || shiprocketOrder.breadth;
      shiprocketOrder.height = dimensions.height || shiprocketOrder.height;
    }

    // Apply custom weight if provided
    if (weight) {
      shiprocketOrder.weight = weight;
    }

    // Step 1: Create order in Shiprocket
    console.log('[Shiprocket] Creating order...');
    const createResult = await shiprocketService.createOrder(shiprocketOrder);

    if (!createResult.success) {
      return NextResponse.json(
        { error: `Failed to create Shiprocket order: ${createResult.error}` },
        { status: 500 }
      );
    }

    const { shipmentId, orderId: shiprocketOrderId } = createResult;

    console.log('[Shiprocket] Order created:', { shipmentId, shiprocketOrderId });

    // Step 2: Determine courier (use provided or get cheapest)
    let selectedCourierId = courierCompanyId;
    let courierName = '';

    if (!selectedCourierId) {
      console.log('[Shiprocket] Getting available couriers...');
      const serviceabilityResult = await shiprocketService.getServiceability({
        pickup_postcode: orderData.delivery_address?.pincode?.toString() || '0', // Will be overridden by Shiprocket with pickup location
        delivery_postcode: orderData.delivery_address.pincode,
        weight: shiprocketOrder.weight,
        cod: 0,
        declared_value: shiprocketOrder.sub_total,
      });

      if (!serviceabilityResult.success || !serviceabilityResult.recommendedCourier) {
        return NextResponse.json(
          { error: 'No couriers available for this route' },
          { status: 400 }
        );
      }

      selectedCourierId = serviceabilityResult.recommendedCourier.courier_company_id;
      courierName = serviceabilityResult.recommendedCourier.courier_name;
      console.log('[Shiprocket] Auto-selected courier:', courierName);
    }

    // Step 3: Generate AWB
    console.log('[Shiprocket] Generating AWB...');
    const awbResult = await shiprocketService.generateAWB(shipmentId, selectedCourierId);

    if (!awbResult.success) {
      return NextResponse.json(
        { error: `Failed to generate AWB: ${awbResult.error}` },
        { status: 500 }
      );
    }

    const { awbCode, courierName: finalCourierName } = awbResult;
    courierName = finalCourierName || courierName;

    console.log('[Shiprocket] AWB generated:', awbCode);

    // Step 4: Schedule pickup if date provided
    if (pickupDate) {
      console.log('[Shiprocket] Scheduling pickup for:', pickupDate);
      await shiprocketService.schedulePickup(shipmentId, pickupDate);
    }

    // Step 5: Create/Update delivery record in database
    const courierIdMapping: { [key: string]: string } = {
      'Blue Dart': 'bluedart',
      'DTDC': 'dtdc',
      'Delhivery': 'delhivery',
      'Ecom Express': 'ecom-express',
      'Xpressbees': 'xpressbees',
      'India Post': 'india-post',
      'Shadowfax': 'shadowfax',
      'FedEx': 'fedex',
      'DHL': 'dhl',
      'Aramex': 'aramex',
    };

    const courierId = Object.keys(courierIdMapping).find(key =>
      courierName.toLowerCase().includes(key.toLowerCase())
    );

    const courierCompanyCode = courierId ? courierIdMapping[courierId] : 'other';

    // Generate tracking URL (will be done by our assign-courier API)
    const { COURIER_PROVIDERS } = await import('@/lib/courier-providers');
    const courierProvider = COURIER_PROVIDERS.find(p => p.id === courierCompanyCode);
    const trackingUrl = courierProvider
      ? courierProvider.trackingUrlPattern.replace('{trackingNumber}', awbCode)
      : '';

    const deliveryData = {
      order_id: orderId,
      delivery_type: 'courier' as const,
      delivery_partner_id: null,
      courier_company: courierCompanyCode,
      courier_tracking_number: awbCode,
      courier_tracking_url: trackingUrl,
      courier_booking_date: new Date().toISOString(),
      courier_expected_delivery_date: null,
      courier_notes: `Auto-booked via Shiprocket. Shipment ID: ${shipmentId}`,
      status: 'in_transit',
      assigned_at: new Date().toISOString(),
      in_transit_at: new Date().toISOString(),
    };

    const { data: delivery, error: deliveryError } = await supabaseAdmin
      .from('spf_order_deliveries')
      .upsert(deliveryData, { onConflict: 'order_id' })
      .select()
      .single();

    if (deliveryError) {
      console.error('[Shiprocket] Failed to save delivery record:', deliveryError);
    }

    // Record status in history
    await supabaseAdmin.from('spf_delivery_status_history').insert({
      delivery_id: delivery?.id,
      status: 'in_transit',
      notes: `Shipment created via Shiprocket. AWB: ${awbCode}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Shipment created successfully',
      shipmentId,
      shiprocketOrderId,
      awbCode,
      courierName,
      trackingUrl,
    });
  } catch (error: any) {
    console.error('[Shiprocket Create Shipment API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create shipment' },
      { status: 500 }
    );
  }
}
