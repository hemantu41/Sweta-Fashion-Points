import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST /api/sellers/re-register - Delete rejected seller record so user can register again
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

    // Delete the rejected seller record
    const { error: deleteError } = await supabaseAdmin
      .from('spf_sellers')
      .delete()
      .eq('id', seller.id);

    if (deleteError) {
      console.error('[Re-register API] Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to remove old application' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Old application removed. You can now register again.' });
  } catch (error) {
    console.error('Re-register error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
