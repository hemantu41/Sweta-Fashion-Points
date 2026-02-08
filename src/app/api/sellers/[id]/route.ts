import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('spf_users')
    .select('user_type')
    .eq('id', userId)
    .single();
  return data?.user_type === 'admin';
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
          phone_number
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

    // Handle admin actions (approve/reject/suspend)
    if (action && isAdminUser) {
      if (action === 'approve') {
        const { error } = await supabase
          .from('spf_sellers')
          .update({
            status: 'approved',
            approved_by: userId,
            approved_at: new Date().toISOString(),
            rejection_reason: null,
          })
          .eq('id', sellerId);

        if (error) {
          return NextResponse.json(
            { error: 'Failed to approve seller' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Seller approved successfully',
        });
      }

      if (action === 'reject') {
        const { error } = await supabase
          .from('spf_sellers')
          .update({
            status: 'rejected',
            rejection_reason: updateData.rejectionReason || 'Not specified',
          })
          .eq('id', sellerId);

        if (error) {
          return NextResponse.json(
            { error: 'Failed to reject seller' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Seller rejected',
        });
      }

      if (action === 'suspend') {
        const { error } = await supabase
          .from('spf_sellers')
          .update({
            status: 'suspended',
            is_active: false,
          })
          .eq('id', sellerId);

        if (error) {
          return NextResponse.json(
            { error: 'Failed to suspend seller' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Seller suspended',
        });
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
