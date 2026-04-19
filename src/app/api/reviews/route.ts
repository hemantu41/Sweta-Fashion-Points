import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { z } from 'zod';
import { sellerCacheGet, sellerCacheSet, invalidateSellerKeys } from '@/lib/sellerCache';

// ─── GET /api/reviews ───────────────────────────────────────────────────────
// Public endpoint — fetch reviews with filtering + pagination

// Helper: compute stats + paginated response from a full reviews array
function buildReviewsResponse(
  all: any[],
  filter: string,
  page: number,
  limit: number,
) {
  const offset = (page - 1) * limit;

  // Filter
  let filtered = [...all];
  if (filter === 'negative') {
    filtered = filtered.filter(
      r => r.rating <= 2 && (!r.spf_seller_responses || r.spf_seller_responses.length === 0),
    );
  } else if (['1', '2', '3', '4', '5'].includes(filter)) {
    filtered = filtered.filter(r => r.rating === parseInt(filter));
  }

  // Stats (always from the full unfiltered array)
  const ratings = all.map(r => r.rating);
  const totalCount = ratings.length;
  const averageRating = totalCount > 0
    ? +(ratings.reduce((a, b) => a + b, 0) / totalCount).toFixed(1)
    : 0;
  const ratingBreakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratings.forEach(r => { ratingBreakdown[r] = (ratingBreakdown[r] || 0) + 1; });
  const pendingResponses = all.filter(
    r => r.rating <= 2 && (!r.spf_seller_responses || r.spf_seller_responses.length === 0),
  ).length;

  // Paginate + strip buyer email
  const paginated = filtered.slice(offset, offset + limit);
  const safeReviews = paginated.map(({ buyer_email, ...rest }: any) => rest);

  return { reviews: safeReviews, totalCount, filteredCount: filtered.length, averageRating, ratingBreakdown, pendingResponses, page, limit };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const filter   = searchParams.get('filter') || 'all';
    const page     = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit    = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const sellerId = searchParams.get('sellerId');

    const PRIVATE_CC = 'private, max-age=30, stale-while-revalidate=1800';

    // ── Seller query: cache-first via Redis ──────────────────────────────────
    if (sellerId) {
      // Try Redis cache
      let allSellerReviews = await sellerCacheGet<any[]>(sellerId, 'reviews');

      if (allSellerReviews === null) {
        // Cache miss — fetch ALL reviews for this seller in one query (up to 200)
        const { data } = await supabaseAdmin
          .from('spf_reviews')
          .select('*, spf_seller_responses(*)')
          .eq('seller_id', sellerId)
          .order('created_at', { ascending: false })
          .limit(200);

        allSellerReviews = data || [];
        // Populate cache for next 30 min (fire-and-forget)
        sellerCacheSet(sellerId, 'reviews', allSellerReviews).catch(() => {});
      }

      return NextResponse.json(
        buildReviewsResponse(allSellerReviews, filter, page, limit),
        { headers: { 'Cache-Control': PRIVATE_CC } },
      );
    }

    // ── Public / admin query: no cache (unfiltered cross-seller data) ────────
    const offset = (page - 1) * limit;
    let query = supabaseAdmin
      .from('spf_reviews')
      .select('*, spf_seller_responses(*)', { count: 'exact' });

    if (filter === 'negative') {
      query = query.lte('rating', 2);
    } else if (['1', '2', '3', '4', '5'].includes(filter)) {
      query = query.eq('rating', parseInt(filter));
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: reviews, error, count } = await query;

    if (error) {
      console.error('[Reviews API] GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    const { data: allReviews } = await supabaseAdmin.from('spf_reviews').select('rating');
    const ratings = (allReviews || []).map(r => r.rating);
    const totalCount = ratings.length;
    const averageRating = totalCount > 0 ? +(ratings.reduce((a, b) => a + b, 0) / totalCount).toFixed(1) : 0;
    const ratingBreakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(r => { ratingBreakdown[r] = (ratingBreakdown[r] || 0) + 1; });
    const pendingResponses = (reviews || []).filter(
      r => r.rating <= 2 && (!r.spf_seller_responses || r.spf_seller_responses.length === 0),
    ).length;
    let finalReviews = reviews || [];
    if (filter === 'negative') {
      finalReviews = finalReviews.filter(r => !r.spf_seller_responses || r.spf_seller_responses.length === 0);
    }
    const safeReviews = finalReviews.map(({ buyer_email, ...rest }) => rest);

    return NextResponse.json({ reviews: safeReviews, totalCount, filteredCount: count || 0, averageRating, ratingBreakdown, pendingResponses, page, limit });

  } catch (err) {
    console.error('[Reviews API] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST /api/reviews ──────────────────────────────────────────────────────
// Submit a new review (buyer side)

const ReviewSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(100, 'Title must be 100 characters or less'),
  body: z.string().min(1).max(1000, 'Review must be 1000 characters or less'),
  buyerName: z.string().min(1),
  buyerEmail: z.string().email(),
  productName: z.string().min(1),
  sellerId: z.string().min(1),
  productId: z.string().optional(),
  reviewToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = ReviewSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Sanitize text (basic XSS prevention)
    const sanitize = (s: string) => s.replace(/<[^>]*>/g, '').replace(/[<>"'&]/g, '');
    data.title = sanitize(data.title);
    data.body = sanitize(data.body);

    // Check for duplicate review on same order
    const { data: existing } = await supabaseAdmin
      .from('spf_reviews')
      .select('id')
      .eq('order_id', data.orderId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'A review already exists for this order' },
        { status: 409 }
      );
    }

    // Verify order exists and belongs to buyer
    let verified = false;
    const { data: order } = await supabaseAdmin
      .from('spf_payment_orders')
      .select('id, user_id, status')
      .eq('id', data.orderId)
      .maybeSingle();

    if (order) {
      // Check if buyer email matches the user who placed the order
      const { data: user } = await supabaseAdmin
        .from('spf_users')
        .select('email')
        .eq('id', order.user_id)
        .maybeSingle();

      if (user?.email?.toLowerCase() === data.buyerEmail.toLowerCase()) {
        verified = true;
      }
    }

    // Insert review
    const { data: review, error } = await supabaseAdmin
      .from('spf_reviews')
      .insert({
        order_id: data.orderId,
        seller_id: data.sellerId,
        product_id: data.productId || null,
        buyer_name: data.buyerName,
        buyer_email: data.buyerEmail,
        rating: data.rating,
        title: data.title,
        body: data.body,
        product_name: data.productName,
        verified,
        review_token: data.reviewToken || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[Reviews API] POST error:', error);
      return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
    }

    // Invalidate seller's reviews cache so dashboard sees the new review immediately
    invalidateSellerKeys(data.sellerId, 'reviews').catch(() => {});

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (err) {
    console.error('[Reviews API] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
