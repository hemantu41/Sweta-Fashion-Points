import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendSMS } from '@/lib/notifications';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/send-login-otp — send OTP to mobile for login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mobile } = body;

    if (!mobile) {
      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number' }, { status: 400 });
    }

    // Check user exists
    const { data: user } = await supabase
      .from('spf_users')
      .select('id')
      .eq('mobile', mobile)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: 'No account found with this mobile number' }, { status: 404 });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP — reuse seller_verification_otps table (type='phone' matches DB constraint)
    const { error: otpError } = await supabase
      .from('seller_verification_otps')
      .insert([{ type: 'phone', value: mobile, otp, expires_at: expiresAt.toISOString() }]);

    if (otpError) {
      console.error('OTP save error:', otpError);
      return NextResponse.json({ error: 'Failed to generate OTP. Please try again.' }, { status: 500 });
    }

    // Send SMS
    const smsResult = await sendSMS({
      phone: mobile,
      message: `Your OTP for login at Fashion Points is ${otp}. Valid for 10 minutes. Do not share with anyone.`,
    });

    if (!smsResult.success) {
      console.warn(`[OTP] SMS could not be sent to ${mobile}. OTP for testing: ${otp}. Error: ${smsResult.error}`);
      // UAT: return OTP in response so testers can use it without SMS
      // TODO: remove devOtp field before going live with MSG91
      return NextResponse.json({ message: 'OTP sent successfully', devOtp: otp, devNote: 'SMS not configured — use this OTP for testing' }, { status: 200 });
    }

    return NextResponse.json({ message: 'OTP sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Send login OTP error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
