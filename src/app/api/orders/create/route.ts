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
 *  7  Run fraud / risk engine       │ atomic where possible
 *  8  Notify seller                 │
 *  9  Write initial status history ─┘
 * 10  Return { orderId, orderNumber, status, estimatedDelivery }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
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
    const pincodeConfig = await prisma.pincodeRiskConfig.findUnique({
      where:  { pincode: shippingAddress.pincode },
      select: { isServiceable: true, isCodDisabled: true },
    });

    if (pincodeConfig?.isServiceable === false) {
      return apiErr('Delivery not available to this pincode', 'PINCODE_NOT_SERVICEABLE', 422);
    }
    if (pincodeConfig?.isCodDisabled === true && paymentMethod === 'COD') {
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
    let subtotal  = 0;
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
      const dupe = await prisma.order.findFirst({
        where:  { transactionId },
        select: { id: true },
      });
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

    const riskProfile = await prisma.customerRiskProfile.findUnique({
      where:  { customerId },
      select: { isBlocked: true },
    });
    if (riskProfile?.isBlocked) {
      return apiErr(
        'Unable to place order at this time. Please contact support.',
        'CUSTOMER_BLOCKED',
        403,
      );
    }

    // ── Steps 6 + 9: Create order, items, and initial history atomically ──────
    const now           = new Date();
    const acceptanceSla = new Date(now.getTime() + 2 * 3600 * 1000); // +2 h
    const packingSla    = new Date(now.getTime() + 4 * 3600 * 1000); // +4 h

    // COD orders skip payment confirmation and go straight to CONFIRMED
    const initialStatus: string = paymentMethod === 'COD' ? 'CONFIRMED' : 'PENDING_PAYMENT';

    // Collision-safe order number (5 retries, ~1-in-billion chance per attempt)
    let orderNumber = makeOrderNumber();
    for (let i = 0; i < 5; i++) {
      const conflict = await prisma.order.findUnique({
        where:  { orderNumber },
        select: { id: true },
      });
      if (!conflict) break;
      orderNumber = makeOrderNumber();
    }

    const createdOrder = await prisma.$transaction(async (tx) => {
      // ── 6a: Insert order ────────────────────────────────────────────────────
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          sellerId,
          status:                initialStatus        as any,
          paymentMethod:         paymentMethod        as any,
          paymentStatus:         paymentMethod === 'COD' ? 'pending' : 'captured',
          paymentGatewayRef:     paymentGatewayRef    ?? null,
          transactionId:         transactionId        ?? null,
          subtotal,
          shippingCharge,
          platformFee,
          pgFee,
          sellerPayoutAmount:    sellerPayout,
          shippingAddress:       shippingAddress      as any,
          // Store device fingerprint in notes until a dedicated column is added
          notes:                 deviceId ? `device:${deviceId}` : null,
          acceptanceSlaDeadline: acceptanceSla,
          packingSlaDeadline:    packingSla,
        },
      });

      // ── 6b: Insert line items ───────────────────────────────────────────────
      await tx.orderItem.createMany({
        data: lineItems.map((li) => ({ orderId: order.id, ...li })),
      });

      // ── Step 9: Initial status history entry ────────────────────────────────
      await tx.orderStatusHistory.create({
        data: {
          orderId:    order.id,
          fromStatus: null,
          toStatus:   initialStatus as any,
          actorType:  'SYSTEM'     as any,
          actorId:    null,
          note: paymentMethod === 'COD'
            ? 'COD order confirmed automatically at placement'
            : 'Order created — awaiting payment capture confirmation',
        },
      });

      return order;
    });

    // ── Step 7: Fraud / risk engine ───────────────────────────────────────────
    const deliveryAddrStr = `${shippingAddress.house} ${shippingAddress.area}`;

    const riskResult = await runRiskChecks({
      orderId:          createdOrder.id,
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

    // ── Handle risk decision ─────────────────────────────────────────────────
    if (riskResult.decision === 'REJECT') {
      // Auto-cancel the order and write history
      await prisma.$transaction([
        prisma.order.update({
          where: { id: createdOrder.id },
          data:  { status: 'CANCELLED' as any },
        }),
        prisma.orderStatusHistory.create({
          data: {
            orderId:    createdOrder.id,
            fromStatus: initialStatus    as any,
            toStatus:   'CANCELLED'      as any,
            actorType:  'SYSTEM'         as any,
            note:       `Auto-rejected by fraud engine — risk_score=${riskResult.score} flags=[${riskResult.flags.map((f) => f.flagType).join(', ')}]`,
          },
        }),
      ]);

      return apiErr(
        'Order could not be placed. Please contact support if you believe this is an error.',
        'FRAUD_REJECTED',
        422,
      );
    }

    if (riskResult.decision === 'HOLD_FOR_REVIEW') {
      // Order exists but seller is NOT notified until admin clears the hold
      const estimatedDelivery = new Date(now.getTime() + 5 * 86400 * 1000)
        .toISOString()
        .slice(0, 10);

      return NextResponse.json(
        {
          orderId:           createdOrder.id,
          orderNumber:       createdOrder.orderNumber,
          status:            createdOrder.status,
          estimatedDelivery,
          riskStatus:        riskResult.status,   // surface for support tooling
        },
        { status: 202 }, // 202 Accepted — under manual review
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
        orderId:           createdOrder.id,
        orderNumber:       createdOrder.orderNumber,
        status:            createdOrder.status,
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
