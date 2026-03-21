import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

const IS_DEMO = process.env.NEXT_PUBLIC_MSG91_DEMO_MODE === 'true';

// POST /api/auth/verify-login-otp — verify mobile OTP and return user session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mobile, otp } = body;

    if (!mobile || !otp) {
      return NextResponse.json({ error: 'Mobile number and OTP are required' }, { status: 400 });
    }

    // ── Demo mode: accept fixed OTP "123456" without DB check ─────────────
    if (IS_DEMO) {
      if (otp !== '123456') {
        return NextResponse.json({ error: 'Invalid OTP. In demo mode, use 123456' }, { status: 401 });
      }
      console.log(`[DEMO] OTP verified for ${mobile}`);
    } else {
      // ── Production: verify OTP from database ──────────────────────────────
      const { data: otpRecord, error: otpError } = await supabase
        .from('seller_verification_otps')
        .select('*')
        .eq('type', 'phone')
        .eq('value', mobile)
        .eq('otp', otp)
        .eq('is_used', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (otpError || !otpRecord) {
        return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
      }

      // Mark OTP as used
      await supabase
        .from('seller_verification_otps')
        .update({ is_used: true })
        .eq('id', otpRecord.id);
    }

    // ── Fetch user by mobile ───────────────────────────────────────────────
    const { data: user, error: userError } = await supabase
      .from('spf_users')
      .select('id, name, email, mobile, location, is_admin')
      .eq('mobile', mobile)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ── Seller info ────────────────────────────────────────────────────────
    let sellerInfo = {
      isSeller: false,
      sellerId: undefined as string | undefined,
      sellerStatus: undefined as 'pending' | 'approved' | 'rejected' | 'suspended' | undefined,
    };
    const { data: seller } = await supabase
      .from('spf_sellers')
      .select('id, status')
      .eq('user_id', user.id)
      .single();
    if (seller) {
      sellerInfo = { isSeller: true, sellerId: seller.id, sellerStatus: seller.status as typeof sellerInfo.sellerStatus };
    }

    // ── Delivery partner info ──────────────────────────────────────────────
    let deliveryPartnerInfo = {
      isDeliveryPartner: false,
      deliveryPartnerId: undefined as string | undefined,
      deliveryPartnerStatus: undefined as 'active' | 'inactive' | 'suspended' | undefined,
    };
    const { data: dp } = await supabase
      .from('spf_delivery_partners')
      .select('id, status')
      .eq('created_by', user.id)
      .single();
    if (dp) {
      let status: typeof deliveryPartnerInfo.deliveryPartnerStatus;
      if (dp.status === 'active') status = 'active';
      else if (dp.status === 'suspended') status = 'suspended';
      else status = 'inactive';
      deliveryPartnerInfo = { isDeliveryPartner: true, deliveryPartnerId: dp.id, deliveryPartnerStatus: status };
    }

    // ── Set iron-session cookie (30-day login) ─────────────────────────────
    const session = await getSession();
    session.mobile = mobile;
    session.isLoggedIn = true;
    await session.save();

    const { is_admin, ...userData } = user;

    return NextResponse.json({
      message: 'OTP verified successfully',
      user: { ...userData, isAdmin: is_admin || false, ...sellerInfo, ...deliveryPartnerInfo },
    }, { status: 200 });

  } catch (error) {
    console.error('Verify login OTP error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
