// ─── Brand constants ──────────────────────────────────────────────────────────

const BRAND = {
  name: 'Insta Fashion Points',
  tagline: 'Apne Dukandaar se, Online',
  url: 'https://instafashionpoints.com',
  dashboardUrl: 'https://instafashionpoints.com/seller/dashboard',
  supportEmail: 'support@instafashionpoints.com',
  whatsappLink: 'https://wa.me/91XXXXXXXXXX', // TODO: replace with real WhatsApp number
  colors: {
    maroon: '#5B1A3A', maroonLight: '#7A2350', gold: '#C49A3C',
    bg: '#FAF7F8', white: '#FFFFFF', text: '#333333', muted: '#888888',
    border: '#E8E0E4', altBg: '#F5EDF2',
    success: '#2E7D32', successBg: '#F1F8E9',
    error: '#C62828', errorBg: '#FFF0F0',
    orange: '#E65100', orangeBg: '#FFF3E0',
  },
};

// ─── Layout wrapper ───────────────────────────────────────────────────────────

function emailLayout(
  headerBg: string,
  headerAccent: string,
  headerTitle: string,
  headerHindi: string,
  bodyContent: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.colors.bg};font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:${BRAND.colors.white};">

    <!-- Header -->
    <div style="background:${headerBg};padding:28px 32px;text-align:center;">
      <div style="font-size:11px;color:${headerAccent};font-weight:700;letter-spacing:2px;margin-bottom:6px;text-transform:uppercase;">
        Insta Fashion Points
      </div>
      <div style="font-family:Georgia,serif;font-size:20px;color:#FFFFFF;font-weight:700;">${headerTitle}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.65);margin-top:4px;">${headerHindi}</div>
    </div>

    <!-- Body -->
    <div style="padding:32px 32px 24px;">${bodyContent}</div>

    <!-- Footer -->
    <div style="background:${BRAND.colors.bg};padding:20px 32px;text-align:center;border-top:1px solid ${BRAND.colors.border};">
      <div style="font-size:12px;color:${BRAND.colors.maroon};font-weight:700;margin-bottom:4px;">${BRAND.name}</div>
      <div style="font-size:11px;color:${BRAND.colors.gold};font-style:italic;margin-bottom:8px;">${BRAND.tagline}</div>
      <div style="font-size:10px;color:${BRAND.colors.muted};line-height:1.6;">
        You are receiving this as a registered seller on ${BRAND.name}.<br/>
        <a href="${BRAND.url}/unsubscribe" style="color:${BRAND.colors.maroon};">Unsubscribe</a> ·
        <a href="${BRAND.whatsappLink}" style="color:${BRAND.colors.maroon};">WhatsApp Support</a> ·
        <a href="${BRAND.url}/help" style="color:${BRAND.colors.maroon};">Help Center</a>
      </div>
    </div>

  </div>
</body>
</html>`;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function infoRow(label: string, value: string): string {
  return `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid ${BRAND.colors.bg};">
    <span style="font-size:13px;color:${BRAND.colors.muted};">${label}</span>
    <span style="font-size:13px;color:${BRAND.colors.text};font-weight:600;text-align:right;max-width:55%;">${value}</span>
  </div>`;
}

function statusBadge(text: string, color: string, bg: string): string {
  return `<span style="font-size:12px;font-weight:700;color:${color};background:${bg};padding:3px 12px;border-radius:12px;">${text}</span>`;
}

function ctaButton(text: string, url: string, bg = BRAND.colors.maroon, bgEnd = BRAND.colors.maroonLight): string {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${url}" style="display:inline-block;padding:14px 32px;border-radius:10px;background:linear-gradient(135deg,${bg},${bgEnd});color:#FFFFFF;font-weight:700;font-size:14px;text-decoration:none;">${text}</a>
  </div>`;
}

