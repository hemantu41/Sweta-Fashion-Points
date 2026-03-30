import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Use verified domain once set up in Resend dashboard.
// Until then Resend requires onboarding@resend.dev for free tier.
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'Insta Fashion Points <onboarding@resend.dev>';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] RESEND_API_KEY not set — skipping send');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      reply_to: replyTo ?? 'support@instafashionpoints.com',
    });

    if (error) {
      console.error('[Email Error]', error);
      return { success: false, error: error.message };
    }

    console.log('[Email Sent]', { to, subject, id: data?.id });
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('[Email Exception]', err?.message);
    return { success: false, error: err?.message };
  }
}
