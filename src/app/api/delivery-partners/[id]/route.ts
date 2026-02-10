import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Get single delivery partner details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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
      updatedBy, // Admin user ID
    } = body;

    // Check if partner exists
    const { data: existingPartner } = await supabase
      .from('spf_delivery_partners')
      .select('id')
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
    if (status !== undefined) updateData.status = status;
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

// DELETE - Deactivate/suspend delivery partner (Admin Only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if partner exists
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
