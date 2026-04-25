import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/auth/session-restore
 *
 * Called by AuthContext when localStorage has no user but an iron-session
 * cookie may still be valid (e.g. after the user cleared site data).
 * Returns the full user object so the client can restore auth state without
 * forcing the user through the login page again.
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ user: null });
    }

    const { data: user, error } = await supabaseAdmin
      .from('spf_users')
      .select('id, name, email, mobile, location, is_admin')
      .eq('id', session.userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ user: null });
    }

    // Seller info
    const { data: seller } = await supabaseAdmin
      .from('spf_sellers')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle();

    // Delivery partner info
    const { data: dp } = await supabaseAdmin
      .from('spf_delivery_partners')
      .select('id, status')
      .eq('created_by', user.id)
      .maybeSingle();

    const sellerInfo = seller
      ? { isSeller: true, sellerId: seller.id, sellerStatus: seller.status }
      : { isSeller: false, sellerId: undefined, sellerStatus: undefined };

    let dpStatus: 'active' | 'inactive' | 'suspended' | undefined;
    if (dp?.status === 'active') dpStatus = 'active';
    else if (dp?.status === 'pending_approval' || dp?.status === 'inactive') dpStatus = 'inactive';
    else if (dp?.status === 'suspended') dpStatus = 'suspended';

    const dpInfo = dp
      ? { isDeliveryPartner: true, deliveryPartnerId: dp.id, deliveryPartnerStatus: dpStatus }
      : { isDeliveryPartner: false, deliveryPartnerId: undefined, deliveryPartnerStatus: undefined };

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        location: user.location,
        isAdmin: user.is_admin || false,
        ...sellerInfo,
        ...dpInfo,
      },
    });
  } catch (err) {
    console.error('[session-restore] error:', err);
    return NextResponse.json({ user: null });
  }
}
