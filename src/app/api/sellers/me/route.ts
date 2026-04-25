import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import { sellerCacheGet, sellerCacheSet } from '@/lib/sellerCache';

// GET /api/sellers/me - Get current user's seller profile
// Supports ?userId=<uid> OR ?sellerId=<sid> (admin use-case)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sellerId = searchParams.get('sellerId');

    if (!userId && !sellerId) {
      console.error('[Sellers Me API] No userId or sellerId provided');
      return NextResponse.json(
        { error: 'User ID or Seller ID required' },
        { status: 400 }
      );
    }

    // ── Cache-first: check Redis if we already have sellerId ──────────────
    if (sellerId) {
      const cached = await sellerCacheGet<any>(sellerId, 'profile');
      if (cached) {
        // Reconstruct the same camelCase shape from cached raw seller row
        const s = cached;
        return NextResponse.json({
          success: true,
          seller: {
            id: s.id, userId: s.user_id, businessName: s.business_name,
            businessNameHi: s.business_name_hi, gstin: s.gstin, pan: s.pan,
            businessEmail: s.business_email, businessPhone: s.business_phone,
            addressLine1: s.address_line1, addressLine2: s.address_line2,
            city: s.city, state: s.state, pincode: s.pincode,
            bankAccountName: s.bank_account_name, bankAccountNumber: s.bank_account_number,
            bankIfsc: s.bank_ifsc, bankName: s.bank_name, status: s.status,
            approvedBy: s.approved_by, approvedAt: s.approved_at,
            rejectionReason: s.rejection_reason, suspensionReason: s.suspension_reason,
            reactivationRequest: s.reactivation_request, reactivationRequestedAt: s.reactivation_requested_at,
            commissionPercentage: s.commission_percentage, isActive: s.is_active,
            latitude: s.latitude != null ? Number(s.latitude) : null,
            longitude: s.longitude != null ? Number(s.longitude) : null,
            documents: s.documents, notes: s.notes,
            createdAt: s.created_at, updatedAt: s.updated_at, user: s.user,
          },
          fromCache: true,
        });
      }
    }

    let query = supabaseAdmin
      .from('spf_sellers')
      .select(`
        *,
        user:spf_users!spf_sellers_user_id_fkey (
          id,
          name,
          email,
          mobile
        )
      `);

    if (sellerId) {
      query = query.eq('id', sellerId);
    } else {
      query = query.eq('user_id', userId!);
    }

    console.log('[Sellers Me API] Fetching seller:', sellerId ? `sellerId=${sellerId}` : `userId=${userId}`);

    const { data: seller, error } = await query.single();

    if (error) {
      console.error('[Sellers Me API] Supabase error:', error);
      return NextResponse.json(
        { error: 'Seller profile not found. Please register as a seller first.', details: error.message },
        { status: 404 }
      );
    }

    if (!seller) {
      console.error('[Sellers Me API] No seller found for userId:', userId);
      return NextResponse.json(
        { error: 'Seller profile not found. Please register as a seller first.' },
        { status: 404 }
      );
    }

    console.log('[Sellers Me API] Seller found:', seller.id, 'Status:', seller.status);

    // Transform to camelCase
    const transformedSeller = {
      id: seller.id,
      userId: seller.user_id,
      businessName: seller.business_name,
      businessNameHi: seller.business_name_hi,
      gstin: seller.gstin,
      pan: seller.pan,
      businessEmail: seller.business_email,
      businessPhone: seller.business_phone,
      addressLine1: seller.address_line1,
      addressLine2: seller.address_line2,
      city: seller.city,
      state: seller.state,
      pincode: seller.pincode,
      bankAccountName: seller.bank_account_name,
      bankAccountNumber: seller.bank_account_number,
      bankIfsc: seller.bank_ifsc,
      bankName: seller.bank_name,
      status: seller.status,
      approvedBy: seller.approved_by,
      approvedAt: seller.approved_at,
      rejectionReason: seller.rejection_reason,
      suspensionReason: seller.suspension_reason,
      reactivationRequest: seller.reactivation_request,
      reactivationRequestedAt: seller.reactivation_requested_at,
      commissionPercentage: seller.commission_percentage,
      isActive: seller.is_active,
      latitude: seller.latitude != null ? Number(seller.latitude) : null,
      longitude: seller.longitude != null ? Number(seller.longitude) : null,
      documents: seller.documents,
      notes: seller.notes,
      createdAt: seller.created_at,
      updatedAt: seller.updated_at,
      user: seller.user,
    };

    // Write to Redis cache for future requests (background, non-blocking)
    sellerCacheSet(seller.id, 'profile', seller).catch(() => {});

    return NextResponse.json({
      success: true,
      seller: transformedSeller,
    });
  } catch (error) {
    console.error('Get seller me error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// PATCH /api/sellers/me - Update seller location (lat/lng)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, latitude, longitude } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    if (latitude == null || longitude == null) {
      return NextResponse.json({ error: 'latitude and longitude are required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('spf_sellers')
      .update({ latitude: Number(latitude), longitude: Number(longitude) })
      .eq('user_id', userId);

    if (error) {
      console.error('[Sellers Me API] Location update error:', error);
      return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Seller location update error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
