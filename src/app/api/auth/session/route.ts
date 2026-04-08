import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

// GET /api/auth/session
// Reads the iron-session cookie and returns the full user object from DB.
// Used by the client to restore localStorage when it has been cleared.
export async function GET() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.mobile) {
      return NextResponse.json({ isLoggedIn: false });
    }

    const { data: user, error } = await supabase
      .from('spf_users')
      .select('id, name, email, mobile, location, is_admin')
      .eq('mobile', session.mobile)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ isLoggedIn: false });
    }

    const { data: seller } = await supabase
      .from('spf_sellers')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: dp } = await supabase
      .from('spf_delivery_partners')
      .select('id, status')
      .eq('created_by', user.id)
      .maybeSingle();

    let deliveryPartnerStatus: 'active' | 'inactive' | 'suspended' | undefined;
    if (dp?.status === 'active') deliveryPartnerStatus = 'active';
    else if (dp?.status === 'suspended') deliveryPartnerStatus = 'suspended';
    else if (dp) deliveryPartnerStatus = 'inactive';

    const { is_admin, ...userData } = user;

    return NextResponse.json({
      isLoggedIn: true,
      user: {
        ...userData,
        isAdmin: is_admin || false,
        isSeller: !!seller,
        sellerId: seller?.id,
        sellerStatus: seller?.status,
        isDeliveryPartner: !!dp,
        deliveryPartnerId: dp?.id,
        deliveryPartnerStatus,
      },
    });
  } catch (err) {
    console.error('[Auth Session] Error:', err);
    return NextResponse.json({ isLoggedIn: false });
  }
}
