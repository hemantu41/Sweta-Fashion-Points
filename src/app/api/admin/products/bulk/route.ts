/**
 * POST /api/admin/products/bulk
 * Accepts an array of validated CSV rows (from BulkUploadPanel) and inserts
 * them into spf_productdetails. Admin-created products are immediately approved
 * and live — no QC queue.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, products } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'products array is required and must not be empty' }, { status: 400 });
    }

    // Verify admin
    const { data: user } = await supabaseAdmin
      .from('spf_users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Map CSV rows → DB rows
    const now = new Date().toISOString();
    const batchId = Date.now();
    const rows = products.map((p: Record<string, string>, idx: number) => {
      const images = [p.ImageURL1, p.ImageURL2, p.ImageURL3, p.ImageURL4, p.ImageURL5]
        .filter(Boolean);
      const sizes = p.Sizes
        ? p.Sizes.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];
      const colors = p.Colors
        ? p.Colors.split(',').map((c: string) => ({ name: c.trim() })).filter((c: { name: string }) => c.name)
        : [];

      return {
        product_id: `ADMIN-BULK-${batchId}-${String(idx).padStart(3, '0')}-${Math.random().toString(36).slice(2, 4).toUpperCase()}`,
        name: p.Name,
        category: p.Category,
        sub_category: p.SubCategory || null,
        price: Number(p.SellingPrice),
        original_price: Number(p.MRP),
        description: p.Description || null,
        sizes,
        colors,
        main_image: images[0] || null,
        images,
        stock_quantity: 0,
        is_active: true,
        is_new_arrival: false,
        is_best_seller: false,
        approval_status: 'approved',
        created_by: userId,
        updated_by: userId,
        created_at: now,
        updated_at: now,
      };
    });

    const { data, error } = await supabaseAdmin
      .from('spf_productdetails')
      .insert(rows)
      .select('id');

    if (error) throw error;

    return NextResponse.json({ inserted: data?.length ?? 0 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[admin/products/bulk]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
