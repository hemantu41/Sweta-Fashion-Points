import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST /api/sellers/re-register - Delete rejected seller record so user can register again
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Fetch the seller record for this user
    const { data: seller, error: fetchError } = await supabaseAdmin
      .from('spf_sellers')
      .select('id, status')
      .eq('user_id', userId)
      .single();

    if (fetchError || !seller) {
      return NextResponse.json({ error: 'Seller record not found' }, { status: 404 });
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
