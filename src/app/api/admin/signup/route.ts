import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE || 'SWETA_ADMIN_2026';

export async function POST(request: NextRequest) {
  try {
    const { name, email, mobile, password, inviteCode } = await request.json();

    // Validate invite code
    if (inviteCode !== ADMIN_INVITE_CODE) {
      return NextResponse.json(
        { error: 'Invalid admin invite code' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!name || !email || !mobile || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('spf_users')
      .select('id')
      .or(`email.eq.${email.toLowerCase()},mobile.eq.${mobile}`)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or mobile already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const { data: newUser, error: insertError } = await supabase
      .from('spf_users')
      .insert({
        name,
        email: email.toLowerCase(),
        mobile,
        password: hashedPassword,
        is_admin: true,
        admin_created_at: new Date().toISOString(),
        citizenship: 'Indian',
        is_verified: true,
      })
      .select('id, name, email, mobile, location, is_admin')
      .single();

    if (insertError) {
      console.error('Admin creation error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create admin account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Admin account created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        location: newUser.location,
        isAdmin: newUser.is_admin,
      },
    });
  } catch (error) {
    console.error('Admin signup error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
