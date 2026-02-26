import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch user profile from spf_users
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

    // Fetch profile from spf_users table
    const { data: profile, error } = await supabase
      .from('spf_users')
      .select('id, name, email, mobile, location, gender, date_of_birth, citizenship, profile_photo')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// POST - Update user profile in spf_users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      mobile,
      location,
      gender,
      date_of_birth,
      citizenship,
      profile_photo,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Build update object with only non-empty values
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (mobile) updateData.mobile = mobile;
    if (location !== undefined) updateData.location = location;
    if (gender !== undefined) updateData.gender = gender || null;
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth || null;
    if (citizenship) updateData.citizenship = citizenship;
    if (profile_photo !== undefined) updateData.profile_photo = profile_photo;

    // Update profile in spf_users table
    const { data, error } = await supabase
      .from('spf_users')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Profile save error:', error);
      return NextResponse.json(
        { error: `Failed to save profile: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'User not found. Please log out and log back in.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Profile saved successfully', profile: data[0] },
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
