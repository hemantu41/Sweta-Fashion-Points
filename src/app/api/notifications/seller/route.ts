import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/notifications/seller?sellerId=xxx&limit=30
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get('sellerId');
  const limit = parseInt(searchParams.get('limit') || '30');
  const type = searchParams.get('type'); // 'order'|'qc'|'payment'|'alert'

  if (!sellerId) {
    return NextResponse.json({ error: 'sellerId is required' }, { status: 400 });
  }

  try {
    let query = supabaseAdmin
      .from('spf_notifications')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) query = query.eq('type', type);

    const { data, error } = await query;

    if (error) {
      // Table may not exist yet — return empty list gracefully
      console.warn('[Notifications] Query error (table may not exist):', error.message);
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const unreadCount = (data || []).filter(n => !n.is_read).length;
    return NextResponse.json({ notifications: data || [], unreadCount });
  } catch (err: any) {
    console.error('[Notifications GET] Error:', err);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

// PUT /api/notifications/seller — mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const { sellerId, ids, markAll } = await request.json();
    if (!sellerId) return NextResponse.json({ error: 'sellerId is required' }, { status: 400 });

    let query = supabaseAdmin
      .from('spf_notifications')
      .update({ is_read: true })
      .eq('seller_id', sellerId);

    if (!markAll && ids?.length) {
      query = query.in('id', ids);
    }

    const { error } = await query;

    if (error) {
      console.warn('[Notifications PUT] Error:', error.message);
      return NextResponse.json({ success: false });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Notifications PUT] Error:', err);
    return NextResponse.json({ success: false });
  }
}
