import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parsePaginationParams, createPaginationResult } from '@/lib/pagination';
import { adminOrdersCache } from '@/lib/cache';

// GET - List all orders (Admin only)
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // For now, fetch all orders

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePaginationParams(searchParams);
    const status = searchParams.get('status');

    // Check Redis cache first (30 min TTL)
    const cacheKey = `orders:${status || 'all'}:p${page}:l${limit}`;
    const cached = await adminOrdersCache.get<any>(cacheKey);
    if (cached !== null) {
      console.log(`[Admin Orders API] Cache hit: ${cacheKey}`);
      return NextResponse.json({ success: true, ...cached });
    }

    // Build query with count
    let query = supabase
      .from('spf_payment_orders')
      .select('*', { count: 'exact' });

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply pagination and ordering
    const { data: orders, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Admin Orders API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: error.message },
        { status: 500 }
      );
    }

    // Create paginated response and cache it
    const result = createPaginationResult(orders || [], count || 0, page, limit);
    await adminOrdersCache.set(cacheKey, result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[Admin Orders API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch orders',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
