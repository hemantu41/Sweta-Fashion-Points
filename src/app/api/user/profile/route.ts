import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch user profile
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

    // First get basic user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, mobile, location')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('User fetch error:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Then get extended profile from spf_users
    const { data: profileData } = await supabase
      .from('spf_users')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Merge the data
    const combinedData = {
      ...userData,
      gender: profileData?.gender || '',
      date_of_birth: profileData?.date_of_birth || '',
      citizenship: profileData?.citizenship || 'Indian',
      address_line1: profileData?.address_line1 || '',
      address_line2: profileData?.address_line2 || '',
      city: profileData?.city || '',
      state: profileData?.state || 'Bihar',
      pincode: profileData?.pincode || '',
    };

    return NextResponse.json({ profile: combinedData }, { status: 200 });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// POST - Create or update user profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      email,
      mobile,
      location,
      gender,
      date_of_birth,
      citizenship,
      address_line1,
      address_line2,
      city,
      state,
      pincode,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('spf_users')
      .select('id')
      .eq('user_id', userId)
      .single();

    const profileData = {
      user_id: userId,
      name,
      email,
      mobile,
      location,
      gender,
      date_of_birth: date_of_birth || null,
      citizenship: citizenship || 'Indian',
      address_line1,
      address_line2,
      city,
      state: state || 'Bihar',
      pincode,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existingProfile) {
      // Update existing profile
      result = await supabase
        .from('spf_users')
        .update(profileData)
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      // Create new profile
      result = await supabase
        .from('spf_users')
        .insert([profileData])
        .select()
        .single();
    }

    if (result.error) {
      console.error('Profile save error:', result.error);
      return NextResponse.json(
        { error: 'Failed to save profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Profile saved successfully', profile: result.data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile save error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
