import { Resend } from 'resend';

// Use verified domain once configured in Resend dashboard.
// Until then, Resend free tier requires: onboarding@resend.dev
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'Insta Fashion Points <onboarding@resend.dev>';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;

  // Guard: skip if key is missing or still set to the placeholder value
  if (!apiKey || apiKey === 're_your-resend-api-key' || !apiKey.startsWith('re_')) {
    console.warn('[Email] RESEND_API_KEY not configured or is a placeholder — email skipped.');
    console.warn('[Email] Set a real key from https://resend.com/api-keys in your .env.local');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    // Lazy-init so the real key is always read at call time, not at module load
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      reply_to: replyTo ?? 'support@instafashionpoints.com',
    });

    if (error) {
      console.error('[Email Error]', error);
      return { success: false, error: (error as any).message ?? String(error) };
    }

    console.log('[Email Sent]', { to, subject, id: data?.id });
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('[Email Exception]', err?.message);
    return { success: false, error: err?.message };
  }
}
