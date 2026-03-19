import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, mobile, location, address, pincode, password } = body;

    // Validation (location and address are optional)
    if (!name || !email || !mobile || !pincode || !password) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    // Validate pincode (6 digits)
    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { error: 'Pincode must be a 6-digit number' },
        { status: 400 }
      );
    }

    // Validate mobile (10-digit Indian number)
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number' },
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
          address: address.trim(),
          pincode: pincode.trim(),
          password: hashedPassword,
          citizenship: 'Indian',
          is_verified: true,
        },
      ])
      .select('id, name, email, mobile, location, address, pincode')
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
