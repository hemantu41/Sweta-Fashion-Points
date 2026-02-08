import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/admin/make-admin - Make a user an admin
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Update the user to be an admin
    const { data, error } = await supabase
      .from('spf_users')
      .update({
        is_admin: true,
        admin_created_at: new Date().toISOString()
      })
      .eq('email', email.toLowerCase())
      .select();

    if (error) {
      console.error('Error making user admin:', error);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User is now an admin',
      user: {
        id: data[0].id,
        name: data[0].name,
        email: data[0].email,
        isAdmin: data[0].is_admin
      }
    });
  } catch (error) {
    console.error('Make admin error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
