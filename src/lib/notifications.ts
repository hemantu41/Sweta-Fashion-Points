/**
 * Notification Service for SMS and WhatsApp
 * Handles payment confirmations via MSG91 (SMS) and Gupshup (WhatsApp)
 */

interface SMSParams {
  phone: string;
  message: string;
}

interface WhatsAppParams {
  phone: string;
  templateId: string;
  params: string[];
}

interface PaymentNotificationParams {
  phone: string;
  email: string;
  name: string;
  orderNumber: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  items: Array<{ name: string; quantity: number; price: number }>;
}

/**
 * Send OTP SMS via MSG91 OTP API
 *
 * Required env vars:
 *   MSG91_AUTH_KEY   — API key from MSG91 dashboard (Settings → API Keys)
 *   MSG91_SENDER_ID  — 6-char DLT-registered sender ID (default: SWEFPT)
 *   MSG91_TEMPLATE_ID — OTP template ID from MSG91 dashboard (after DLT approval)
 *
 * DLT registration is mandatory in India:
 *   1. Register on https://www.trai.gov.in/ or a DLT portal (Airtel, Vodafone, BSNL etc.)
 *   2. Register your sender ID (e.g. SWEFPT) and OTP message template
 *   3. After approval, add the template to MSG91 and get the Template ID
 */
export async function sendSMS(params: SMSParams): Promise<{ success: boolean; error?: string }> {
  const authKey    = process.env.MSG91_AUTH_KEY;
  const senderId   = process.env.MSG91_SENDER_ID   || 'SWEFPT';
  const templateId = process.env.MSG91_TEMPLATE_ID;

  // ── Guard: missing config ──────────────────────────────────────────────────
  if (!authKey) {
    console.error('[SMS] MISSING: MSG91_AUTH_KEY is not set in environment variables');
    console.error('[SMS] Add MSG91_AUTH_KEY to your .env.local (local) or Vercel Environment Variables (production)');
    return { success: false, error: 'MSG91_AUTH_KEY not configured' };
  }

  if (!templateId) {
    console.error('[SMS] MISSING: MSG91_TEMPLATE_ID is not set in environment variables');
    console.error('[SMS] Get your OTP template ID from MSG91 dashboard → SMS → OTP → Templates');
    return { success: false, error: 'MSG91_TEMPLATE_ID not configured' };
  }

  // ── Format phone: must include 91 country code ────────────────────────────
  const formattedPhone = params.phone.startsWith('91')
    ? params.phone
    : `91${params.phone}`;

  console.log(`[SMS] Sending OTP SMS to: ${formattedPhone}`);
  console.log(`[SMS] Message: ${params.message}`);

  try {
    // MSG91 OTP API — correct endpoint for OTP delivery
    const response = await fetch('https://api.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        'authkey': authKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        template_id: templateId,
        mobile:      formattedPhone,
        sender:      senderId,
        otp:         params.message.match(/\b\d{6}\b/)?.[0] ?? '', // extract 6-digit OTP from message
      }),
    });

    const responseText = await response.text();
    console.log(`[SMS] MSG91 raw response (status ${response.status}):`, responseText);

    let data: Record<string, unknown>;
    try { data = JSON.parse(responseText); } catch { data = { raw: responseText }; }

    if (response.ok && (data.type === 'success' || String(data.message).toLowerCase().includes('success'))) {
      console.log('[SMS] ✅ Sent successfully to:', formattedPhone);
      return { success: true };
    } else {
      console.error('[SMS] ❌ Failed. MSG91 response:', data);
      console.error('[SMS] Check: 1) auth key valid  2) template approved on DLT  3) sender ID matches DLT  4) account has balance');
      return { success: false, error: String(data.message ?? data.raw ?? 'SMS send failed') };
    }
  } catch (error) {
    console.error('[SMS] ❌ Network/fetch error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send WhatsApp message via Gupshup
 */
export async function sendWhatsApp(params: WhatsAppParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.GUPSHUP_API_KEY;
  const appName = process.env.GUPSHUP_APP_NAME || 'FashionPoints';
  const sourceNumber = process.env.GUPSHUP_SOURCE_NUMBER;

  if (!apiKey || !sourceNumber) {
    console.error('[WhatsApp] Gupshup credentials not configured');
    return { success: false, error: 'Gupshup not configured' };
  }

  // Format phone number: add 91 country code if not present
  const formattedPhone = params.phone.startsWith('91')
    ? params.phone
    : `91${params.phone}`;

  try {
    const templateData = {
      id: params.templateId,
      params: params.params,
    };

    const formBody = new URLSearchParams({
      channel: 'whatsapp',
      source: sourceNumber,
      destination: formattedPhone,
      'src.name': appName,
      'template': JSON.stringify(templateData),
    });

    const response = await fetch('https://api.gupshup.io/sm/api/v1/template/msg', {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    });

    const data = await response.json();

    if (response.ok && data.status === 'submitted') {
      console.log('[WhatsApp] Sent successfully to:', formattedPhone);
      return { success: true };
    } else {
      console.error('[WhatsApp] Failed:', data);
      return { success: false, error: data.message || 'WhatsApp send failed' };
    }
  } catch (error) {
    console.error('[WhatsApp] Error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send payment notification via SMS and WhatsApp
 */
export async function sendPaymentNotification(params: PaymentNotificationParams): Promise<{
  sms: boolean;
  whatsapp: boolean;
}> {
  const { name, orderNumber, amount, status, phone } = params;

  // Format amount in Indian currency
  const formattedAmount = amount.toLocaleString('en-IN');

  // Generate message based on status
  let message = '';
  let whatsappTemplateId = process.env.GUPSHUP_TEMPLATE_SUCCESS || '';

  if (status === 'success') {
    message = `Hi ${name}, your payment of ₹${formattedAmount} for order ${orderNumber} was successful! Your order is being processed. Track at: fashionpoints.co.in/orders - Fashion Points`;
    whatsappTemplateId = process.env.GUPSHUP_TEMPLATE_SUCCESS || 'payment_success';
  } else if (status === 'failed') {
    message = `Hi ${name}, payment of ₹${formattedAmount} for order ${orderNumber} failed. Please try again or contact support. - Fashion Points`;
    whatsappTemplateId = process.env.GUPSHUP_TEMPLATE_FAILED || 'payment_failed';
  } else if (status === 'pending') {
    message = `Hi ${name}, your payment of ₹${formattedAmount} for order ${orderNumber} is pending verification. You'll be notified once confirmed. - Fashion Points`;
    whatsappTemplateId = process.env.GUPSHUP_TEMPLATE_PENDING || 'payment_pending';
  }

  // Send SMS
  const smsResult = await sendSMS({
    phone,
    message,
  });

  // Send WhatsApp
  const whatsappResult = await sendWhatsApp({
    phone,
    templateId: whatsappTemplateId,
    params: [name, formattedAmount, orderNumber],
  });

  return {
    sms: smsResult.success,
    whatsapp: whatsappResult.success,
  };
}
