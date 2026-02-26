import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, mobile, location, password } = body;

    // Validation
    if (!name || !email || !mobile || !location || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists in spf_users
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

    // Insert user into spf_users table
    const { data, error } = await supabase
      .from('spf_users')
      .insert([
        {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          mobile: mobile.trim(),
          location: location.trim(),
          password: hashedPassword,
          citizenship: 'Indian',
          is_verified: true,
        },
      ])
      .select('id, name, email, mobile, location')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Account created successfully', user: data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
