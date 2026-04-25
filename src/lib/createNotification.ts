import { supabaseAdmin } from '@/lib/supabase-admin';

export type NotificationType = 'order' | 'qc' | 'payment' | 'alert';

export interface CreateNotificationInput {
  sellerId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Creates a notification for a seller.
 * Fails silently — notifications are non-critical and should never block the main flow.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await supabaseAdmin
      .from('spf_notifications')
      .insert({
        seller_id: input.sellerId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link || null,
        is_read: false,
        created_at: new Date().toISOString(),
      });
  } catch (err) {
    // Silent — notifications are non-critical
    console.warn('[createNotification] Failed silently:', err);
  }
}

/** Convenience wrappers */
export const notify = {
  newOrder: (sellerId: string, orderNumber: string, amount: number) =>
    createNotification({
      sellerId,
      type: 'order',
      title: 'New Order Received',
      message: `Order #${orderNumber} for ₹${amount.toLocaleString('en-IN')} is ready to pack.`,
      link: '/seller/dashboard/orders',
    }),

  qcApproved: (sellerId: string, productName: string) =>
    createNotification({
      sellerId,
      type: 'qc',
      title: 'Product Approved',
      message: `"${productName}" has been approved and is now live on the store.`,
      link: '/seller/dashboard/products',
    }),

  qcRejected: (sellerId: string, productName: string, reason?: string) =>
    createNotification({
      sellerId,
      type: 'qc',
      title: 'Product Needs Attention',
      message: `"${productName}" was rejected. ${reason ? `Reason: ${reason}` : 'Click to view feedback.'}`,
      link: '/seller/dashboard/qc',
    }),

  paymentSettled: (sellerId: string, amount: number, reference?: string) =>
    createNotification({
      sellerId,
      type: 'payment',
      title: 'Payout Processed',
      message: `₹${amount.toLocaleString('en-IN')} has been credited to your account.${reference ? ` Ref: ${reference}` : ''}`,
      link: '/seller/dashboard/earnings',
    }),

  lowStock: (sellerId: string, productName: string, remaining: number) =>
    createNotification({
      sellerId,
      type: 'alert',
      title: 'Low Stock Alert',
      message: `"${productName}" has only ${remaining} unit${remaining !== 1 ? 's' : ''} left. Restock soon.`,
      link: '/seller/dashboard/products',
    }),
};
