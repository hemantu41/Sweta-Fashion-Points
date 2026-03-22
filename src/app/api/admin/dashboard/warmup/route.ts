import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { migrateAdminDataToCache } from '@/lib/adminCache';

// POST /api/admin/dashboard/warmup
// Called on admin login — migrates all admin data from Supabase to Redis.
// Fire-and-forget: returns immediately, migration runs in background.

export async function POST(request: NextRequest) {
  try {
    const { adminUserId } = await request.json();

    if (!adminUserId) {
      return NextResponse.json({ error: 'adminUserId required' }, { status: 400 });
    }

    // Verify admin
    const { data: user } = await supabaseAdmin
      .from('spf_users')
      .select('id, is_admin')
      .eq('id', adminUserId)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fire-and-forget: don't await — return immediately
    migrateAdminDataToCache().catch(err =>
      console.error('[AdminWarmup] Background migration error:', err)
    );

    return NextResponse.json({
      success: true,
      message: 'Admin cache warmup initiated — data will be available in Redis shortly',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[AdminWarmup] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
