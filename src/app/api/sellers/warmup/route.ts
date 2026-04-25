import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { migrateSellerDataToCache } from '@/lib/sellerCache';

// POST /api/sellers/warmup
// Called on seller dashboard first load — migrates all seller data from Supabase to Redis.
// Fire-and-forget: returns immediately, migration runs in background.

export async function POST(request: NextRequest) {
  try {
    const { sellerId } = await request.json();

    if (!sellerId) {
      return NextResponse.json({ error: 'sellerId required' }, { status: 400 });
    }

    // Verify seller exists and is approved
    const { data: seller } = await supabaseAdmin
      .from('spf_sellers')
      .select('id, status')
      .eq('id', sellerId)
      .single();

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    if (seller.status !== 'approved') {
      return NextResponse.json({ error: 'Seller not approved' }, { status: 403 });
    }

    // Fire-and-forget: don't await — return immediately
    migrateSellerDataToCache(sellerId).catch(err =>
      console.error('[SellerWarmup] Background migration error:', err)
    );

    return NextResponse.json({
      success: true,
      message: 'Seller cache warmup initiated — data will be available in Redis shortly',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[SellerWarmup] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
