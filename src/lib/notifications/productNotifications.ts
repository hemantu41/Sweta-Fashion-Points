import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/email';
import { productSubmittedEmail } from '@/lib/emailTemplates/productEmails';

// ─── notifyProductSubmitted ───────────────────────────────────────────────────
// Called (non-blocking via void) after a seller successfully creates a product.
// Sends the "Under Review" email and creates an in-app notification.

export async function notifyProductSubmitted(productId: string): Promise<void> {
  try {
    // Fetch product + seller email in one query
    const { data: product, error: pErr } = await supabaseAdmin
      .from('spf_productdetails')
      .select(`
        id, product_id, name, category, sub_category,
        price, original_price, seller_id, created_at,
        spf_sellers!spf_productdetails_seller_id_fkey (
          business_name,
          spf_users!spf_sellers_user_id_fkey ( email )
        )
      `)
      .eq('id', productId)
      .single();

    if (pErr || !product) {
      console.warn('[notifyProductSubmitted] product not found:', productId);
      return;
    }

    const seller     = (product as any).spf_sellers;
    const sellerName = seller?.business_name ?? 'Seller';
    const email      = seller?.spf_users?.email as string | undefined;

    if (!email) {
      console.warn('[notifyProductSubmitted] no email for seller:', product.seller_id);
      return;
    }

    const category = [product.category, product.sub_category].filter(Boolean).join(' > ');
    const displayId = `IFP-PRD-${product.id.slice(0, 8).toUpperCase()}`;

    // Send email
    const { subject, html } = productSubmittedEmail({
      sellerName,
      shopName:        sellerName,
      productTitle:    product.name,
      productCategory: category,
      sellingPrice:    product.price,
      mrp:             product.original_price ?? undefined,
      productId:       displayId,
      submittedAt:     product.created_at ?? new Date(),
    });

    await sendEmail({ to: email, subject, html });

    // In-app notification
    await supabaseAdmin.from('spf_notifications').insert({
      seller_id:    product.seller_id,
      type:         'qc',
      title:        'Product Submitted for Review',
      message:      `"${product.name}" has been submitted and is under review. You'll be notified within 24 hours.`,
      product_id:   product.id,
      product_name: product.name,
      is_read:      false,
    });

    console.log('[notifyProductSubmitted] sent for product:', displayId);
  } catch (err: any) {
    // Non-fatal — never block the product creation API response
    console.error('[notifyProductSubmitted] error (non-fatal):', err?.message);
  }
}
