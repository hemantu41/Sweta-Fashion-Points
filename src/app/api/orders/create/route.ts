/**
 * POST /api/orders/create
 * ─────────────────────────────────────────────────────────────────────────────
 * Full order placement pipeline:
 *  1  Validate request body (Zod)
 *  2  Pincode serviceability check
 *  3  Product price fetch + subtotal calculation
 *  4  Amount tamper check (PG amount vs computed total)
 *  5  Duplicate transaction guard
 *  6  Create order + items in DB  ─┐
 *  7  Run fraud / risk engine       │
 *  8  Notify seller                 │
 *  9  Write initial status history ─┘
 * 10  Return { orderId, orderNumber, status, estimatedDelivery }
 *
 * Uses Supabase (no Prisma/DATABASE_URL needed).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { runRiskChecks } from '@/lib/fraud/riskEngine';
import { notify } from '@/lib/createNotification';
import type { PaymentMethod as RiskPaymentMethod } from '@/lib/fraud/riskEngine';

// ─────────────────────────────────────────────────────────────────────────────
// Zod schema
// ─────────────────────────────────────────────────────────────────────────────

const CartItemSchema = z.object({
  productId:      z.string().uuid('productId must be a UUID'),
  variantId:      z.string().uuid().optional(),
  quantity:       z.number().int().positive().max(99),
  variantDetails: z.record(z.string()).optional(),
});

const ShippingAddressSchema = z.object({
  name:     z.string().min(1).max(100),
  phone:    z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  house:    z.string().min(1).max(200),
  area:     z.string().min(1).max(200),
  city:     z.string().min(1).max(100),
  state:    z.string().min(1).max(100),
  pincode:  z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  landmark: z.string().max(200).optional(),
});

const CreateOrderSchema = z.object({
  /** UUID from spf_users */
  customerId:         z.string().uuid(),
  items:              z.array(CartItemSchema).min(1).max(20),
  shippingAddress:    ShippingAddressSchema,
  paymentMethod:      z.enum(['UPI', 'CARD', 'NET_BANKING', 'COD']),
  /** Razorpay order_id (required for non-COD) */
  paymentGatewayRef:  z.string().optional(),
  /** Razorpay payment_id (required for non-COD) */
  transactionId:      z.string().optional(),
  /** Amount confirmed by PG, in INR — not paise (required for non-COD) */
  pgAmount:           z.number().nonnegative().optional(),
  /** Browser / device fingerprint hash */
  deviceId:           z.string().max(128).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Pricing constants
// ─────────────────────────────────────────────────────────────────────────────

const SHIPPING_FLAT_INR    = 60;
const FREE_SHIPPING_ABOVE  = 499;
const PLATFORM_FEE_RATE    = 0.02;   // 2 % of subtotal
const PG_FEE_RATE          = 0.018;  // 1.8 % for CARD / UPI
const AMOUNT_TOLERANCE_INR = 1;      // ± ₹1 allowed rounding

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Round to 2 decimal places */
function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Generate IFP-ORD-YYYYMMDD-XXXX (no ambiguous chars: 0, O, I, 1) */
function makeOrderNumber(): string {
  const date   = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const alpha  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const suffix = Array.from({ length: 4 }, () =>
    alpha[Math.floor(Math.random() * alpha.length)],
  ).join('');
  return `IFP-ORD-${date}-${suffix}`;
}

