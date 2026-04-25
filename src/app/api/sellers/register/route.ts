import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Helper: check for duplicate credentials across all sellers except the current user
async function checkDuplicates(
  userId: string,
  businessPhone: string,
  businessEmail: string,
  pan: string,
  gstin: string
): Promise<string | null> {
  // Check each field individually for a clear error message
  const checks: { field: string; column: string; value: string }[] = [];

  if (businessPhone) checks.push({ field: 'Phone number', column: 'business_phone', value: businessPhone });
  if (businessEmail) checks.push({ field: 'Email', column: 'business_email', value: businessEmail });
  if (pan) checks.push({ field: 'PAN number', column: 'pan', value: pan });
  if (gstin) checks.push({ field: 'GST number', column: 'gstin', value: gstin });

  for (const { field, column, value } of checks) {
    const { data } = await supabaseAdmin
      .from('spf_sellers')
      .select('id, user_id, status')
      .eq(column, value)
      .neq('user_id', userId)
      .limit(1);

    if (data && data.length > 0) {
      return `${field} "${value}" is already registered with another seller account. Each seller must use unique credentials.`;
    }
  }

  return null; // No duplicates
}

// POST /api/sellers/register - Register as a seller (or re-register after rejection)
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
      latitude,
      longitude,
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

    // ── Duplicate credential check ──────────────────────────────────────────
    // Check phone, email, PAN, GST against ALL sellers except the current user.
    // This blocks someone from creating multiple accounts with the same data,
    // but allows a rejected seller to re-register (their own record is excluded).
    const duplicateError = await checkDuplicates(userId, businessPhone, businessEmail, pan, gstin);
    if (duplicateError) {
      return NextResponse.json({ error: duplicateError }, { status: 409 });
    }

    // ── Check for existing seller record ────────────────────────────────────
    const { data: existingSeller } = await supabase
      .from('spf_sellers')
      .select('id, status')
      .eq('user_id', userId)
      .maybeSingle();

    const sellerPayload = {
      user_id: userId,
      business_name: businessName,
      business_name_hi: businessNameHi || '',
      gstin: gstin || '',
      pan: pan || '',
      business_email: businessEmail,
      business_phone: businessPhone,
      address_line1: addressLine1,
      address_line2: addressLine2 || '',
      city,
      state,
      pincode,
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
      bank_account_name: bankAccountName,
      bank_account_number: bankAccountNumber,
      bank_ifsc: bankIfsc,
      bank_name: bankName,
      documents: documents || [],
      status: 'pending',
      is_active: false,
      email_verified: true,
      phone_verified: true,
      email_verified_at: new Date().toISOString(),
      phone_verified_at: new Date().toISOString(),
      // Clear any old rejection/suspension data on re-registration
      rejection_reason: null,
      suspension_reason: null,
      reactivation_request: null,
      reactivation_requested_at: null,
      approved_by: null,
      approved_at: null,
    };

    let resultSeller;

    if (existingSeller && existingSeller.status === 'rejected') {
      // ── Re-registration: UPDATE the existing rejected record ────────────
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('spf_sellers')
        .update(sellerPayload)
        .eq('id', existingSeller.id)
        .select()
        .single();

      if (updateError) {
        console.error('Seller re-registration error:', updateError);
        return NextResponse.json(
          { error: 'Failed to re-register as seller', details: updateError.message },
          { status: 500 }
        );
      }
      resultSeller = updated;
    } else if (existingSeller) {
      // ── Already registered (pending/approved/suspended) — block ─────────
      return NextResponse.json(
        { error: 'User is already registered as a seller' },
        { status: 400 }
      );
    } else {
      // ── New registration: INSERT ───────────────────────────────────────
      const { data: newSeller, error: sellerError } = await supabase
        .from('spf_sellers')
        .insert(sellerPayload)
        .select()
        .single();

      if (sellerError) {
        console.error('Seller registration error:', sellerError);
        return NextResponse.json(
          { error: 'Failed to register as seller', details: sellerError.message },
          { status: 500 }
        );
      }
      resultSeller = newSeller;
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
        id: resultSeller.id,
        businessName: resultSeller.business_name,
        status: resultSeller.status,
        createdAt: resultSeller.created_at,
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
