import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    // Validation
    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/Mobile and password are required' },
        { status: 400 }
      );
    }

    // Find user by email or mobile
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, mobile, password')
      .or(`email.eq.${identifier.toLowerCase()},mobile.eq.${identifier}`)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid email/mobile or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email/mobile or password' },
        { status: 401 }
      );
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: 'Login successful', user: userWithoutPassword },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
