import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { addPickupLocation } from '@/lib/shiprocket';
import { invalidateSellerKeys } from '@/lib/sellerCache';

// Log a seller status change to history
async function logStatusHistory(
  sellerId: string,
  fromStatus: string | null,
  toStatus: string,
  changedBy: string,
  reason?: string
) {
  await supabaseAdmin.from('spf_seller_status_history').insert({
    seller_id: sellerId,
    changed_by: changedBy,
    from_status: fromStatus,
    to_status: toStatus,
    reason: reason || null,
  });
}

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

// Helper to check if user is the seller or admin
async function canAccessSeller(userId: string, sellerId: string): Promise<boolean> {
  // Check if admin
  if (await isAdmin(userId)) {
    return true;
  }

  // Check if user owns this seller account
  const { data } = await supabase
    .from('spf_sellers')
    .select('user_id')
    .eq('id', sellerId)
    .single();

  return data?.user_id === userId;
}

// GET /api/sellers/[id] - Get seller details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sellerId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Check authorization
    if (!(await canAccessSeller(userId, sellerId))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { data: seller, error } = await supabase
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
      .eq('id', sellerId)
      .single();

    if (error || !seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Fetch status history (admin only)
    let statusHistory: any[] = [];
    if (await isAdmin(userId)) {
      const { data: history } = await supabaseAdmin
        .from('spf_seller_status_history')
        .select('id, from_status, to_status, reason, created_at, changed_by')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });
      statusHistory = history || [];
    }

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
      documents: seller.documents,
      notes: seller.notes,
      createdAt: seller.created_at,
      updatedAt: seller.updated_at,
      user: seller.user,
      statusHistory,
    };

    return NextResponse.json({
      success: true,
      seller: transformedSeller,
    });
  } catch (error) {
    console.error('Get seller error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// PUT /api/sellers/[id] - Update seller (Admin or seller themselves)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sellerId } = await params;
    const body = await request.json();
    const { userId, action, ...updateData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const isAdminUser = await isAdmin(userId);

    // Handle admin actions (approve/reject/suspend/reactivate)
    if (action && isAdminUser) {
      // Get current status for history logging
      const { data: currentSeller } = await supabase
        .from('spf_sellers')
        .select('status')
        .eq('id', sellerId)
        .single();
      const fromStatus = currentSeller?.status || null;

      if (action === 'approve') {
        const { error } = await supabase
          .from('spf_sellers')
          .update({
            status: 'approved',
            is_active: true,
            approved_by: userId,
            approved_at: new Date().toISOString(),
            rejection_reason: null,
            suspension_reason: null,
          })
          .eq('id', sellerId);

        if (error) {
          return NextResponse.json({ error: 'Failed to approve seller' }, { status: 500 });
        }

        await logStatusHistory(sellerId, fromStatus, 'approved', userId, updateData.reason);

        // Register pickup address with Shiprocket (non-blocking)
        void (async () => {
          try {
            const { data: sellerData } = await supabaseAdmin
              .from('spf_sellers')
              .select('business_name, business_email, business_phone, address_line1, city, state, pincode, pickup_pincode')
              .eq('id', sellerId)
              .single();

            if (sellerData) {
              const pickupResult = await addPickupLocation({
                name: sellerData.business_name || 'Seller',
                email: sellerData.business_email || '',
                phone: sellerData.business_phone || '',
                address: sellerData.address_line1 || '',
                city: sellerData.city || '',
                state: sellerData.state || '',
                pincode: sellerData.pickup_pincode || sellerData.pincode || '',
              });

              if (pickupResult.success && pickupResult.pickupLocationName) {
                await supabaseAdmin
                  .from('spf_sellers')
                  .update({ shiprocket_pickup_location: pickupResult.pickupLocationName })
                  .eq('id', sellerId);
                console.log(`[Seller Approve] Registered Shiprocket pickup: ${pickupResult.pickupLocationName} for seller ${sellerId}`);
              }
            }
          } catch (err: any) {
            console.error('[Seller Approve] Shiprocket pickup registration failed (non-fatal):', err?.message);
          }
        })();

        invalidateSellerKeys(sellerId, 'profile').catch(() => {});
        return NextResponse.json({ success: true, message: 'Seller approved successfully' });
      }

      if (action === 'reject') {
        const reason = updateData.rejectionReason || 'Not specified';
        const { error } = await supabase
          .from('spf_sellers')
          .update({
            status: 'rejected',
            is_active: false,
            rejection_reason: reason,
          })
          .eq('id', sellerId);

        if (error) {
          return NextResponse.json({ error: 'Failed to reject seller' }, { status: 500 });
        }

        await logStatusHistory(sellerId, fromStatus, 'rejected', userId, reason);
        invalidateSellerKeys(sellerId, 'profile').catch(() => {});
        return NextResponse.json({ success: true, message: 'Seller rejected' });
      }

      if (action === 'suspend') {
        const reason = updateData.suspensionReason || 'Not specified';
        const { error } = await supabase
          .from('spf_sellers')
          .update({
            status: 'suspended',
            is_active: false,
            suspension_reason: reason,
          })
          .eq('id', sellerId);

        if (error) {
          return NextResponse.json({ error: 'Failed to suspend seller' }, { status: 500 });
        }

        await logStatusHistory(sellerId, fromStatus, 'suspended', userId, reason);
        invalidateSellerKeys(sellerId, 'profile').catch(() => {});
        return NextResponse.json({ success: true, message: 'Seller suspended' });
      }

      if (action === 'reactivate') {
        const { error } = await supabase
          .from('spf_sellers')
          .update({
            status: 'approved',
            is_active: true,
            suspension_reason: null,
            reactivation_request: null,
            reactivation_requested_at: null,
          })
          .eq('id', sellerId);

        if (error) {
          return NextResponse.json({ error: 'Failed to reactivate seller' }, { status: 500 });
        }

        await logStatusHistory(sellerId, fromStatus, 'approved', userId, 'Reactivated by admin');
        invalidateSellerKeys(sellerId, 'profile').catch(() => {});
        return NextResponse.json({ success: true, message: 'Seller reactivated successfully' });
      }
    }

    // Check authorization for regular updates
    if (!(await canAccessSeller(userId, sellerId))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Build update object (sellers can update their own info)
    const updateFields: any = {};

    if (updateData.businessName !== undefined) updateFields.business_name = updateData.businessName;
    if (updateData.businessNameHi !== undefined) updateFields.business_name_hi = updateData.businessNameHi;
    if (updateData.gstin !== undefined) updateFields.gstin = updateData.gstin;
    if (updateData.pan !== undefined) updateFields.pan = updateData.pan;
    if (updateData.businessEmail !== undefined) updateFields.business_email = updateData.businessEmail;
    if (updateData.businessPhone !== undefined) updateFields.business_phone = updateData.businessPhone;
    if (updateData.addressLine1 !== undefined) updateFields.address_line1 = updateData.addressLine1;
    if (updateData.addressLine2 !== undefined) updateFields.address_line2 = updateData.addressLine2;
    if (updateData.city !== undefined) updateFields.city = updateData.city;
    if (updateData.state !== undefined) updateFields.state = updateData.state;
    if (updateData.pincode !== undefined) updateFields.pincode = updateData.pincode;
    if (updateData.pickupPincode !== undefined) updateFields.pickup_pincode = updateData.pickupPincode;
    if (updateData.bankAccountName !== undefined) updateFields.bank_account_name = updateData.bankAccountName;
    if (updateData.bankAccountNumber !== undefined) updateFields.bank_account_number = updateData.bankAccountNumber;
    if (updateData.bankIfsc !== undefined) updateFields.bank_ifsc = updateData.bankIfsc;
    if (updateData.bankName !== undefined) updateFields.bank_name = updateData.bankName;
    if (updateData.documents !== undefined) updateFields.documents = updateData.documents;

    // Only admins can update these fields
    if (isAdminUser) {
      if (updateData.commissionPercentage !== undefined) updateFields.commission_percentage = updateData.commissionPercentage;
      if (updateData.notes !== undefined) updateFields.notes = updateData.notes;
      if (updateData.isActive !== undefined) updateFields.is_active = updateData.isActive;
    }

    const { data: updatedSeller, error } = await supabase
      .from('spf_sellers')
      .update(updateFields)
      .eq('id', sellerId)
      .select()
      .single();

    if (error) {
      console.error('Seller update error:', error);
      return NextResponse.json(
        { error: 'Failed to update seller' },
        { status: 500 }
      );
    }

    invalidateSellerKeys(sellerId, 'profile').catch(() => {});
    return NextResponse.json({
      success: true,
      message: 'Seller updated successfully',
      seller: updatedSeller,
    });
  } catch (error) {
    console.error('Update seller error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// DELETE /api/sellers/[id] - Delete seller (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sellerId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Check admin authorization
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Soft delete (set is_active to false)
    const { error } = await supabase
      .from('spf_sellers')
      .update({ is_active: false, status: 'suspended' })
      .eq('id', sellerId);

    if (error) {
      console.error('Seller delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete seller' },
        { status: 500 }
      );
    }

    invalidateSellerKeys(sellerId, 'profile').catch(() => {});
    return NextResponse.json({
      success: true,
      message: 'Seller deleted successfully',
    });
  } catch (error) {
    console.error('Delete seller error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
