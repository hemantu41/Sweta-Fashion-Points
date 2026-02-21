import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { sendSMS } from '@/lib/notifications';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(apiKey);
}

// POST /api/sellers/send-verification-otp - Send OTP for seller email/phone verification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, value } = body; // type: 'email' or 'phone', value: email or phone number

    // Validation
    if (!type || !value) {
      return NextResponse.json(
        { error: 'Type and value are required' },
        { status: 400 }
      );
    }

    if (type !== 'email' && type !== 'phone') {
      return NextResponse.json(
        { error: 'Type must be either "email" or "phone"' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    const { error: otpError } = await supabase
      .from('seller_verification_otps')
      .insert([
        {
          type,
          value: type === 'email' ? value.toLowerCase() : value,
          otp,
          expires_at: expiresAt.toISOString(),
        },
      ]);

    if (otpError) {
      console.error('OTP save error:', otpError);
      return NextResponse.json(
        { error: 'Failed to generate OTP. Please try again.' },
        { status: 500 }
      );
    }

    // Send OTP based on type
    if (type === 'email') {
      // Send OTP via email
      let resend;
      try {
        resend = getResendClient();
      } catch {
        console.error('Resend API key not configured');
        return NextResponse.json(
          { error: 'Email service not configured. Please contact support.' },
          { status: 500 }
        );
      }

      const { error: emailError } = await resend.emails.send({
        from: 'Fashion Points <noreply@fashionpoints.co.in>',
        to: value,
        subject: 'Verify Your Business Email - Fashion Points',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #722F37; margin: 0;">Fashion Points</h1>
              <p style="color: #6B6B6B; margin-top: 10px;">Seller Registration Verification</p>
            </div>
            <div style="background: #f8f8f8; padding: 30px; border-radius: 10px; text-align: center;">
              <h2 style="color: #333; margin-bottom: 20px;">Verify Your Business Email</h2>
              <p style="color: #666; margin-bottom: 20px;">
                Enter this OTP to verify your business email address for seller registration:
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
        return NextResponse.json(
          { error: 'Failed to send OTP email. Please try again.' },
          { status: 500 }
        );
      }
    } else if (type === 'phone') {
      // Send OTP via SMS
      const smsMessage = `Your OTP for seller registration at Fashion Points is ${otp}. Valid for 10 minutes. Do not share with anyone.`;

      const smsResult = await sendSMS({
        phone: value,
        message: smsMessage,
      });

      if (!smsResult.success) {
        console.error('SMS send error:', smsResult.error);
        return NextResponse.json(
          { error: 'Failed to send OTP SMS. Please check your phone number and try again.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { message: 'OTP sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send verification OTP error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
