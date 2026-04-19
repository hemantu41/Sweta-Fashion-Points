/**
 * Seller notification system for IFP.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  CURRENT MODE: Email only (via Resend)                          │
 * │  SMS (MSG91): Disabled — DLT template registration pending      │
 * │  Push (FCM):  Disabled — FCM server key not yet configured      │
 * │                                                                  │
 * │  To enable SMS after DLT approval:                              │
 * │    1. Set MSG91_AUTH_KEY + template IDs in .env / Vercel        │
 * │    2. Flip SMS_ENABLED = true below                             │
 * └─────────────────────────────────────────────────────────────────┘
 */

import prisma from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/email';

// ── Feature flags ─────────────────────────────────────────────────────────────
const SMS_ENABLED = false;  // TODO: flip to true after DLT approval
const FCM_ENABLED = false;  // TODO: flip to true after FCM key is set

// ── Brand tokens ──────────────────────────────────────────────────────────────
const C = {
  maroon:   '#5B1A3A',
  gold:     '#C49A3C',
  bg:       '#FAF7F8',
  white:    '#FFFFFF',
  text:     '#333333',
  muted:    '#888888',
  border:   '#E8E0E4',
  altBg:    '#F5EDF2',
  warn:     '#E65100',
  warnBg:   '#FFF3E0',
  danger:   '#C62828',
  dangerBg: '#FFF0F0',
  success:  '#2E7D32',
  successBg:'#F1F8E9',
};
const DASHBOARD_URL = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://instafashionpoints.com'}/seller/dashboard/orders`;

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

interface SellerInfo {
  email:        string;
  businessName: string;
  phone:        string;
}

interface OrderSummary {
  id:          string;
  orderNumber: string;
  total:       number;
  itemCount:   number;
  itemsHtml:   string;
  customerName:string;
  sellerId:    string;
  awbNumber:   string | null;
  acceptanceDeadline: Date | null;
  packingDeadline:    Date | null;
}

async function fetchSellerInfo(sellerId: string): Promise<SellerInfo | null> {
  const { data } = await supabaseAdmin
    .from('spf_sellers')
    .select('business_name, business_email, phone')
    .eq('id', sellerId)
    .maybeSingle();
  if (!data) return null;
  return {
    email:        (data as any).business_email ?? '',
    businessName: (data as any).business_name  ?? 'Seller',
    phone:        (data as any).phone          ?? '',
  };
}

