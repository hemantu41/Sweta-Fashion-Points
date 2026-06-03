import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, mobile, location, address, pincode, password } = body;

    // Required fields
    if (!name || !pincode || !password) {
      return NextResponse.json(
        { error: 'Name, pincode and password are required' },
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

    // Validate mobile only if provided
    if (mobile && !/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number' },
        { status: 400 }
      );
    }

    // Check for duplicate email or mobile (only for provided values)
    const orFilters: string[] = [];
    if (email) orFilters.push(`email.eq.${email.toLowerCase()}`);
    if (mobile) orFilters.push(`mobile.eq.${mobile}`);

    if (orFilters.length > 0) {
      const { data: existingUser } = await supabase
        .from('spf_users')
        .select('id')
        .or(orFilters.join(','))
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email or mobile already exists' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into spf_users table
    const { data, error } = await supabase
      .from('spf_users')
      .insert([
        {
          name:        name.trim(),
          email:       email        ? email.toLowerCase().trim()  : null,
          mobile:      mobile       ? mobile.trim()               : null,
          location:    location     ? location.trim()             : null,
          address:     address      ? address.trim()              : null,
          pincode:     pincode.trim(),
          password:    hashedPassword,
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

    // Send welcome email (non-blocking)
    if (data.email) {
      void sendEmail({
        to: data.email,
        subject: 'Welcome to Insta Fashion Points!',
        html: `
          <div style="font-family:'DM Sans',Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <div style="text-align:center;margin-bottom:28px;">
              <h1 style="color:#5B1A3A;margin:0;font-size:22px;">Insta Fashion Points</h1>
              <p style="color:#888;margin-top:6px;font-size:13px;">Your Fashion Destination</p>
            </div>
            <div style="background:#f8f8f8;padding:28px;border-radius:12px;">
              <h2 style="color:#5B1A3A;margin:0 0 16px;font-size:20px;">Welcome, ${data.name}!</h2>
              <p style="color:#555;font-size:15px;line-height:1.7;margin-bottom:16px;">
                Your account has been created successfully on <strong>Insta Fashion Points</strong>.
                You can now explore our latest fashion collections, place orders, and enjoy a seamless
                shopping experience.
              </p>
              <div style="background:#fff;border:1px solid rgba(91,26,58,0.12);border-radius:10px;
                          padding:16px 20px;margin-bottom:20px;">
                <p style="margin:0 0 8px;font-size:13px;color:#888;font-weight:600;">YOUR ACCOUNT DETAILS</p>
                <p style="margin:0 0 6px;font-size:14px;color:#333;"><strong>Name:</strong> ${data.name}</p>
                <p style="margin:0 0 6px;font-size:14px;color:#333;"><strong>Email:</strong> ${data.email}</p>
                ${data.mobile ? `<p style="margin:0;font-size:14px;color:#333;"><strong>Mobile:</strong> +91 ${data.mobile}</p>` : ''}
              </div>
              <div style="text-align:center;margin:24px 0;">
                <a href="https://www.instafashionpoints.com"
                  style="background:#5B1A3A;color:white;padding:14px 36px;border-radius:50px;
                         text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
                  Start Shopping
                </a>
              </div>
              <p style="color:#888;font-size:13px;line-height:1.6;margin:0;">
                If you did not create this account, please contact us immediately at
                <a href="mailto:support@instafashionpoints.com" style="color:#5B1A3A;">
                  support@instafashionpoints.com
                </a>
              </p>
            </div>
            <p style="color:#aaa;font-size:11px;text-align:center;margin-top:24px;">
              © Insta Fashion Points · support@instafashionpoints.com
            </p>
          </div>
        `,
      });
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
