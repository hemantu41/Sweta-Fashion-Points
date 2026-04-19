/**
 * Email notifications for support ticket events.
 * No Prisma — uses supabaseAdmin + Resend only.
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/email';

const C = {
  maroon:   '#5B1A3A',
  gold:     '#C49A3C',
  bg:       '#FAF7F8',
  white:    '#FFFFFF',
  text:     '#333333',
  muted:    '#888888',
  border:   '#E8E0E4',
  altBg:    '#F5EDF2',
  success:  '#2E7D32',
};

const SUPPORT_URL = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://instafashionpoints.com'}/seller/dashboard/support`;

const TICKET_STATUS_META: Record<string, { label: string; emoji: string; headerBg: string; note: string }> = {
  open:              { label: 'Open',           emoji: '🎫', headerBg: C.maroon,    note: 'Your ticket has been received and is in the queue.' },
  in_progress:       { label: 'In Progress',    emoji: '🔧', headerBg: '#B45309',   note: 'Our support team is actively working on your ticket.' },
  waiting_on_seller: { label: 'Waiting on You', emoji: '💬', headerBg: '#7C3AED',   note: 'We need more information from you to proceed. Please reply to your ticket.' },
  resolved:          { label: 'Resolved',        emoji: '✅', headerBg: C.success,   note: 'Your ticket has been marked as resolved. If the issue persists, you can re-open it from your seller portal.' },
  closed:            { label: 'Closed',          emoji: '🔒', headerBg: '#374151',   note: 'This ticket is now closed. If you need further help, you can open a new ticket.' },
};

function emailShell(headerBg: string, title: string, subtitle: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:${C.white};">
  <div style="background:${headerBg};padding:28px 32px;text-align:center;">
    <div style="font-size:11px;color:${C.gold};font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Insta Fashion Points</div>
    <div style="font-family:Georgia,serif;font-size:20px;color:#fff;font-weight:700;">${title}</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.65);margin-top:4px;">${subtitle}</div>
  </div>
  <div style="padding:32px 32px 24px;">${body}</div>
  <div style="background:${C.bg};padding:20px 32px;text-align:center;border-top:1px solid ${C.border};">
    <div style="font-size:12px;color:${C.maroon};font-weight:700;margin-bottom:4px;">Insta Fashion Points</div>
    <div style="font-size:11px;color:${C.gold};font-style:italic;margin-bottom:8px;">Apne Dukandaar se, Online</div>
    <div style="font-size:10px;color:${C.muted};">
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

/**
 * Notify the seller by email when an admin changes the ticket status or adds a public reply.
 * Called fire-and-forget from admin PATCH and admin comments POST.
 */
export async function notifySellerTicketUpdate(opts: {
  ticketId:      string;
  ticketNumber:  string;
  subject:       string;
  sellerId:      string;    // spf_sellers.id
  newStatus?:    string;    // set when status changed
  adminMessage?: string;    // set when admin replied
}): Promise<void> {
  try {
    const { ticketNumber, subject, sellerId, newStatus, adminMessage } = opts;

    // Fetch seller email from spf_sellers (no Prisma)
    const { data: seller } = await supabaseAdmin
      .from('spf_sellers')
      .select('business_name, business_email')
      .eq('id', sellerId)
      .maybeSingle();

    if (!seller?.business_email) {
      console.warn(`[ticketNotify] No business_email for seller ${sellerId} — skipped`);
      return;
    }

    const meta    = newStatus ? TICKET_STATUS_META[newStatus] : null;
    const isReply = !!adminMessage && !newStatus;

    const emailSubject = newStatus
      ? `Ticket ${ticketNumber} — Status: ${meta?.label ?? newStatus}`
      : `New reply on ticket ${ticketNumber}`;

    const statusSection = meta ? `
      <div style="background:${meta.headerBg}18;border-left:4px solid ${meta.headerBg};
           border-radius:4px;padding:14px 18px;margin-bottom:20px;">
        <div style="font-size:15px;font-weight:700;color:${meta.headerBg};margin-bottom:4px;">
          ${meta.emoji} Status changed to: ${meta.label}
        </div>
        <div style="font-size:13px;color:${C.text};">${meta.note}</div>
      </div>` : '';

    const replySection = adminMessage ? `
      <div style="background:${C.altBg};border-radius:8px;padding:16px;margin-bottom:20px;">
        <div style="font-size:12px;color:${C.muted};margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
          Support Reply
        </div>
        <div style="font-size:14px;color:${C.text};line-height:1.6;white-space:pre-wrap;">${adminMessage}</div>
      </div>` : '';

    const body = `
      <p style="color:${C.text};font-size:15px;margin:0 0 16px;">
        Hello <strong>${seller.business_name}</strong>,
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
        <tr>
          <td style="padding:8px 0;color:${C.muted};font-size:13px;width:40%;">Ticket Number</td>
          <td style="padding:8px 0;color:${C.text};font-size:13px;font-weight:700;font-family:monospace;">${ticketNumber}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:${C.muted};font-size:13px;">Subject</td>
          <td style="padding:8px 0;color:${C.text};font-size:13px;font-weight:600;">${subject}</td>
        </tr>
      </table>
      ${statusSection}
      ${replySection}
      ${ctaButton('View Ticket & Reply →', SUPPORT_URL)}
      <p style="font-size:12px;color:${C.muted};text-align:center;margin-top:16px;">
        You can reply directly from your seller portal.
      </p>`;

    const headerBg    = meta?.headerBg ?? C.maroon;
    const headerTitle = isReply ? '💬 New Reply on Your Ticket' : `${meta?.emoji ?? '🎫'} Ticket Update`;
    const headerSub   = isReply ? `Ticket ${ticketNumber}` : `Status → ${meta?.label ?? newStatus}`;

    await sendEmail({
      to:      seller.business_email,
      subject: emailSubject,
      html:    emailShell(headerBg, headerTitle, headerSub, body),
    });
  } catch (err: any) {
    console.error('[ticketNotify] notifySellerTicketUpdate error:', err?.message);
  }
}
