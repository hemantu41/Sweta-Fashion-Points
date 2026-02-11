import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    // Validation
    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/Mobile and password are required' },
        { status: 400 }
      );
    }

    // Find user by email or mobile in spf_users table
    const { data: user, error } = await supabase
      .from('spf_users')
      .select('id, name, email, mobile, location, password, is_admin, user_type')
      .or(`email.eq.${identifier.toLowerCase()},mobile.eq.${identifier}`)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid email/mobile or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email/mobile or password' },
        { status: 401 }
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
      // Map status to deliveryPartnerStatus
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

    // Return user without password
    const { password: _, is_admin, user_type, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: 'Login successful',
        user: {
          ...userWithoutPassword,
          isAdmin: is_admin || false,
          ...sellerInfo,
          ...deliveryPartnerInfo,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
