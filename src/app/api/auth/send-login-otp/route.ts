import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');
  return new Resend(apiKey);
}

// POST /api/auth/send-login-otp — send OTP to email for login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check user exists
    const { data: user } = await supabase
      .from('spf_users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email address' }, { status: 404 });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database (type='email' matches DB CHECK constraint)
    const { error: otpError } = await supabase
      .from('seller_verification_otps')
      .insert([{ type: 'email', value: normalizedEmail, otp, expires_at: expiresAt.toISOString() }]);

    if (otpError) {
      console.error('OTP save error:', otpError);
      return NextResponse.json({ error: 'Failed to generate OTP. Please try again.' }, { status: 500 });
    }

    // Send OTP via email
    let resend;
    try {
      resend = getResendClient();
    } catch {
      console.error('Resend API key not configured');
      return NextResponse.json({ error: 'Email service not configured. Please contact support.' }, { status: 500 });
    }

    const { error: emailError } = await resend.emails.send({
      from: 'Insta Fashion Points <noreply@instafashionpoints.com>',
      to: normalizedEmail,
      subject: 'Your Login OTP - Insta Fashion Points',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #722F37; margin: 0;">Insta Fashion Points</h1>
            <p style="color: #6B6B6B; margin-top: 10px;">Account Login</p>
          </div>
          <div style="background: #f8f8f8; padding: 30px; border-radius: 10px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Your Login OTP</h2>
            <p style="color: #666; margin-bottom: 20px;">
              Use this OTP to log in to your Insta Fashion Points account:
            </p>
            <div style="background: #722F37; color: white; font-size: 32px; letter-spacing: 8px; padding: 20px 40px; border-radius: 8px; display: inline-block; font-weight: bold;">
              ${otp}
            </div>
            <p style="color: #666; margin-top: 20px; font-size: 14px;">
              This OTP is valid for 10 minutes. Do not share it with anyone.
            </p>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            If you didn't request this OTP, please ignore this email.
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error('Email send error:', emailError);
      return NextResponse.json({ error: 'Failed to send OTP email. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'OTP sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Send login OTP error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
