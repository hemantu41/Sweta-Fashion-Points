// Delivery Partner Notification System
// Sends SMS/Email/WhatsApp notifications for delivery status changes

interface OrderDetails {
  orderNumber: string;
  trackingNumber?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  amount: number;
}

interface DeliveryPartner {
  name: string;
  mobile: string;
}

interface NotificationConfig {
  sendSMS: boolean;
  sendEmail: boolean;
  sendWhatsApp: boolean;
}

/**
 * Send notification when order is assigned to delivery partner
 */
export async function notifyOrderAssigned(
  order: OrderDetails,
  partner: DeliveryPartner,
  estimatedDate?: string,
  config: NotificationConfig = { sendSMS: true, sendEmail: false, sendWhatsApp: false }
) {
  const message = `Order #${order.orderNumber} assigned to delivery partner ${partner.name}. ${
    estimatedDate ? `Estimated delivery: ${estimatedDate}. ` : ''
  }Track your order at: ${process.env.NEXT_PUBLIC_BASE_URL}/orders/${order.trackingNumber}/track`;

  if (config.sendSMS && order.customerPhone) {
    await sendSMS(order.customerPhone, message);
  }

  if (config.sendEmail && order.customerEmail) {
    await sendEmail(
      order.customerEmail,
      `Order #${order.orderNumber} - Assigned to Delivery Partner`,
      getAssignedEmailTemplate(order, partner, estimatedDate)
    );
  }

  if (config.sendWhatsApp && order.customerPhone) {
    await sendWhatsApp(order.customerPhone, message);
  }
}

/**
 * Send notification when partner accepts the order
 */
export async function notifyOrderAccepted(
  order: OrderDetails,
  partner: DeliveryPartner,
  config: NotificationConfig = { sendSMS: true, sendEmail: false, sendWhatsApp: false }
) {
  const message = `Your order #${order.orderNumber} has been accepted by ${partner.name}. Delivery is being prepared. Contact: ${partner.mobile}`;

  if (config.sendSMS && order.customerPhone) {
    await sendSMS(order.customerPhone, message);
  }

  if (config.sendWhatsApp && order.customerPhone) {
    await sendWhatsApp(order.customerPhone, message);
  }
}

/**
 * Send notification when order is out for delivery
 */
export async function notifyOutForDelivery(
  order: OrderDetails,
  partner: DeliveryPartner,
  config: NotificationConfig = { sendSMS: true, sendEmail: false, sendWhatsApp: true }
) {
  const message = `📦 Your order #${order.orderNumber} is out for delivery!

Delivery Partner: ${partner.name}
Contact: ${partner.mobile}

Expected delivery soon. Please keep ₹${(order.amount / 100).toLocaleString('en-IN')} ready if COD.

Thank you for shopping with Fashion Points!`;

  if (config.sendSMS && order.customerPhone) {
    await sendSMS(order.customerPhone, message);
  }

  if (config.sendWhatsApp && order.customerPhone) {
    await sendWhatsApp(order.customerPhone, message);
  }
}

/**
 * Send notification when order is delivered
 */
export async function notifyOrderDelivered(
  order: OrderDetails,
  config: NotificationConfig = { sendSMS: true, sendEmail: false, sendWhatsApp: true }
) {
  const message = `✅ Order #${order.orderNumber} delivered successfully!

Thank you for shopping with Fashion Points.

Rate your delivery experience: ${process.env.NEXT_PUBLIC_BASE_URL}/orders/${order.trackingNumber}/track

We hope to serve you again! 🛍️`;

  if (config.sendSMS && order.customerPhone) {
    await sendSMS(order.customerPhone, message);
  }

  if (config.sendWhatsApp && order.customerPhone) {
    await sendWhatsApp(order.customerPhone, message);
  }
}

/**
 * Send notification when delivery fails
 */
