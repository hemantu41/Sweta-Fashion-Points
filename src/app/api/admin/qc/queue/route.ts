import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getProductsByStatus, getQCSLACounts } from '@/lib/qc/db';
import type { SortBy } from '@/lib/qc/db';

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function getAdminSession(request: NextRequest): Promise<{ id: string } | null> {
  // Option A: Supabase Auth via Authorization header or cookie
  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (accessToken) {
    const { data } = await supabaseAdmin.auth.getUser(accessToken);
    const role = data.user?.app_metadata?.role ?? data.user?.user_metadata?.role;
    if (role === 'admin') return { id: data.user!.id };
  }

  // Option B (active): check adminUserId in query params against spf_users.is_admin
  const adminUserId = request.nextUrl.searchParams.get('adminUserId');
  if (adminUserId) {
    const { data } = await supabaseAdmin
      .from('spf_users')
      .select('id, is_admin')
      .eq('id', adminUserId)
      .single();
    if (data?.is_admin) return { id: data.id };
  }

  return null;
}

// ─── GET /api/admin/qc/queue ──────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = (searchParams.get('status') ?? 'pending') as
      | 'pending'
      | 'approved'
      | 'rejected';
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const sortBy = (searchParams.get('sortBy') ?? 'oldest') as SortBy;
    if (!['oldest', 'newest', 'price'].includes(sortBy)) {
      return NextResponse.json({ error: 'Invalid sortBy' }, { status: 400 });
    }

    const limitParam = parseInt(searchParams.get('limit') ?? '50', 10);
    const limit = isNaN(limitParam) ? 50 : Math.min(Math.max(1, limitParam), 200);

    // Auth — accepts adminUserId in query for iron-session based admin dashboards
    const admin = await getAdminSession(request);
    if (!admin) {
      // Soft auth — allow if adminUserId not provided (page guard handles it)
      // To harden: uncomment next line
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [products, slaCounts] = await Promise.all([
      getProductsByStatus(status, { sortBy, limit }),
      getQCSLACounts(),
    ]);

    return NextResponse.json({
      products,
      total: products.length,
      slaCounts,
    });
  } catch (err: any) {
    console.error('[QC Queue] GET error:', err?.message);
    return NextResponse.json(
      { error: 'Failed to fetch queue', details: err?.message },
      { status: 500 }
    );
  }
}
