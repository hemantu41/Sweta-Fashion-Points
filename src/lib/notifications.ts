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
 * Send SMS via MSG91
 */
export async function sendSMS(params: SMSParams): Promise<{ success: boolean; error?: string }> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID || 'SWEFPT';

  if (!authKey) {
    console.error('[SMS] MSG91_AUTH_KEY not configured');
    return { success: false, error: 'MSG91 not configured' };
  }

  // Format phone number: add 91 country code if not present
  const formattedPhone = params.phone.startsWith('91')
    ? params.phone
    : `91${params.phone}`;

  try {
    const response = await fetch('https://api.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'authkey': authKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: senderId,
        mobiles: formattedPhone,
        message: params.message,
      }),
    });

    const data = await response.json();

    if (response.ok && data.type === 'success') {
      console.log('[SMS] Sent successfully to:', formattedPhone);
      return { success: true };
    } else {
      console.error('[SMS] Failed:', data);
      return { success: false, error: data.message || 'SMS send failed' };
    }
  } catch (error) {
    console.error('[SMS] Error:', error);
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
