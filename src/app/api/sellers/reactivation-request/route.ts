import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sellerCache } from '@/lib/cache';

// POST /api/sellers/reactivation-request
// Seller submits a reactivation request explaining why they should be reinstated.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, message } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Verify the seller exists and is suspended
    const { data: seller, error: sellerError } = await supabase
      .from('spf_sellers')
      .select('id, status')
      .eq('user_id', userId)
      .maybeSingle();

    if (sellerError || !seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    if (seller.status !== 'suspended') {
      return NextResponse.json(
        { error: 'Reactivation requests can only be submitted by suspended sellers' },
        { status: 400 }
      );
    }

    // Save request to seller record
    const { error: updateError } = await supabase
      .from('spf_sellers')
      .update({
        reactivation_request: message.trim(),
        reactivation_requested_at: new Date().toISOString(),
      })
      .eq('id', seller.id);

    if (updateError) {
      console.error('[Reactivation Request] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
    }

    // Clear seller list cache so admin sees the request immediately
    sellerCache.clear().catch(e => console.warn('[Sellers API] Cache clear failed:', e));

    return NextResponse.json({
      success: true,
      message: 'Reactivation request submitted. Admin will review it shortly.',
    });
  } catch (error) {
    console.error('[Reactivation Request] Error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
