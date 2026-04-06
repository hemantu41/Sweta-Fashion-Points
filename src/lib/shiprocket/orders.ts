/**
 * Shiprocket order operations:
 *   createShiprocketOrder(orderId)
 *     1. Fetch IFP order + items from spf_orders (Prisma)
 *     2. POST /orders/create/adhoc → get shiprocket_order_id + shipment_id
 *     3. POST /courier/assign/awb  → auto-assign cheapest courier, get AWB
 *     4. POST /courier/generate/pickup → schedule next-day pickup
 *     5. Persist AWB + logistics fields on spf_orders
 *     6. Append PICKUP_SCHEDULED history entry
 */

import prisma from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { shiprocketClient } from './client';

// ─── Shiprocket API response shapes (minimal — only fields we use) ────────────

interface CreateOrderResponse {
  order_id:    number;
  shipment_id: number;
  status:      string;
  message?:    string;
}

interface AssignAwbResponse {
  response: {
    data: {
      awb_code:            string;
      courier_company_id:  number;
      courier_name:        string;
      tracking_url?:       string;
    };
  };
  awb_assign_error?: string;
}

interface PickupResponse {
  pickup_status: number;
  response?:     { data?: { appointment_delivery_date?: string } };
}

// ─── Defaults for package dimensions ─────────────────────────────────────────

const DEFAULT_LENGTH_CM   = 25;
const DEFAULT_BREADTH_CM  = 20;
const DEFAULT_HEIGHT_CM   =  5;
const DEFAULT_WEIGHT_KG   = 0.5;

// ─────────────────────────────────────────────────────────────────────────────
// Main exported function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full Shiprocket dispatch pipeline for one IFP order.
 * Call this after the seller marks the order as PACKED / READY_TO_SHIP.
 */
