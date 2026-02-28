import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    // Validation
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Find the latest valid OTP for this email
    const { data: otpRecord, error: otpError } = await supabase
      .from('otps')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('otp', otp)
      .eq('is_used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 401 }
      );
    }

    // Mark OTP as used
    await supabase
      .from('otps')
      .update({ is_used: true })
      .eq('id', otpRecord.id);

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('spf_users')
      .select('id, name, email, mobile, location, is_admin')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is a seller and get seller details
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
      sellerInfo = {
        isSeller: true,
        sellerId: seller.id,
        sellerStatus: seller.status as 'pending' | 'approved' | 'rejected' | 'suspended',
      };
    }

    // Check if user is a delivery partner and get partner details
    let deliveryPartnerInfo = {
      isDeliveryPartner: false,
      deliveryPartnerId: undefined as string | undefined,
      deliveryPartnerStatus: undefined as 'active' | 'inactive' | 'suspended' | undefined,
    };

    const { data: deliveryPartner } = await supabase
      .from('spf_delivery_partners')
      .select('id, status')
      .eq('created_by', user.id)
      .single();

    if (deliveryPartner) {
      let status: 'active' | 'inactive' | 'suspended' | undefined = undefined;
      if (deliveryPartner.status === 'active') status = 'active';
      else if (deliveryPartner.status === 'pending_approval' || deliveryPartner.status === 'inactive') status = 'inactive';
      else if (deliveryPartner.status === 'suspended') status = 'suspended';

      deliveryPartnerInfo = {
        isDeliveryPartner: true,
        deliveryPartnerId: deliveryPartner.id,
        deliveryPartnerStatus: status,
      };
    }

    const { is_admin, ...userData } = user;

    return NextResponse.json(
      {
        message: 'OTP verified successfully',
        user: {
          ...userData,
          isAdmin: is_admin || false,
          ...sellerInfo,
          ...deliveryPartnerInfo,
        }
      },
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
