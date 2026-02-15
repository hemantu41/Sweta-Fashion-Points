import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/sellers/me - Get current user's seller profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      console.error('[Sellers Me API] No userId provided');
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    console.log('[Sellers Me API] Fetching seller for userId:', userId);

    const { data: seller, error } = await supabaseAdmin
      .from('spf_sellers')
      .select(`
        *,
        user:spf_users!spf_sellers_user_id_fkey (
          id,
          name,
          email,
          mobile
        )
      `)
      .eq('user_id', userId)
      .single();

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
      commissionPercentage: seller.commission_percentage,
      isActive: seller.is_active,
      documents: seller.documents,
      notes: seller.notes,
      createdAt: seller.created_at,
      updatedAt: seller.updated_at,
      user: seller.user,
    };

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