export async function createShiprocketOrder(orderId: string): Promise<{
  success:     boolean;
  awbNumber?:  string;
  courier?:    string;
  trackingUrl?: string;
  error?:      string;
}> {
  // ── 1. Fetch order + items ───────────────────────────────────────────────
  const order = await prisma.order.findUnique({
    where:   { id: orderId },
    include: { items: true },
  });

  if (!order) {
    return { success: false, error: `Order ${orderId} not found` };
  }

  // ── 2. Resolve seller pickup location ────────────────────────────────────
  const { data: seller } = await supabaseAdmin
    .from('spf_sellers')
    .select('shiprocket_pickup_location, business_name')
    .eq('id', order.sellerId)
    .maybeSingle();

  const pickupLocation: string =
    (seller as any)?.shiprocket_pickup_location ?? 'Primary';

  // ── 3. Build Shiprocket payload ───────────────────────────────────────────
  const addr = order.shippingAddress as {
    name: string; phone: string; house: string;
    area: string; city: string; state: string; pincode: string;
  };

  const billingAddress = `${addr.house}, ${addr.area}`;

  const orderPayload = {
    order_id:              order.orderNumber,
    order_date:            order.createdAt.toISOString().split('T')[0],
    pickup_location:       pickupLocation,

    billing_customer_name: addr.name,
    billing_address:       billingAddress,
    billing_city:          addr.city,
    billing_state:         addr.state,
    billing_pincode:       addr.pincode,
    billing_phone:         addr.phone,
    billing_email:         '',

    shipping_is_billing:   true,

    order_items: order.items.map((item) => ({
      name:          item.productName,
      sku:           item.sku ?? item.productId,
      units:         item.quantity,
      selling_price: Number(item.unitPrice),
      ...(item.hsnCode ? { hsn: Number(item.hsnCode) } : {}),
    })),

    payment_method: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
    sub_total:      Number(order.subtotal),
    length:         DEFAULT_LENGTH_CM,
    breadth:        DEFAULT_BREADTH_CM,
    height:         DEFAULT_HEIGHT_CM,
    weight:         DEFAULT_WEIGHT_KG,
  };

  // ── 4. Create Shiprocket order ────────────────────────────────────────────
  let srOrder: CreateOrderResponse;
  try {
    srOrder = await shiprocketClient.request<CreateOrderResponse>(
      'POST',
      '/orders/create/adhoc',
      orderPayload,
    );
  } catch (err: any) {
    console.error('[SR:orders] createOrder error:', err.message);
    return { success: false, error: err.message };
  }

  if (!srOrder.shipment_id) {
    return {
      success: false,
      error: `Shiprocket order creation failed: ${srOrder.message ?? JSON.stringify(srOrder)}`,
    };
  }

  // Persist Shiprocket IDs immediately so we can resume on partial failure
  await prisma.order.update({
    where: { id: orderId },
    data:  {
      shiprocketOrderId:    String(srOrder.order_id),
      shiprocketShipmentId: String(srOrder.shipment_id),
    },
  });

  // ── 5. Generate AWB (auto-assign cheapest courier) ────────────────────────
  let awbResult: AssignAwbResponse;
  try {
    awbResult = await shiprocketClient.request<AssignAwbResponse>(
      'POST',
      '/courier/assign/awb',
      { shipment_id: srOrder.shipment_id },
    );
  } catch (err: any) {
    console.error('[SR:orders] assignAWB error:', err.message);
    return { success: false, error: `AWB generation failed: ${err.message}` };
  }

  const awbData = awbResult.response?.data;
  if (!awbData?.awb_code) {
    // Try with explicit cheapest courier as fallback
    const fallback = await assignAwbWithFallback(srOrder.shipment_id);
    if (!fallback.success) {
      return { success: false, error: fallback.error };
    }
    Object.assign(awbData ?? {}, {
      awb_code:     fallback.awbCode!,
      courier_name: fallback.courierName!,
    });
  }

  const awbNumber   = awbData!.awb_code;
  const courierName = awbData!.courier_name;
  const trackingUrl =
    awbData!.tracking_url ?? `https://shiprocket.co/tracking/${awbNumber}`;

  // ── 6. Schedule pickup (next business day) ────────────────────────────────
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pickupDate = tomorrow.toISOString().split('T')[0];

    await shiprocketClient.request<PickupResponse>(
      'POST',
      '/courier/generate/pickup',
      { shipment_id: [srOrder.shipment_id], pickup_date: pickupDate },
    );
  } catch (err: any) {
    // Non-fatal — pickup can be rescheduled manually
    console.warn('[SR:orders] schedulePickup warning:', err.message);
  }

  // ── 7. Persist AWB + status on spf_orders ─────────────────────────────────
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data:  {
        awbNumber,
        courierPartner:  courierName,
        trackingUrl,
        status:          'PICKUP_SCHEDULED' as any,
        pickedUpAt:      null, // will be set when courier actually picks up
      },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus:   'PICKUP_SCHEDULED' as any,
        actorType:  'SYSTEM'           as any,
        note:       `AWB: ${awbNumber} | Courier: ${courierName} | SR shipment: ${srOrder.shipment_id}`,
      },
    }),
  ]);

  console.log(
    `[SR:orders] orderId=${orderId} awb=${awbNumber} courier=${courierName}`,
  );

  return { success: true, awbNumber, courier: courierName, trackingUrl };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Fallback: query serviceability, pick cheapest courier, re-assign AWB */
async function assignAwbWithFallback(shipmentId: number): Promise<{
  success: boolean; awbCode?: string; courierName?: string; error?: string;
}> {
  try {
    const svc = await shiprocketClient.request<any>(
      'GET',
      `/courier/serviceability/?shipment_id=${shipmentId}`,
    );
    const couriers: any[] = svc.data?.available_courier_companies ?? [];
    if (!couriers.length) return { success: false, error: 'No couriers available' };

    const cheapest = couriers.sort((a, b) => a.rate - b.rate)[0];
    const res = await shiprocketClient.request<AssignAwbResponse>(
      'POST',
      '/courier/assign/awb',
      { shipment_id: shipmentId, courier_id: cheapest.courier_company_id },
    );
    const d = res.response?.data;
    if (d?.awb_code) {
      return { success: true, awbCode: d.awb_code, courierName: d.courier_name };
    }
    return { success: false, error: 'Fallback AWB assignment also failed' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