/** Uniform error shape */
function apiErr(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── Step 1: Parse & validate ─────────────────────────────────────────────
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiErr('Invalid JSON body', 'INVALID_BODY', 400);
    }

    const parsed = CreateOrderSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:  'Validation failed',
          code:   'VALIDATION_ERROR',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    const {
      customerId,
      items,
      shippingAddress,
      paymentMethod,
      paymentGatewayRef,
      transactionId,
      pgAmount,
      deviceId,
    } = parsed.data;

    // Extract client IP from reverse-proxy headers
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      '127.0.0.1';

    // Online payments require gateway details
    if (paymentMethod !== 'COD') {
      if (!paymentGatewayRef || !transactionId || pgAmount === undefined) {
        return apiErr(
          'paymentGatewayRef, transactionId, and pgAmount are required for online payments',
          'MISSING_PAYMENT_FIELDS',
          422,
        );
      }
    }

    // ── Step 2: Pincode serviceability ───────────────────────────────────────
    const { data: pincodeConfig } = await supabaseAdmin
      .from('spf_pincode_risk_config')
      .select('is_serviceable, is_cod_disabled')
      .eq('pincode', shippingAddress.pincode)
      .maybeSingle();

    if (pincodeConfig?.is_serviceable === false) {
      return apiErr('Delivery not available to this pincode', 'PINCODE_NOT_SERVICEABLE', 422);
    }
    if (pincodeConfig?.is_cod_disabled === true && paymentMethod === 'COD') {
      return apiErr('COD not available for this pincode', 'COD_DISABLED_PINCODE', 422);
    }

    // ── Step 3: Product price fetch & subtotal calculation ───────────────────
    const productIds = [...new Set(items.map((i) => i.productId))];

    const { data: products, error: productErr } = await supabaseAdmin
      .from('spf_productdetails')
      .select('id, name, price, seller_id, stock_quantity, is_active, approval_status')
      .in('id', productIds);

    if (productErr || !products) {
      console.error('[OrderCreate] Product fetch error:', productErr);
      return apiErr('Failed to load products', 'PRODUCT_FETCH_FAILED', 500);
    }

    const productMap = new Map(products.map((p: any) => [p.id as string, p]));

    // Validate each item
    for (const item of items) {
      const p = productMap.get(item.productId);
      if (!p) {
        return apiErr(`Product ${item.productId} not found`, 'PRODUCT_NOT_FOUND', 422);
      }
      if (!p.is_active || p.approval_status !== 'approved') {
        return apiErr(`"${p.name}" is not available`, 'PRODUCT_UNAVAILABLE', 422);
      }
      if ((p.stock_quantity ?? 0) < item.quantity) {
        return apiErr(
          `Insufficient stock for "${p.name}" (requested: ${item.quantity}, available: ${p.stock_quantity ?? 0})`,
          'INSUFFICIENT_STOCK',
          422,
        );
      }
    }

    // IFP model: one order = one seller. Reject mixed-seller carts.
    const sellerIds = new Set(
      items.map((i) => productMap.get(i.productId)!.seller_id as string),
    );
    if (sellerIds.size > 1) {
      return apiErr(
        'All items must belong to the same seller — split the cart before placing',
        'MULTI_SELLER_CART',
        422,
      );
    }
    const sellerId = [...sellerIds][0];

    // Build enriched line items + compute subtotal
    let subtotal = 0;
    const lineItems = items.map((item) => {
      const p         = productMap.get(item.productId)!;
      const unitPrice = r2(Number(p.price));
      const lineTotal = r2(unitPrice * item.quantity);
      subtotal       += lineTotal;

      return {
        productId:      item.productId,
        variantId:      item.variantId ?? null,
        sellerId,
        productName:    p.name as string,
        variantDetails: (item.variantDetails as any) ?? null,
        quantity:       item.quantity,
        unitPrice,
        totalPrice:     lineTotal,
      };
    });
    subtotal = r2(subtotal);

    const shippingCharge = subtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FLAT_INR;
    const platformFee    = r2(subtotal * PLATFORM_FEE_RATE);
    const pgFee          = (paymentMethod === 'CARD' || paymentMethod === 'UPI')
      ? r2((subtotal + shippingCharge) * PG_FEE_RATE)
      : 0;
    const sellerPayout   = r2(subtotal - platformFee - pgFee);
    const orderTotal     = r2(subtotal + shippingCharge); // what customer pays

    // ── Step 4: Amount tamper check ───────────────────────────────────────────
    if (paymentMethod !== 'COD' && pgAmount !== undefined) {
      const diff = Math.abs(pgAmount - orderTotal);
      if (diff > AMOUNT_TOLERANCE_INR) {
        console.warn(
          `[OrderCreate] Amount mismatch: pgAmount=₹${pgAmount}, expected=₹${orderTotal}, diff=₹${diff.toFixed(2)}, customerId=${customerId}`,
        );
        return apiErr(
          'Payment amount does not match order total',
          'AMOUNT_MISMATCH',
          422,
        );
      }
    }

    // ── Step 5: Duplicate transaction guard ───────────────────────────────────
    if (transactionId) {
      const { data: dupe } = await supabaseAdmin
        .from('spf_orders')
        .select('id')
        .eq('transaction_id', transactionId)
        .maybeSingle();
      if (dupe) {
        return apiErr('This transaction has already been processed', 'DUPLICATE_TRANSACTION', 409);
      }
    }

    // ── Pre-flight: customer existence + block check ──────────────────────────
    const { data: customer, error: custErr } = await supabaseAdmin
      .from('spf_users')
      .select('id, phone, created_at')
      .eq('id', customerId)
      .maybeSingle();

    if (custErr || !customer) {
      return apiErr('Customer not found', 'CUSTOMER_NOT_FOUND', 404);
    }

    const { data: riskProfile } = await supabaseAdmin
      .from('spf_customer_risk_profiles')
      .select('is_blocked')
      .eq('customer_id', customerId)
      .maybeSingle();

    if (riskProfile?.is_blocked) {
      return apiErr(
        'Unable to place order at this time. Please contact support.',
        'CUSTOMER_BLOCKED',
        403,
      );
    }

    // ── Steps 6 + 9: Create order, items, and initial history ─────────────────
    const now           = new Date();
    const acceptanceSla = new Date(now.getTime() + 2 * 3600 * 1000); // +2 h
    const packingSla    = new Date(now.getTime() + 4 * 3600 * 1000); // +4 h

    // COD orders skip payment confirmation and go straight to CONFIRMED
    const initialStatus = paymentMethod === 'COD' ? 'CONFIRMED' : 'PENDING_PAYMENT';

    // Collision-safe order number (5 retries, ~1-in-billion chance per attempt)
    let orderNumber = makeOrderNumber();
    for (let i = 0; i < 5; i++) {
      const { data: conflict } = await supabaseAdmin
        .from('spf_orders')
        .select('id')
        .eq('order_number', orderNumber)
        .maybeSingle();
      if (!conflict) break;
      orderNumber = makeOrderNumber();
    }

    // ── 6a: Insert order ─────────────────────────────────────────────────────
    const { data: orderData, error: orderErr } = await supabaseAdmin
      .from('spf_orders')
      .insert({
        order_number:            orderNumber,
        customer_id:             customerId,
        seller_id:               sellerId,
        status:                  initialStatus,
        payment_method:          paymentMethod,
        payment_status:          paymentMethod === 'COD' ? 'pending' : 'captured',
        payment_gateway_ref:     paymentGatewayRef    ?? null,
        transaction_id:          transactionId        ?? null,
        subtotal,
        shipping_charge:         shippingCharge,
        platform_fee:            platformFee,
        pg_fee:                  pgFee,
        seller_payout_amount:    sellerPayout,
        shipping_address:        shippingAddress,
        notes:                   deviceId ? `device:${deviceId}` : null,
        acceptance_sla_deadline: acceptanceSla.toISOString(),
        packing_sla_deadline:    packingSla.toISOString(),
      })
      .select('id, order_number, status')
      .single();

    if (orderErr || !orderData) {
      console.error('[OrderCreate] Order insert failed:', orderErr?.message);
      return apiErr('Failed to create order', 'ORDER_CREATE_FAILED', 500);
    }

    // ── 6b: Insert line items ─────────────────────────────────────────────────
    const { error: itemsErr } = await supabaseAdmin
      .from('spf_order_items')
      .insert(lineItems.map((li) => ({
        order_id:        orderData.id,
        product_id:      li.productId,
        variant_id:      li.variantId,
        seller_id:       li.sellerId,
        product_name:    li.productName,
        variant_details: li.variantDetails,
        quantity:        li.quantity,
        unit_price:      li.unitPrice,
        total_price:     li.totalPrice,
      })));

    if (itemsErr) {
      console.error('[OrderCreate] Items insert failed:', itemsErr.message);
      // Clean up orphaned order
      await supabaseAdmin.from('spf_orders').delete().eq('id', orderData.id);
      return apiErr('Failed to create order items', 'ORDER_ITEMS_FAILED', 500);
    }

    // ── Step 9: Initial status history ───────────────────────────────────────
    await supabaseAdmin.from('spf_order_status_history').insert({
      order_id:    orderData.id,
      from_status: null,
      to_status:   initialStatus,
      actor_type:  'SYSTEM',
      actor_id:    null,
      note: paymentMethod === 'COD'
        ? 'COD order confirmed automatically at placement'
        : 'Order created — awaiting payment capture confirmation',
    });

    // ── Step 7: Fraud / risk engine ───────────────────────────────────────────
    const deliveryAddrStr = `${shippingAddress.house} ${shippingAddress.area}`;

    let riskResult: { decision: string; score: number; status: string; flags: Array<{ flagType: string }> };
    try {
      riskResult = await runRiskChecks({
        orderId:          orderData.id,
        customerId,
        paymentMethod:    paymentMethod    as RiskPaymentMethod,
        orderValue:       orderTotal,
        transactionId,
        pgAmount:         pgAmount ?? 0,
        dbAmount:         orderTotal,
        customerPhone:    (customer.phone as string | null) ?? shippingAddress.phone,
        deliveryAddress:  deliveryAddrStr,
        pincode:          shippingAddress.pincode,
        deviceId,
        ipAddress,
        accountCreatedAt: new Date(customer.created_at as string),
      });
    } catch (riskErr: any) {
      console.error('[OrderCreate] Risk engine error (non-fatal):', riskErr?.message);
      riskResult = { decision: 'AUTO_CONFIRM', score: 0, status: 'CLEAR', flags: [] };
    }

    // ── Handle risk decision ─────────────────────────────────────────────────
    if (riskResult.decision === 'REJECT') {
      await supabaseAdmin
        .from('spf_orders')
        .update({ status: 'CANCELLED', updated_at: now.toISOString() })
        .eq('id', orderData.id);

      await supabaseAdmin.from('spf_order_status_history').insert({
        order_id:    orderData.id,
        from_status: initialStatus,
        to_status:   'CANCELLED',
        actor_type:  'SYSTEM',
        actor_id:    null,
        note:        `Auto-rejected by fraud engine — risk_score=${riskResult.score} flags=[${riskResult.flags.map((f) => f.flagType).join(', ')}]`,
      });

      return apiErr(
        'Order could not be placed. Please contact support if you believe this is an error.',
        'FRAUD_REJECTED',
        422,
      );
    }

    if (riskResult.decision === 'HOLD_FOR_REVIEW') {
      const estimatedDelivery = new Date(now.getTime() + 5 * 86400 * 1000)
        .toISOString()
        .slice(0, 10);

      return NextResponse.json(
        {
          orderId:           orderData.id,
          orderNumber:       orderData.order_number,
          status:            orderData.status,
          estimatedDelivery,
          riskStatus:        riskResult.status,
        },
        { status: 202 },
      );
    }

    // ── Step 8: Notify seller (CLEAR or SOFT_FLAG only) ───────────────────────
    void notify.newOrder(sellerId, orderNumber, orderTotal);

    // ── Step 10: Return success ───────────────────────────────────────────────
    const estimatedDelivery = new Date(now.getTime() + 5 * 86400 * 1000)
      .toISOString()
      .slice(0, 10);

    return NextResponse.json(
      {
        orderId:           orderData.id,
        orderNumber:       orderData.order_number,
        status:            orderData.status,
        estimatedDelivery,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('[OrderCreate] Unhandled error:', error?.message, error?.stack);
    return NextResponse.json(
      { error: 'Something went wrong', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
