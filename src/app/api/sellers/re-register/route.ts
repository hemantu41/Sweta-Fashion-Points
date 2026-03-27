import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST /api/sellers/re-register - Allow rejected seller to re-register
// Does NOT delete the old record; the register API will update it instead.
export async function POST(request: NextRequest) {
  try {
    const { userId, sellerId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Build query — prefer sellerId if provided, fallback to userId
    let query = supabaseAdmin
      .from('spf_sellers')
      .select('id, status, user_id');

    if (sellerId) {
      query = query.eq('id', sellerId);
    } else {
      query = query.eq('user_id', userId);
    }

    const { data: seller, error: fetchError } = await query.maybeSingle();

    console.log('[Re-register API] Lookup:', { userId, sellerId, seller, fetchError });

    if (fetchError) {
      console.error('[Re-register API] Fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to look up seller record' }, { status: 500 });
    }

    if (!seller) {
      return NextResponse.json({ error: 'Seller record not found' }, { status: 404 });
    }

    // Verify the seller belongs to this user
    if (seller.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only allow re-registration for rejected sellers
    if (seller.status !== 'rejected') {
      return NextResponse.json(
        { error: 'Only rejected applications can be re-submitted' },
        { status: 403 }
      );
    }

    // Don't delete — the register API will update the existing record.
    // Just return success so the frontend can redirect to the registration form.
    return NextResponse.json({ success: true, message: 'You can now register again with updated details.' });
  } catch (error) {
    console.error('Re-register error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
