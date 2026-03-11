import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { partnerCache } from '@/lib/cache';

// Maps a status transition to a human-readable action label
function getActionLabel(from: string | null, to: string): string {
  if (to === 'active' && from === 'pending_approval') return 'Approved';
  if (to === 'active') return 'Reactivated';
  if (to === 'rejected') return 'Rejected';
  if (to === 'suspended') return 'Suspended';
  if (to === 'inactive') return 'Deactivated';
  return 'Status Changed';
}

async function insertStatusHistory(
  deliveryPartnerId: string,
  fromStatus: string | null,
  toStatus: string,
  note: string | null,
  changedBy: string | null,
  changedByName: string | null
) {
  const action = getActionLabel(fromStatus, toStatus);
  await supabase.from('spf_delivery_partner_status_history').insert({
    delivery_partner_id: deliveryPartnerId,
    from_status: fromStatus,
    to_status: toStatus,
    action,
    note: note || null,
    changed_by: changedBy || null,
    changed_by_name: changedByName || null,
  });
}

// GET - Get single delivery partner details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: partner, error } = await supabase
      .from('spf_delivery_partners')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Delivery Partner API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch delivery partner', details: error.message },
        { status: 500 }
      );
    }

    if (!partner) {
      return NextResponse.json(
        { error: 'Delivery partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      partner,
    });
  } catch (error: any) {
    console.error('[Delivery Partner API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch delivery partner',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}

// PUT - Update delivery partner (Admin Only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      email,
      mobile,
      vehicleNumber,
      vehicleType,
      licenseNumber,
      aadharNumber,
      panNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      servicePincodes,
      status,
      availabilityStatus,
      rejectionReason, // Rejection reason when status is rejected
      note,            // Admin note stored in status history
      updatedBy,       // Admin user ID
      updatedByName,   // Admin display name for history
    } = body;

    // Fetch existing partner — include status so we know the previous value
    const { data: existingPartner } = await supabase
      .from('spf_delivery_partners')
      .select('id, status')
      .eq('id', id)
      .maybeSingle();

    if (!existingPartner) {
      return NextResponse.json(
        { error: 'Delivery partner not found' },
        { status: 404 }
      );
    }

    // If mobile is being updated, check for duplicates
    if (mobile) {
      const { data: duplicateMobile } = await supabase
        .from('spf_delivery_partners')
        .select('id')
        .eq('mobile', mobile)
        .neq('id', id)
        .maybeSingle();

      if (duplicateMobile) {
        return NextResponse.json(
          { error: 'Another delivery partner with this mobile number already exists' },
          { status: 409 }
        );
      }
    }

    // If email is being updated, check for duplicates
    if (email) {
      const { data: duplicateEmail } = await supabase
        .from('spf_delivery_partners')
        .select('id')
        .eq('email', email.toLowerCase())
        .neq('id', id)
        .maybeSingle();

      if (duplicateEmail) {
        return NextResponse.json(
          { error: 'Another delivery partner with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email ? email.toLowerCase() : null;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (vehicleNumber !== undefined) updateData.vehicle_number = vehicleNumber;
    if (vehicleType !== undefined) updateData.vehicle_type = vehicleType;
    if (licenseNumber !== undefined) updateData.license_number = licenseNumber;
    if (aadharNumber !== undefined) updateData.aadhar_number = aadharNumber;
    if (panNumber !== undefined) updateData.pan_number = panNumber;
    if (addressLine1 !== undefined) updateData.address_line1 = addressLine1;
    if (addressLine2 !== undefined) updateData.address_line2 = addressLine2;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (servicePincodes !== undefined) updateData.service_pincodes = servicePincodes;
    if (status !== undefined) {
      updateData.status = status;
      // Store rejection reason when rejecting a partner
      if (status === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }
    }
    if (availabilityStatus !== undefined) updateData.availability_status = availabilityStatus;

    // Update delivery partner
    const { data: updatedPartner, error } = await supabase
      .from('spf_delivery_partners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Delivery Partner API] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update delivery partner', details: error.message },
        { status: 500 }
      );
    }

    // Insert status history if status changed
    if (status !== undefined && status !== existingPartner.status) {
      const historyNote = note || rejectionReason || null;
      await insertStatusHistory(id, existingPartner.status, status, historyNote, updatedBy || null, updatedByName || null);
    }

    partnerCache.clear().catch(e => console.warn('[Delivery Partners API] Cache clear failed:', e));
    return NextResponse.json({
      success: true,
      partner: updatedPartner,
      message: 'Delivery partner updated successfully',
    });
  } catch (error: any) {
    console.error('[Delivery Partner API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update delivery partner',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate delivery partner (Admin Only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try to read optional body for audit info
    let updatedBy: string | null = null;
    let updatedByName: string | null = null;
    let note: string | null = null;
    try {
      const body = await request.json();
      updatedBy = body.updatedBy || null;
      updatedByName = body.updatedByName || null;
      note = body.note || null;
    } catch {
      // Body is optional for DELETE
    }

    // Check if partner exists and get current status
    const { data: existingPartner } = await supabase
      .from('spf_delivery_partners')
      .select('id, status')
      .eq('id', id)
      .maybeSingle();

    if (!existingPartner) {
      return NextResponse.json(
        { error: 'Delivery partner not found' },
        { status: 404 }
      );
    }

    // Soft delete - set status to inactive
    const { error } = await supabase
      .from('spf_delivery_partners')
      .update({
        status: 'inactive',
        availability_status: 'offline',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('[Delivery Partner API] Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to deactivate delivery partner', details: error.message },
        { status: 500 }
      );
    }

    // Insert status history
    await insertStatusHistory(id, existingPartner.status, 'inactive', note, updatedBy, updatedByName);

    partnerCache.clear().catch(e => console.warn('[Delivery Partners API] Cache clear failed:', e));
    return NextResponse.json({
      success: true,
      message: 'Delivery partner deactivated successfully',
    });
  } catch (error: any) {
    console.error('[Delivery Partner API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to deactivate delivery partner',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
