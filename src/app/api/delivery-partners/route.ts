import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - List all delivery partners (with filters)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const availabilityStatus = searchParams.get('availabilityStatus');
    const city = searchParams.get('city');
    const pincode = searchParams.get('pincode');

    let query = supabase
      .from('spf_delivery_partners')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (availabilityStatus) {
      query = query.eq('availability_status', availabilityStatus);
    }
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }
    if (pincode) {
      // Check if pincode exists in service_pincodes JSONB array
      query = query.contains('service_pincodes', [pincode]);
    }

    const { data: partners, error } = await query;

    if (error) {
      console.error('[Delivery Partners API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch delivery partners', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      partners: partners || [],
    });
  } catch (error: any) {
    console.error('[Delivery Partners API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch delivery partners',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}

// POST - Register new delivery partner (Admin Only)
export async function POST(request: NextRequest) {
  try {
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
      servicePincodes, // Array of pincodes
      status,
      createdBy, // Admin user ID
      passwordHash, // Optional if partner needs app access
    } = body;

    // Validate required fields
    if (!name || !mobile) {
      return NextResponse.json(
        { error: 'Name and mobile are required' },
        { status: 400 }
      );
    }

    // Validate mobile format
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
      return NextResponse.json(
        { error: 'Invalid mobile number format. Must be 10 digits.' },
        { status: 400 }
      );
    }

    // Check if mobile already exists
    const { data: existingPartner } = await supabase
      .from('spf_delivery_partners')
      .select('id')
      .eq('mobile', mobile)
      .maybeSingle();

    if (existingPartner) {
      return NextResponse.json(
        { error: 'A delivery partner with this mobile number already exists' },
        { status: 409 }
      );
    }

    // Check if email already exists (if provided)
    if (email) {
      const { data: existingEmail } = await supabase
        .from('spf_delivery_partners')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (existingEmail) {
        return NextResponse.json(
          { error: 'A delivery partner with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Insert new delivery partner
    const { data: newPartner, error } = await supabase
      .from('spf_delivery_partners')
      .insert([
        {
          name,
          email: email ? email.toLowerCase() : null,
          mobile,
          vehicle_number: vehicleNumber || null,
          vehicle_type: vehicleType || null,
          license_number: licenseNumber || null,
          aadhar_number: aadharNumber || null,
          pan_number: panNumber || null,
          address_line1: addressLine1 || null,
          address_line2: addressLine2 || null,
          city: city || null,
          state: state || null,
          pincode: pincode || null,
          service_pincodes: servicePincodes || [],
          status: status || 'pending_approval',
          availability_status: 'offline',
          password_hash: passwordHash || null,
          created_by: createdBy || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[Delivery Partners API] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create delivery partner', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      partner: newPartner,
      message: 'Delivery partner registered successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Delivery Partners API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create delivery partner',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
