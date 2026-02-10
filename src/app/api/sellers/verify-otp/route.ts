import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/sellers/verify-otp - Verify OTP for seller email/phone verification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, value, otp } = body; // type: 'email' or 'phone', value: email or phone number

    // Validation
    if (!type || !value || !otp) {
      return NextResponse.json(
        { error: 'Type, value, and OTP are required' },
        { status: 400 }
      );
    }

    if (type !== 'email' && type !== 'phone') {
      return NextResponse.json(
        { error: 'Type must be either "email" or "phone"' },
        { status: 400 }
      );
    }

    // Find the latest valid OTP for this type and value
    const { data: otpRecord, error: otpError } = await supabase
      .from('seller_verification_otps')
      .select('*')
      .eq('type', type)
      .eq('value', type === 'email' ? value.toLowerCase() : value)
      .eq('otp', otp)
      .eq('is_used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 401 }
      );
    }

    // Mark OTP as used
    await supabase
      .from('seller_verification_otps')
      .update({ is_used: true })
      .eq('id', otpRecord.id);

    return NextResponse.json(
      { message: 'OTP verified successfully', verified: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
