import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { productSubmittedEmail, productApprovedEmail, productRejectedEmail } from '@/lib/emailTemplates/productEmails';

/**
 * POST /api/admin/test-email
 * Sends a test email to verify Resend API key + templates are working.
 *
 * Body: { to: string, template?: 'submitted' | 'approved' | 'rejected' }
 * Example:
 *   curl -X POST http://localhost:3000/api/admin/test-email \
 *     -H "Content-Type: application/json" \
 *     -d '{"to":"your@email.com","template":"submitted"}'
 */
export async function POST(request: NextRequest) {
  try {
    const { to, template = 'submitted' } = await request.json();

    if (!to || !to.includes('@')) {
      return NextResponse.json({ error: '"to" email address is required' }, { status: 400 });
    }

    const mockProduct = {
      sellerName:      'Test Seller',
      shopName:        'Test Shop',
      productTitle:    'Beautiful Cotton Kurti',
      productCategory: 'Women > Kurtis',
      sellingPrice:    599,
      mrp:             999,
      productId:       'IFP-PRD-TESTABCD',
      productSlug:     'beautiful-cotton-kurti',
      submittedAt:     new Date(),
    };

    let subject: string;
    let html: string;

    if (template === 'approved') {
      ({ subject, html } = productApprovedEmail({ ...mockProduct, adminNote: 'Great product! Keep it up.' }));
    } else if (template === 'rejected') {
      ({ subject, html } = productRejectedEmail({
        ...mockProduct,
        rejectionTags: ['bad_image', 'missing_sides'],
        adminNote: 'Please re-upload clearer photos.',
      }));
    } else {
      ({ subject, html } = productSubmittedEmail(mockProduct));
    }

    const result = await sendEmail({ to, subject, html });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, hint: 'Check RESEND_API_KEY in .env.local and verify sender domain in Resend dashboard' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, emailId: result.id, template, to });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