function formatPrice(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

// ─── Template 1: Product Submitted for Review ─────────────────────────────────

export interface ProductSubmittedData {
  sellerName: string;
  shopName: string;
  productTitle: string;
  productCategory: string;
  sellingPrice: number;
  mrp?: number;
  productId: string;
  submittedAt: Date | string;
}

export function productSubmittedEmail(data: ProductSubmittedData): { subject: string; html: string } {
  const subject = `Your product has been submitted for review — ${BRAND.name}`;

  const bodyContent = `
    <p style="font-size:15px;color:${BRAND.colors.text};margin:0 0 16px;">
      Hello <strong>${data.sellerName}</strong>,
    </p>
    <p style="font-size:14px;color:${BRAND.colors.text};margin:0 0 20px;line-height:1.7;">
      Your product has been successfully submitted and is now in our review queue. Our quality team will review it within
      <strong style="color:${BRAND.colors.maroon};">24 hours</strong>.
    </p>

    <div style="background:${BRAND.colors.bg};border-radius:10px;padding:20px;border:1px solid ${BRAND.colors.border};margin-bottom:20px;">
      <div style="font-size:11px;color:${BRAND.colors.gold};font-weight:700;letter-spacing:1.5px;margin-bottom:12px;">PRODUCT DETAILS</div>
      ${infoRow('Product Title', data.productTitle)}
      ${infoRow('Category', data.productCategory)}
      ${infoRow('Selling Price', formatPrice(data.sellingPrice))}
      ${data.mrp ? infoRow('MRP', formatPrice(data.mrp)) : ''}
      ${infoRow('Product ID', data.productId)}
      ${infoRow('Submitted On', formatDate(data.submittedAt))}
      <div style="display:flex;justify-content:space-between;padding:10px 0;">
        <span style="font-size:13px;color:${BRAND.colors.muted};">Status</span>
        ${statusBadge('Under Review', BRAND.colors.orange, BRAND.colors.orangeBg)}
      </div>
    </div>

    <div style="background:${BRAND.colors.altBg};border-radius:10px;padding:18px;border:1px solid rgba(196,154,60,0.15);margin-bottom:20px;">
      <div style="font-size:13px;font-weight:700;color:${BRAND.colors.maroon};margin-bottom:8px;">What happens next?</div>
      <div style="font-size:13px;color:${BRAND.colors.text};line-height:1.7;">
        ✓ Our team reviews your product photos, description, and pricing<br/>
        ✓ If everything looks good, your product goes live within 24 hours<br/>
        ✓ If changes are needed, we'll send you specific feedback<br/>
        ✓ You'll receive a notification once the review is complete
      </div>
    </div>

    <div style="background:${BRAND.colors.bg};border-radius:10px;padding:16px;border:1px solid ${BRAND.colors.border};margin-bottom:20px;">
      <div style="font-size:12px;color:${BRAND.colors.maroon};line-height:1.6;">
        <strong>आगे क्या होगा?</strong> हमारी टीम 24 घंटे के भीतर आपके प्रोडक्ट की समीक्षा करेगी। अगर सब सही है तो प्रोडक्ट लाइव हो जाएगा।
      </div>
    </div>

    ${ctaButton('View Product Status', BRAND.dashboardUrl + '/products')}

    <div style="border-top:1px solid ${BRAND.colors.border};padding-top:16px;">
      <div style="font-size:12px;color:${BRAND.colors.gold};font-weight:700;margin-bottom:8px;">💡 Tip: Products with videos get 3x more orders!</div>
      <div style="font-size:12px;color:${BRAND.colors.muted};line-height:1.6;">
        If you haven't added a product video yet, you can edit your listing and add a 15–30 second video to boost visibility.
      </div>
    </div>`;

  return {
    subject,
    html: emailLayout(
      `linear-gradient(135deg,${BRAND.colors.maroon},${BRAND.colors.maroonLight})`,
      BRAND.colors.gold,
      'Product Submitted for Review',
      'प्रोडक्ट समीक्षा के लिए जमा किया गया',
      bodyContent,
    ),
  };
}

// ─── Template 2: Product Approved & Live ─────────────────────────────────────

export interface ProductApprovedData {
  sellerName: string;
  shopName: string;
  productTitle: string;
  productCategory: string;
  sellingPrice: number;
  productId: string;
  productSlug: string;
  adminNote?: string;
}

export function productApprovedEmail(data: ProductApprovedData): { subject: string; html: string } {
  const subject = `Great news! Your product is now live — ${BRAND.name}`;
  const productUrl = `${BRAND.url}/product/${data.productSlug}`;

  const bodyContent = `
    <p style="font-size:15px;color:${BRAND.colors.text};margin:0 0 16px;">
      Hello <strong>${data.sellerName}</strong>,
    </p>
    <p style="font-size:14px;color:${BRAND.colors.text};margin:0 0 20px;line-height:1.7;">
      Great news! Your product has passed our quality review and is now
      <strong style="color:${BRAND.colors.success};">live on ${BRAND.name}</strong>.
      Customers across India can now discover and purchase it.
    </p>

    <div style="background:${BRAND.colors.successBg};border-radius:10px;padding:20px;border:1px solid #A5D6A7;margin-bottom:20px;">
      <div style="font-size:11px;color:${BRAND.colors.success};font-weight:700;letter-spacing:1.5px;margin-bottom:12px;">APPROVED PRODUCT</div>
      ${infoRow('Product Title', data.productTitle)}
      ${infoRow('Category', data.productCategory)}
      ${infoRow('Selling Price', formatPrice(data.sellingPrice))}
      ${infoRow('Product ID', data.productId)}
      <div style="display:flex;justify-content:space-between;padding:10px 0;">
        <span style="font-size:13px;color:${BRAND.colors.muted};">Status</span>
        ${statusBadge('✅ Live', BRAND.colors.success, BRAND.colors.successBg)}
      </div>
    </div>

    ${data.adminNote ? `
    <div style="background:${BRAND.colors.bg};border-radius:10px;padding:16px;border-left:4px solid ${BRAND.colors.gold};margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;color:${BRAND.colors.maroon};margin-bottom:4px;">Note from Review Team:</div>
      <div style="font-size:12px;color:${BRAND.colors.text};line-height:1.6;">${data.adminNote}</div>
    </div>` : ''}

    <div style="background:${BRAND.colors.altBg};border-radius:10px;padding:18px;border:1px solid rgba(196,154,60,0.15);margin-bottom:20px;">
      <div style="font-size:13px;font-weight:700;color:${BRAND.colors.maroon};margin-bottom:8px;">🚀 Boost your sales</div>
      <div style="font-size:13px;color:${BRAND.colors.text};line-height:1.7;">
        • Share your product link on WhatsApp groups<br/>
        • Add more products to increase your store visibility<br/>
        • Keep stock updated to avoid order cancellations
      </div>
    </div>

    <div style="text-align:center;margin:24px 0;">
      <a href="${productUrl}" style="display:inline-block;padding:14px 28px;border-radius:10px;background:linear-gradient(135deg,${BRAND.colors.maroon},${BRAND.colors.maroonLight});color:#fff;font-weight:700;font-size:14px;text-decoration:none;margin-right:8px;">
        View Live Product
      </a>
      <a href="${BRAND.dashboardUrl}/products/add" style="display:inline-block;padding:14px 28px;border-radius:10px;background:linear-gradient(135deg,${BRAND.colors.gold},#AD8530);color:#fff;font-weight:700;font-size:14px;text-decoration:none;">
        + Add Another Product
      </a>
    </div>`;

  return {
    subject,
    html: emailLayout(
      `linear-gradient(135deg,${BRAND.colors.success},#43A047)`,
      '#A5D6A7',
      'Your Product is Now Live! 🎉',
      'आपका प्रोडक्ट अब लाइव है!',
      bodyContent,
    ),
  };
}

// ─── Template 3: Product Rejected / Needs Changes ────────────────────────────

export interface ProductRejectedData {
  sellerName: string;
  shopName: string;
  productTitle: string;
  productId: string;
  rejectionTags: string[];
  adminNote?: string;
}

const REJECTION_DETAILS: Record<string, { label: string; detail: string }> = {
  bad_image:     { label: 'Poor Image Quality',         detail: 'Photos are blurry, dark, or low resolution. Please re-upload clear photos in natural daylight. Min 800×800px.' },
  bg_image:      { label: 'Bad Background',             detail: 'Background is cluttered or unprofessional. Use a white or neutral plain background.' },
  missing_sides: { label: 'Missing Angles/Views',       detail: 'We need at least 3 photos: front view, back view, and close-up of fabric/design detail.' },
  wrong_cat:     { label: 'Wrong Category',             detail: 'Product is in the incorrect category. Please select the correct one and re-submit.' },
  incomplete:    { label: 'Incomplete Information',     detail: 'Mandatory fields missing: fabric type, sizes, color, or description. Fill all required fields.' },
  price_error:   { label: 'Price Issue',                detail: 'MRP or selling price seems incorrect, or selling price exceeds MRP. Verify pricing.' },
  copyright:     { label: 'Copyright / Brand Violation', detail: 'Contains unauthorized brand logos or images from other platforms. Remove infringing content.' },
  desc_mismatch: { label: 'Description Mismatch',       detail: "Description does not match the images. Update description to accurately reflect the product." },
};

export function productRejectedEmail(data: ProductRejectedData): { subject: string; html: string } {
  const subject = `Action needed: Your product listing requires changes — ${BRAND.name}`;

  const reasonsHtml = data.rejectionTags.map((tag, i) => {
    const info = REJECTION_DETAILS[tag] ?? { label: tag, detail: 'Please review and fix this issue.' };
    return `
    <div style="background:${BRAND.colors.errorBg};border-radius:10px;padding:16px;margin-bottom:10px;border-left:4px solid ${BRAND.colors.error};">
      <div style="font-size:13px;font-weight:700;color:${BRAND.colors.error};margin-bottom:4px;">${i + 1}. ${info.label}</div>
      <div style="font-size:12px;color:${BRAND.colors.text};line-height:1.6;">${info.detail}</div>
    </div>`;
  }).join('');

  const bodyContent = `
    <p style="font-size:15px;color:${BRAND.colors.text};margin:0 0 16px;">
      Hello <strong>${data.sellerName}</strong>,
    </p>
    <p style="font-size:14px;color:${BRAND.colors.text};margin:0 0 20px;line-height:1.7;">
      We've reviewed your product and found a few issues that need to be fixed before it can go live.
      Please review the feedback below and re-submit.
    </p>

    <div style="background:${BRAND.colors.bg};border-radius:10px;padding:20px;border:1px solid ${BRAND.colors.border};margin-bottom:20px;">
      <div style="font-size:11px;color:${BRAND.colors.gold};font-weight:700;letter-spacing:1.5px;margin-bottom:12px;">PRODUCT DETAILS</div>
      ${infoRow('Product Title', data.productTitle)}
      ${infoRow('Product ID', data.productId)}
      <div style="display:flex;justify-content:space-between;padding:10px 0;">
        <span style="font-size:13px;color:${BRAND.colors.muted};">Status</span>
        ${statusBadge('Changes Required', BRAND.colors.orange, BRAND.colors.orangeBg)}
      </div>
    </div>

    <div style="margin-bottom:20px;">
      <div style="font-size:14px;font-weight:700;color:${BRAND.colors.maroon};margin-bottom:12px;">Issues Found:</div>
      ${reasonsHtml}
    </div>

    ${data.adminNote ? `
    <div style="background:${BRAND.colors.bg};border-radius:10px;padding:16px;border:1px solid ${BRAND.colors.border};margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;color:${BRAND.colors.maroon};margin-bottom:4px;">Additional Note from Review Team:</div>
      <div style="font-size:12px;color:${BRAND.colors.text};line-height:1.6;">${data.adminNote}</div>
    </div>` : ''}

    <div style="background:${BRAND.colors.altBg};border-radius:10px;padding:18px;border:1px solid rgba(196,154,60,0.15);margin-bottom:20px;">
      <div style="font-size:13px;font-weight:700;color:${BRAND.colors.maroon};margin-bottom:8px;">How to fix and re-submit:</div>
      <div style="font-size:13px;color:${BRAND.colors.text};line-height:1.7;">
        1. Go to Seller Dashboard → Products<br/>
        2. Find the product and click "Edit"<br/>
        3. Fix the issues mentioned above<br/>
        4. Click "Re-submit for Review" — we'll review again within 12 hours
      </div>
    </div>

    <div style="background:${BRAND.colors.bg};border-radius:10px;padding:16px;border:1px solid ${BRAND.colors.border};margin-bottom:20px;">
      <div style="font-size:12px;color:${BRAND.colors.maroon};line-height:1.6;">
        <strong>कैसे ठीक करें:</strong> सेलर डैशबोर्ड → प्रोडक्ट्स → एडिट करें → समस्याएं ठीक करें → "री-सबमिट" करें। 12 घंटे में फिर से जांच होगी।
      </div>
    </div>

    ${ctaButton('Edit & Re-submit Product', BRAND.dashboardUrl + '/products')}

    <div style="border-top:1px solid ${BRAND.colors.border};padding-top:16px;">
      <div style="font-size:12px;color:${BRAND.colors.muted};line-height:1.6;">
        Need help? Contact us on
        <a href="${BRAND.whatsappLink}" style="color:${BRAND.colors.success};">WhatsApp Support</a>.
        We're here to help you get your products live.
      </div>
    </div>`;

  return {
    subject,
    html: emailLayout(
      `linear-gradient(135deg,${BRAND.colors.orange},#EF6C00)`,
      '#FFCC80',
      'Your Product Needs Changes',
      'आपके प्रोडक्ट में बदलाव ज़रूरी है',
      bodyContent,
    ),
  };
}
