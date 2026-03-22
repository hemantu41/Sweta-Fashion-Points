import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/session';
import { z } from 'zod';

const ResponseSchema = z.object({
  responseText: z.string().min(1, 'Response is required').max(800, 'Response must be 800 characters or less'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;

    // Auth check — seller must be logged in
    const session = await getSession();
    if (!session.isLoggedIn || !session.mobile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is a seller
    const { data: user } = await supabaseAdmin
      .from('spf_users')
      .select('id')
      .eq('mobile', session.mobile)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: seller } = await supabaseAdmin
      .from('spf_sellers')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .maybeSingle();

    if (!seller) {
      return NextResponse.json({ error: 'Seller access required' }, { status: 403 });
    }

    // Validate body
    const rawBody = await request.json();
    const parsed = ResponseSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Sanitize
    const responseText = parsed.data.responseText.replace(/<[^>]*>/g, '').replace(/[<>"'&]/g, '');

    // Check review exists and belongs to this seller
    const { data: review } = await supabaseAdmin
      .from('spf_reviews')
      .select('id, seller_id')
      .eq('id', reviewId)
      .maybeSingle();

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.seller_id !== seller.id) {
      return NextResponse.json({ error: 'This review does not belong to your store' }, { status: 403 });
    }

    // Upsert response — update if exists, create if not
    const { data: existingResponse } = await supabaseAdmin
      .from('spf_seller_responses')
      .select('id')
      .eq('review_id', reviewId)
      .maybeSingle();

    if (existingResponse) {
      const { error } = await supabaseAdmin
        .from('spf_seller_responses')
        .update({ response_text: responseText })
        .eq('id', existingResponse.id);

      if (error) {
        console.error('[Response API] Update error:', error);
        return NextResponse.json({ error: 'Failed to update response' }, { status: 500 });
      }
    } else {
      const { error } = await supabaseAdmin
        .from('spf_seller_responses')
        .insert({ review_id: reviewId, response_text: responseText });

      if (error) {
        console.error('[Response API] Insert error:', error);
        return NextResponse.json({ error: 'Failed to save response' }, { status: 500 });
      }
    }

    // Fetch updated review with response
    const { data: updatedReview } = await supabaseAdmin
      .from('spf_reviews')
      .select('*, spf_seller_responses(*)')
      .eq('id', reviewId)
      .single();

    return NextResponse.json({ success: true, review: updatedReview });
  } catch (err) {
    console.error('[Response API] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
