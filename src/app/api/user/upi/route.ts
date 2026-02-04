import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Save UPI ID to spf_users
export async function POST(request: NextRequest) {
  try {
    const { userId, upiId } = await request.json();

    if (!userId || !upiId) {
      return NextResponse.json(
        { error: 'User ID and UPI ID are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('spf_users')
      .update({ upi_id: upiId })
      .eq('id', userId);

    if (error) {
      console.error('UPI save error:', error);
      return NextResponse.json(
        { error: 'Failed to save UPI ID' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'UPI ID saved successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('UPI save error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
