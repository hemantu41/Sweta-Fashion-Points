import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get logged-in partner's info
export async function GET(request: NextRequest) {
  try {
    const partnerId = request.nextUrl.searchParams.get('partnerId');

    if (!partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    const { data: partner, error } = await supabase
      .from('spf_delivery_partners')
      .select('*')
      .eq('id', partnerId)
      .single();

    if (error || !partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      partner,
    });
  } catch (error: any) {
    console.error('[Delivery Partner Me API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch partner info',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}

// PUT - Update availability status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { partnerId, availabilityStatus } = body;

    if (!partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    if (!availabilityStatus || !['available', 'busy', 'offline'].includes(availabilityStatus)) {
      return NextResponse.json(
        { error: 'Invalid availability status' },
        { status: 400 }
      );
    }

    const { data: partner, error } = await supabase
      .from('spf_delivery_partners')
      .update({
        availability_status: availabilityStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', partnerId)
      .select()
      .single();

    if (error) {
      console.error('[Delivery Partner Me API] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update availability', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      partner,
      message: 'Availability status updated successfully',
    });
  } catch (error: any) {
    console.error('[Delivery Partner Me API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update availability',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
