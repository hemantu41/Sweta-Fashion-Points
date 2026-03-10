import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/auth/me?userId=xxx
// Returns the latest seller + delivery partner status for a logged-in user.
// Called by AuthContext on mount to sync localStorage with DB.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Seller status
    const { data: seller } = await supabase
      .from('spf_sellers')
      .select('id, status')
      .eq('user_id', userId)
      .maybeSingle();

    const sellerInfo = seller
      ? { isSeller: true, sellerId: seller.id, sellerStatus: seller.status }
      : { isSeller: false, sellerId: undefined, sellerStatus: undefined };

    // Delivery partner status
    const { data: partner } = await supabase
      .from('spf_delivery_partners')
      .select('id, status')
      .eq('created_by', userId)
      .maybeSingle();

    let deliveryPartnerInfo = {
      isDeliveryPartner: false,
      deliveryPartnerId: undefined as string | undefined,
      deliveryPartnerStatus: undefined as string | undefined,
    };

    if (partner) {
      deliveryPartnerInfo = {
        isDeliveryPartner: true,
        deliveryPartnerId: partner.id,
        deliveryPartnerStatus: partner.status,
      };
    }

    return NextResponse.json({
      ...sellerInfo,
      ...deliveryPartnerInfo,
    });
  } catch (error) {
    console.error('[Auth Me] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch user status' }, { status: 500 });
  }
}
