import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/sellers/register - Register as a seller
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      businessName,
      businessNameHi,
      gstin,
      pan,
      businessEmail,
      businessPhone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      bankAccountName,
      bankAccountNumber,
      bankIfsc,
      bankName,
      documents,
    } = body;

    // Validate required fields
    if (!userId || !businessName || !businessEmail || !businessPhone) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, businessName, businessEmail, businessPhone' },
        { status: 400 }
      );
    }

    // Validate business address fields
    if (!addressLine1 || !city || !state || !pincode) {
      return NextResponse.json(
        { error: 'Missing required address fields: addressLine1, city, state, pincode' },
        { status: 400 }
      );
    }

    // Validate bank details
    if (!bankAccountName || !bankAccountNumber || !bankIfsc || !bankName) {
      return NextResponse.json(
        { error: 'Missing required bank details: bankAccountName, bankAccountNumber, bankIfsc, bankName' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('spf_users')
      .select('id, user_type')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already a seller
    const { data: existingSeller } = await supabase
      .from('spf_sellers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle() to return null instead of error when not found

    if (existingSeller) {
      return NextResponse.json(
        { error: 'User is already registered as a seller' },
        { status: 400 }
      );
    }

    // Create seller record with verification status
    const { data: newSeller, error: sellerError } = await supabase
      .from('spf_sellers')
      .insert({
        user_id: userId,
        business_name: businessName,
        business_name_hi: businessNameHi,
        gstin: gstin,
        pan: pan,
        business_email: businessEmail,
        business_phone: businessPhone,
        address_line1: addressLine1,
        address_line2: addressLine2,
        city: city,
        state: state,
        pincode: pincode,
        bank_account_name: bankAccountName,
        bank_account_number: bankAccountNumber,
        bank_ifsc: bankIfsc,
        bank_name: bankName,
        documents: documents || [],
        status: 'pending', // Requires admin approval
        email_verified: true, // Set to true since OTP was verified before registration
        phone_verified: true, // Set to true since OTP was verified before registration
        email_verified_at: new Date().toISOString(),
        phone_verified_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sellerError) {
      console.error('Seller registration error:', sellerError);
      return NextResponse.json(
        { error: 'Failed to register as seller', details: sellerError.message },
        { status: 500 }
      );
    }

    // Update user type to 'seller'
    await supabase
      .from('spf_users')
      .update({ user_type: 'seller' })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      message: 'Seller registration submitted successfully. Awaiting admin approval.',
      seller: {
        id: newSeller.id,
        businessName: newSeller.business_name,
        status: newSeller.status,
        createdAt: newSeller.created_at,
      },
    });
  } catch (error) {
    console.error('Seller registration error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
