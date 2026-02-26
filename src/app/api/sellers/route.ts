import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCachedData, sellerCache } from '@/lib/cache';

// Helper to check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('spf_users')
    .select('is_admin, user_type')
    .eq('id', userId)
    .single();
  // Check both is_admin column AND user_type for backwards compatibility
  return data?.is_admin === true || data?.user_type === 'admin';
}

// GET /api/sellers - List all sellers (Admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // pending, approved, rejected, suspended

    // Check admin authorization
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Create unique cache key based on status filter
    const cacheKey = `sellers:${status || 'all'}`;

    // Fetch sellers with caching (10 minute TTL)
    const transformedSellers = await getCachedData(
      cacheKey,
      async () => {
        // Build query
        let query = supabase
          .from('spf_sellers')
          .select(`
            *,
            user:spf_users!spf_sellers_user_id_fkey (
              id,
              name,
              email,
              mobile,
              created_at
            )
          `);

        // Apply status filter
        if (status) {
          query = query.eq('status', status);
        }

        const { data: sellers, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('[Sellers API] Database error:', error);
          throw new Error('Failed to fetch sellers');
        }

        // Transform to camelCase
        return sellers?.map(s => ({
      id: s.id,
      userId: s.user_id,
      businessName: s.business_name,
      businessNameHi: s.business_name_hi,
      gstin: s.gstin,
      pan: s.pan,
      businessEmail: s.business_email,
      businessPhone: s.business_phone,
      addressLine1: s.address_line1,
      addressLine2: s.address_line2,
      city: s.city,
      state: s.state,
      pincode: s.pincode,
      bankAccountName: s.bank_account_name,
      bankAccountNumber: s.bank_account_number,
      bankIfsc: s.bank_ifsc,
      bankName: s.bank_name,
      status: s.status,
      approvedBy: s.approved_by,
      approvedAt: s.approved_at,
      rejectionReason: s.rejection_reason,
      commissionPercentage: s.commission_percentage,
      isActive: s.is_active,
      documents: s.documents,
          notes: s.notes,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
          user: s.user,
        })) || [];
      },
      sellerCache,
      600 // 10 minutes TTL
    );

    return NextResponse.json({
      success: true,
      sellers: transformedSellers,
    });
  } catch (error) {
    console.error('Sellers API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
