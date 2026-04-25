import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;

    // Get voter IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const voterIp = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';

    // Check review exists
    const { data: review } = await supabaseAdmin
      .from('spf_reviews')
      .select('id, helpful_count')
      .eq('id', reviewId)
      .maybeSingle();

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check if already voted (1 vote per IP per review)
    const { data: existingVote } = await supabaseAdmin
      .from('spf_review_helpful_votes')
      .select('id')
      .eq('review_id', reviewId)
      .eq('voter_ip', voterIp)
      .maybeSingle();

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already marked this review as helpful', helpfulCount: review.helpful_count },
        { status: 429 }
      );
    }

    // Record vote
    await supabaseAdmin
      .from('spf_review_helpful_votes')
      .insert({ review_id: reviewId, voter_ip: voterIp });

    // Increment helpful count
    const newCount = (review.helpful_count || 0) + 1;
    await supabaseAdmin
      .from('spf_reviews')
      .update({ helpful_count: newCount })
      .eq('id', reviewId);

    return NextResponse.json({ success: true, helpfulCount: newCount });
  } catch (err) {
    console.error('[Helpful API] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