export async function notifyDeliveryFailed(
  order: OrderDetails,
  reason: string,
  config: NotificationConfig = { sendSMS: true, sendEmail: false, sendWhatsApp: false }
) {
  const message = `⚠️ Delivery attempt failed for order #${order.orderNumber}.

Reason: ${reason}

We will retry delivery. For assistance, call: +91 82941 53256`;

  if (config.sendSMS && order.customerPhone) {
    await sendSMS(order.customerPhone, message);
  }

  if (config.sendWhatsApp && order.customerPhone) {
    await sendWhatsApp(order.customerPhone, message);
  }
}

// ============================================
// SMS Service (MSG91)
// ============================================

async function sendSMS(phone: string, message: string) {
  try {
    const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
    const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'SWEFPT';

    if (!MSG91_AUTH_KEY) {
      console.warn('[SMS] MSG91_AUTH_KEY not configured');
      return false;
    }

    // Clean phone number (remove country code if present)
    const cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '');

    const response = await fetch('https://api.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: MSG91_AUTH_KEY,
      },
      body: JSON.stringify({
        sender: MSG91_SENDER_ID,
        short_url: '0',
        mobiles: cleanPhone,
        message: message,
      }),
    });

    const data = await response.json();
    console.log('[SMS] Message sent:', data);
    return true;
  } catch (error) {
    console.error('[SMS] Error sending message:', error);
    return false;
  }
}

// ============================================
// WhatsApp Service (Gupshup)
// ============================================

async function sendWhatsApp(phone: string, message: string) {
  try {
    const GUPSHUP_API_KEY = process.env.GUPSHUP_API_KEY;
    const GUPSHUP_APP_NAME = process.env.GUPSHUP_APP_NAME || 'FashionPoints';

    if (!GUPSHUP_API_KEY) {
      console.warn('[WhatsApp] GUPSHUP_API_KEY not configured');
      return false;
    }

    const cleanPhone = phone.replace(/^\+/, '').replace(/\D/g, '');

    const response = await fetch('https://api.gupshup.io/sm/api/v1/msg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        apikey: GUPSHUP_API_KEY,
      },
      body: new URLSearchParams({
        channel: 'whatsapp',
        source: GUPSHUP_APP_NAME,
        destination: cleanPhone,
        'src.name': GUPSHUP_APP_NAME,
        message: JSON.stringify({
          type: 'text',
          text: message,
        }),
      }),
    });

    const data = await response.json();
    console.log('[WhatsApp] Message sent:', data);
    return true;
  } catch (error) {
    console.error('[WhatsApp] Error sending message:', error);
    return false;
  }
}

// ============================================
// Email Service (Resend)
// ============================================

async function sendEmail(to: string, subject: string, html: string) {
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      console.warn('[Email] RESEND_API_KEY not configured');
      return false;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Fashion Points <orders@swetafashionpoints.com>',
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const data = await response.json();
    console.log('[Email] Message sent:', data);
    return true;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return false;
  }
}

// ============================================
// Email Templates
// ============================================

function getAssignedEmailTemplate(
  order: OrderDetails,
  partner: DeliveryPartner,
  estimatedDate?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #722F37, #8B3D47); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .order-info { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #722F37; }
    .button { display: inline-block; background: #722F37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Assigned to Delivery Partner!</h1>
    </div>
    <div class="content">
      <p>Dear ${order.customerName},</p>

      <p>Great news! Your order has been assigned to a delivery partner and will be delivered soon.</p>

      <div class="order-info">
        <h3>Order Details</h3>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
        <p><strong>Amount:</strong> ₹${(order.amount / 100).toLocaleString('en-IN')}</p>
        ${estimatedDate ? `<p><strong>Estimated Delivery:</strong> ${estimatedDate}</p>` : ''}
      </div>

      <div class="order-info">
        <h3>Delivery Partner</h3>
        <p><strong>Name:</strong> ${partner.name}</p>
        <p><strong>Contact:</strong> ${partner.mobile}</p>
      </div>

      <p>You can track your order in real-time using the button below:</p>

      <center>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/orders/${order.trackingNumber}/track" class="button">
          Track Your Order
        </a>
      </center>

      <p>Thank you for shopping with Fashion Points!</p>

      <div class="footer">
        <p>Fashion Points | +91 82941 53256</p>
        <p>This is an automated email. Please do not reply.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}