async function fetchOrderSummary(orderId: string): Promise<OrderSummary | null> {
  const order = await prisma.order.findUnique({
    where:   { id: orderId },
    include: { items: true },
  });
  if (!order) return null;

  const addr = order.shippingAddress as { name?: string } | null;
  const total = Number(order.subtotal) + Number(order.shippingCharge);

  const itemsHtml = order.items.map((item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid ${C.border};">${item.productName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid ${C.border};text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid ${C.border};text-align:right;">
        ₹${Number(item.totalPrice).toLocaleString('en-IN')}
      </td>
    </tr>`).join('');

  return {
    id:          order.id,
    orderNumber: order.orderNumber,
    total,
    itemCount:   order.items.length,
    itemsHtml,
    customerName: addr?.name ?? 'Customer',
    sellerId:    order.sellerId,
    awbNumber:   order.awbNumber,
    acceptanceDeadline: order.acceptanceSlaDeadline,
    packingDeadline:    order.packingSlaDeadline,
  };
}

function formatDeadline(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

// ── Email layout ──────────────────────────────────────────────────────────────

function emailShell(headerBg: string, title: string, subtitle: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:${C.bg};font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:${C.white};">
  <div style="background:${headerBg};padding:28px 32px;text-align:center;">
    <div style="font-size:11px;color:${C.gold};font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">
      Insta Fashion Points
    </div>
    <div style="font-family:Georgia,serif;font-size:20px;color:#fff;font-weight:700;">${title}</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.65);margin-top:4px;">${subtitle}</div>
  </div>
  <div style="padding:32px 32px 24px;">${body}</div>
  <div style="background:${C.bg};padding:20px 32px;text-align:center;border-top:1px solid ${C.border};">
    <div style="font-size:12px;color:${C.maroon};font-weight:700;margin-bottom:4px;">Insta Fashion Points</div>
    <div style="font-size:11px;color:${C.gold};font-style:italic;margin-bottom:8px;">Apne Dukandaar se, Online</div>
    <div style="font-size:10px;color:${C.muted};">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/help" style="color:${C.maroon};">Help Center</a> ·
      <a href="mailto:support@instafashionpoints.com" style="color:${C.maroon};">Contact Support</a>
    </div>
  </div>
</div>
</body>
</html>`;
}

function ctaButton(label: string, url: string, bg = C.maroon): string {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${url}" style="display:inline-block;background:${bg};color:#fff;padding:14px 32px;
       border-radius:6px;text-decoration:none;font-weight:700;font-size:15px;">${label}</a>
  </div>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;color:${C.muted};font-size:13px;width:40%;">${label}</td>
    <td style="padding:8px 0;color:${C.text};font-size:13px;font-weight:600;">${value}</td>
  </tr>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SMS stub (MSG91)
// Enable after DLT approval — replace template IDs with real ones
// ─────────────────────────────────────────────────────────────────────────────

async function _sendSms(_phone: string, _templateId: string, _vars: Record<string, string>): Promise<void> {
  if (!SMS_ENABLED) return; // DLT approval pending
  /* TODO: after DLT approval, uncomment and configure:
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) { console.warn('[SMS] MSG91_AUTH_KEY not set'); return; }
  await fetch('https://api.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authkey: authKey },
    body: JSON.stringify({ flow_id: _templateId, sender: process.env.MSG91_SENDER_ID ?? 'SWEFPT',
      mobiles: `91${_phone}`, ..._vars }),
  });
  */
}

// ─────────────────────────────────────────────────────────────────────────────
// FCM push stub — enable after FCM server key is configured
// ─────────────────────────────────────────────────────────────────────────────

async function _sendPush(_sellerId: string, _title: string, _body: string): Promise<void> {
  if (!FCM_ENABLED) return;
  /* TODO: implement FCM push notification */
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Notify seller of a new order (email only until DLT approved).
 * Called immediately after order is confirmed and fraud-cleared.
 */
export async function notifySellerNewOrder(orderId: string): Promise<void> {
  try {
    const [order, ] = await Promise.all([fetchOrderSummary(orderId)]);
    if (!order) return;

    const seller = await fetchSellerInfo(order.sellerId);
    if (!seller?.email) { console.warn(`[sellerNotify] No email for seller ${order.sellerId}`); return; }

    const deadline = formatDeadline(order.acceptanceDeadline);

    const body = `
      <p style="color:${C.text};font-size:15px;margin:0 0 20px;">
        Hello <strong>${seller.businessName}</strong>,<br/>
        A new order has been placed. Please accept it within 2 hours to avoid auto-cancellation.
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
        ${infoRow('Order Number', order.orderNumber)}
        ${infoRow('Order Value', `₹${order.total.toLocaleString('en-IN')}`)}
        ${infoRow('Accept By', deadline)}
        ${infoRow('Customer', order.customerName)}
      </table>
      <div style="background:${C.altBg};border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="font-size:13px;font-weight:700;color:${C.maroon};margin-bottom:10px;">
          Order Items (${order.itemCount})
        </div>
        <table cellpadding="0" cellspacing="0" style="width:100%;">
          <thead>
            <tr style="background:${C.maroon};">
              <th style="padding:8px 12px;color:#fff;text-align:left;font-size:12px;">Product</th>
              <th style="padding:8px 12px;color:#fff;text-align:center;font-size:12px;">Qty</th>
              <th style="padding:8px 12px;color:#fff;text-align:right;font-size:12px;">Amount</th>
            </tr>
          </thead>
          <tbody>${order.itemsHtml}</tbody>
          <tfoot>
            <tr style="background:${C.bg};">
              <td colspan="2" style="padding:10px 12px;font-weight:700;font-size:13px;">Total</td>
              <td style="padding:10px 12px;font-weight:700;font-size:14px;text-align:right;color:${C.maroon};">
                ₹${order.total.toLocaleString('en-IN')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div style="background:${C.warnBg};border-left:4px solid ${C.warn};padding:12px 16px;border-radius:4px;margin-bottom:24px;">
        <span style="font-size:13px;color:${C.warn};font-weight:600;">
          ⏱ Accept deadline: ${deadline} — Missed deadline will auto-cancel the order.
        </span>
      </div>
      ${ctaButton('Accept Order on Dashboard →', DASHBOARD_URL)}`;

    await Promise.all([
      sendEmail({
        to:      seller.email,
        subject: `New Order #${order.orderNumber} — Accept by ${deadline}`,
        html:    emailShell(C.maroon, '🛍 New Order Received', 'Apne Dukandaar se, Online', body),
      }),
      // SMS: disabled until DLT approved
      _sendSms(seller.phone, process.env.MSG91_ACCEPTANCE_TEMPLATE_ID ?? '', {
        order_number: order.orderNumber,
        deadline,
        link: DASHBOARD_URL,
      }),
      // Push: disabled until FCM configured
      _sendPush(order.sellerId, 'New Order!', `#${order.orderNumber} — Accept by ${deadline}`),
    ]);
  } catch (err: any) {
    console.error('[sellerNotify] notifySellerNewOrder error:', err?.message);
  }
}

/**
 * 30-minute SLA warning — email + SMS (when enabled).
 */
export async function notifySellerSlaWarning(
  orderId:  string,
  slaType: 'ACCEPTANCE' | 'PACKING',
): Promise<void> {
  try {
    const order = await fetchOrderSummary(orderId);
    if (!order) return;
    const seller = await fetchSellerInfo(order.sellerId);
    if (!seller?.email) return;

    const label    = slaType === 'ACCEPTANCE' ? 'accept' : 'pack';
    const deadline = slaType === 'ACCEPTANCE'
      ? formatDeadline(order.acceptanceDeadline)
      : formatDeadline(order.packingDeadline);

    const body = `
      <div style="background:${C.warnBg};border:2px solid ${C.warn};border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
        <div style="font-size:28px;margin-bottom:8px;">⏰</div>
        <div style="font-size:16px;font-weight:700;color:${C.warn};">Only 30 Minutes Left!</div>
        <div style="font-size:13px;color:${C.text};margin-top:6px;">
          Order <strong>#${order.orderNumber}</strong> will be auto-cancelled if not ${label}ed by <strong>${deadline}</strong>.
        </div>
      </div>
      ${ctaButton(`${slaType === 'ACCEPTANCE' ? 'Accept' : 'Mark as Packed'} Now →`, DASHBOARD_URL, C.warn)}
      <p style="font-size:12px;color:${C.muted};text-align:center;">
        Missing this deadline will result in auto-cancellation and affect your seller rating.
      </p>`;

    await Promise.all([
      sendEmail({
        to:      seller.email,
        subject: `⚠️ 30 Min Left — Order #${order.orderNumber} needs your action`,
        html:    emailShell(C.warn, '⏰ Action Required', 'Order deadline approaching', body),
      }),
      _sendSms(seller.phone, process.env.MSG91_SLA_WARNING_TEMPLATE_ID ?? '', {
        order_number: order.orderNumber,
        action:       label,
        deadline,
        link:         DASHBOARD_URL,
      }),
      _sendPush(order.sellerId, '⏰ 30 Min Left', `Order #${order.orderNumber} — ${label} now`),
    ]);
  } catch (err: any) {
    console.error('[sellerNotify] notifySellerSlaWarning error:', err?.message);
  }
}

/**
 * SLA breached — order auto-cancelled. Email + SMS (when enabled).
 */
export async function notifySellerSlaBreached(
  orderId:  string,
  slaType: 'ACCEPTANCE' | 'PACKING',
): Promise<void> {
  try {
    const order = await fetchOrderSummary(orderId);
    if (!order) return;
    const seller = await fetchSellerInfo(order.sellerId);
    if (!seller?.email) return;

    const reason = slaType === 'ACCEPTANCE'
      ? 'You did not accept the order within the 2-hour window.'
      : 'The order was not packed within the 4-hour window after acceptance.';

    const body = `
      <div style="background:${C.dangerBg};border:2px solid ${C.danger};border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
        <div style="font-size:28px;margin-bottom:8px;">❌</div>
        <div style="font-size:16px;font-weight:700;color:${C.danger};">Order Auto-Cancelled</div>
        <div style="font-size:13px;color:${C.text};margin-top:6px;">
          Order <strong>#${order.orderNumber}</strong> has been automatically cancelled.
        </div>
      </div>
      <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
        ${infoRow('Order Number', order.orderNumber)}
        ${infoRow('Order Value', `₹${order.total.toLocaleString('en-IN')}`)}
        ${infoRow('Reason', reason)}
      </table>
      <div style="background:${C.altBg};border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="font-size:13px;color:${C.maroon};font-weight:700;margin-bottom:6px;">Impact on Your Account</div>
        <ul style="margin:0;padding-left:20px;font-size:13px;color:${C.text};line-height:1.8;">
          <li>This cancellation is recorded against your seller profile.</li>
          <li>Repeated missed SLAs may result in account suspension.</li>
          <li>Customer has been notified and refunded automatically.</li>
        </ul>
      </div>
      ${ctaButton('View Dashboard', DASHBOARD_URL)}
      <p style="font-size:12px;color:${C.muted};text-align:center;">
        If this was an error, contact <a href="mailto:support@instafashionpoints.com" style="color:${C.maroon};">support@instafashionpoints.com</a>
      </p>`;

    await Promise.all([
      sendEmail({
        to:      seller.email,
        subject: `Order #${order.orderNumber} Auto-Cancelled — SLA Breach`,
        html:    emailShell(C.danger, 'Order Cancelled', 'Missed response deadline', body),
      }),
      _sendSms(seller.phone, process.env.MSG91_SLA_WARNING_TEMPLATE_ID ?? '', {
        order_number: order.orderNumber,
        link: DASHBOARD_URL,
      }),
      _sendPush(order.sellerId, 'Order Cancelled', `#${order.orderNumber} auto-cancelled — SLA missed`),
    ]);
  } catch (err: any) {
    console.error('[sellerNotify] notifySellerSlaBreached error:', err?.message);
  }
}

/**
 * Pickup scheduled — push + email (when enabled).
 */
export async function notifySellerPickupScheduled(orderId: string): Promise<void> {
  try {
    const order = await fetchOrderSummary(orderId);
    if (!order) return;
    const seller = await fetchSellerInfo(order.sellerId);
    if (!seller?.email) return;

    const body = `
      <div style="background:${C.successBg};border:2px solid ${C.success};border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
        <div style="font-size:28px;margin-bottom:8px;">📦</div>
        <div style="font-size:16px;font-weight:700;color:${C.success};">Pickup Scheduled</div>
        <div style="font-size:13px;color:${C.text};margin-top:6px;">
          A courier will arrive to pick up order <strong>#${order.orderNumber}</strong> tomorrow.
        </div>
      </div>
      <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
        ${infoRow('Order Number', order.orderNumber)}
        ${infoRow('AWB Number', order.awbNumber ?? 'Assigned')}
        ${infoRow('Pickup', 'Tomorrow between 10 AM – 6 PM')}
      </table>
      <div style="background:${C.altBg};border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="font-size:13px;color:${C.maroon};font-weight:700;margin-bottom:6px;">📋 Checklist</div>
        <ul style="margin:0;padding-left:20px;font-size:13px;color:${C.text};line-height:1.8;">
          <li>Package is securely sealed and labelled</li>
          <li>Shipping label is printed and affixed</li>
          <li>Invoice is placed inside the package</li>
          <li>Be available at the pickup address</li>
        </ul>
      </div>
      ${ctaButton('View Order Details', DASHBOARD_URL)}`;

    await Promise.all([
      sendEmail({
        to:      seller.email,
        subject: `Pickup Scheduled — Order #${order.orderNumber}`,
        html:    emailShell(C.success, '📦 Pickup Scheduled', 'Keep the package ready', body),
      }),
      _sendSms(seller.phone, '', { order_number: order.orderNumber }),
      _sendPush(order.sellerId, '📦 Pickup Tomorrow', `Order #${order.orderNumber} — keep package ready`),
    ]);
  } catch (err: any) {
    console.error('[sellerNotify] notifySellerPickupScheduled error:', err?.message);
  }
}

/**
 * Notify the customer when their order is auto-cancelled due to SLA breach.
 * Called from slaMonitor.handleSlaBreached().
 */
export async function notifyCustomerOrderCancelled(
  orderId:       string,
  customerEmail: string,
  orderNumber:   string,
  orderTotal:    number,
  isPrepaid:     boolean,
): Promise<void> {
  try {
    const refundNote = isPrepaid
      ? `<p style="color:${C.text};font-size:14px;">A <strong>full refund of ₹${orderTotal.toLocaleString('en-IN')}</strong> has been initiated and will be credited to your original payment method within 5–7 business days.</p>`
      : `<p style="color:${C.text};font-size:14px;">Since this was a COD order, no amount was charged. Your order has been cancelled with no cost to you.</p>`;

    const body = `
      <p style="color:${C.text};font-size:15px;">We're sorry for the inconvenience.</p>
      <p style="color:${C.text};font-size:14px;">
        Your order <strong>#${orderNumber}</strong> has been cancelled because the seller did not respond within the required time.
      </p>
      ${refundNote}
      <div style="background:${C.altBg};border-radius:8px;padding:16px;margin:20px 0;">
        <div style="font-size:13px;font-weight:700;color:${C.maroon};margin-bottom:6px;">What happens next?</div>
        <ul style="margin:0;padding-left:20px;font-size:13px;color:${C.text};line-height:1.8;">
          ${isPrepaid ? '<li>Refund initiated to your original payment method</li><li>You will receive a refund confirmation email from your bank</li>' : ''}
          <li>You can place a new order anytime at instafashionpoints.com</li>
          <li>Our team has been notified about the seller delay</li>
        </ul>
      </div>
      ${ctaButton('Shop Again', process.env.NEXT_PUBLIC_BASE_URL ?? 'https://instafashionpoints.com', C.maroon)}
      <p style="font-size:12px;color:${C.muted};text-align:center;">
        Questions? Contact <a href="mailto:support@instafashionpoints.com" style="color:${C.maroon};">support@instafashionpoints.com</a>
      </p>`;

    await sendEmail({
      to:      customerEmail,
      subject: `Order #${orderNumber} Cancelled — ${isPrepaid ? 'Refund Initiated' : 'No Charges'}`,
      html:    emailShell(C.danger, 'Order Cancelled', 'We apologise for the inconvenience', body),
    });
  } catch (err: any) {
    console.error('[sellerNotify] notifyCustomerOrderCancelled error:', err?.message);
  }
}

// Support ticket notifications have been moved to:
// src/lib/notifications/ticketNotify.ts
// (separate file — no Prisma dependency)
