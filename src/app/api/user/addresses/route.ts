import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch user addresses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data: addresses, error } = await supabase
      .from('spf_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Addresses fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch addresses' },
        { status: 500 }
      );
    }

    return NextResponse.json({ addresses: addresses || [] }, { status: 200 });
  } catch (error) {
    console.error('Addresses fetch error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// POST - Create new address
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      isDefault,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // If this is set as default, remove default from other addresses
    if (isDefault) {
      await supabase
        .from('spf_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    // Check if this is the first address (make it default automatically)
    const { data: existingAddresses } = await supabase
      .from('spf_addresses')
      .select('id')
      .eq('user_id', userId);

    const shouldBeDefault = isDefault || (existingAddresses?.length === 0);

    const { data, error } = await supabase
      .from('spf_addresses')
      .insert([{
        user_id: userId,
        name,
        phone,
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
        city,
        state: state || 'Bihar',
        pincode,
        is_default: shouldBeDefault,
      }])
      .select()
      .single();

    if (error) {
      console.error('Address save error:', error);
      return NextResponse.json(
        { error: 'Failed to save address' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Address saved successfully', address: data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Address save error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// PUT - Update address (set as default)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, addressId, isDefault } = body;

    if (!userId || !addressId) {
      return NextResponse.json(
        { error: 'User ID and Address ID are required' },
        { status: 400 }
      );
    }

    // If setting as default, remove default from other addresses
    if (isDefault) {
      await supabase
        .from('spf_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);

      await supabase
        .from('spf_addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .eq('user_id', userId);
    }

    return NextResponse.json(
      { message: 'Address updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Address update error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// DELETE - Delete address
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const addressId = searchParams.get('addressId');

    if (!userId || !addressId) {
      return NextResponse.json(
        { error: 'User ID and Address ID are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('spf_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) {
      console.error('Address delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete address' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Address deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Address delete error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
