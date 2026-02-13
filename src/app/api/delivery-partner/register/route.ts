import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST - Register as delivery partner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      email,
      mobile,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      aadharNumber,
      panNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      servicePincodes, // Array of pincodes
    } = body;

    // Validate required fields
    if (!userId || !name || !mobile || !vehicleType || !vehicleNumber || !licenseNumber || !aadharNumber || !panNumber || !addressLine1 || !pincode) {
      return NextResponse.json(
        { error: 'Please provide all required fields' },
        { status: 400 }
      );
    }

    // Check if user already registered as delivery partner
    const { data: existingUser } = await supabase
      .from('spf_users')
      .select('is_delivery_partner, delivery_partner_id')
      .eq('id', userId)
      .single();

    // If user is marked as delivery partner, verify the record actually exists and check status
    if (existingUser?.is_delivery_partner && existingUser?.delivery_partner_id) {
      const { data: partnerRecord } = await supabase
        .from('spf_delivery_partners')
        .select('id, status')
        .eq('id', existingUser.delivery_partner_id)
        .single();

      if (partnerRecord) {
        // If partner is inactive or suspended, they cannot re-register
        if (partnerRecord.status === 'inactive' || partnerRecord.status === 'suspended') {
          return NextResponse.json(
            { error: 'Your delivery partner account has been deactivated. You cannot register with this mobile number or DL number. Please contact support for assistance.' },
            { status: 403 }
          );
        }

        // If partner is already active or pending approval, prevent duplicate registration
        if (partnerRecord.status === 'active' || partnerRecord.status === 'pending_approval') {
          return NextResponse.json(
            { error: 'You are already registered as a delivery partner' },
            { status: 400 }
          );
        }

        // If rejected, delete the old record and allow re-registration
        if (partnerRecord.status === 'rejected') {
          await supabase
            .from('spf_delivery_partners')
            .delete()
            .eq('id', existingUser.delivery_partner_id);

          // Reset user flags
          await supabase
            .from('spf_users')
            .update({
              is_delivery_partner: false,
              delivery_partner_id: null,
              delivery_partner_status: null,
            })
            .eq('id', userId);
        }
      } else {
        // Data inconsistency: user marked as partner but no record exists
        // Reset the user flags so they can register again
        await supabase
          .from('spf_users')
          .update({
            is_delivery_partner: false,
            delivery_partner_id: null,
            delivery_partner_status: null,
          })
          .eq('id', userId);
      }
    }

    // Check if mobile number already exists
    const { data: existingPartner } = await supabase
      .from('spf_delivery_partners')
      .select('id')
      .eq('mobile', mobile)
      .single();

    if (existingPartner) {
      return NextResponse.json(
        { error: 'This mobile number is already registered' },
        { status: 400 }
      );
    }

    // Create delivery partner record
    const { data: partner, error: partnerError } = await supabase
      .from('spf_delivery_partners')
      .insert([
        {
          name,
          mobile,
          email,
          vehicle_type: vehicleType,
          vehicle_number: vehicleNumber,
          license_number: licenseNumber,
          aadhar_number: aadharNumber,
          pan_number: panNumber,
          address_line1: addressLine1,
          address_line2: addressLine2,
          city,
          state,
          pincode,
          service_pincodes: servicePincodes || [],
          status: 'pending_approval', // Requires admin approval
          availability_status: 'offline', // Initially offline
          created_by: userId,
        },
      ])
      .select()
      .single();

    if (partnerError) {
      console.error('[Delivery Partner Registration] Error creating partner:', partnerError);
      return NextResponse.json(
        { error: 'Failed to create delivery partner record', details: partnerError.message },
        { status: 500 }
      );
    }

    // Link user account to delivery partner
    // Note: Ensure the columns (is_delivery_partner, delivery_partner_id, delivery_partner_status)
    // exist in spf_users table. They should be added via database migration.
    const { error: linkError } = await supabase
      .from('spf_users')
      .update({
        is_delivery_partner: true,
        delivery_partner_id: partner.id,
        delivery_partner_status: 'pending_approval',
      })
      .eq('id', userId);

    if (linkError) {
      console.error('[Delivery Partner Registration] Error linking user:', linkError);
      // Still consider registration successful, admin can link manually
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful! Your application will be reviewed within 24-48 hours.',
        partner: {
          id: partner.id,
          name: partner.name,
          status: partner.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Delivery Partner Registration] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to register as delivery partner',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
