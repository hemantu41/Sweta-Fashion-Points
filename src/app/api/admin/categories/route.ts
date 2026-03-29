import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { invalidateCategoryCache } from '@/lib/categoryCache';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tree = searchParams.get('tree') === 'true';

  try {
    const { data, error } = await supabaseAdmin
      .from('spf_categories')
      .select('id,name,name_hindi,slug,parent_id,level,icon,display_order,is_active,is_occasion,product_count')
      .order('level', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) throw error;

    if (tree) {
      // Build tree from flat data
      const map = new Map<string, any>();
      const roots: any[] = [];
      (data || []).forEach(cat => map.set(cat.id, { ...cat, children: [] }));
      (data || []).forEach(cat => {
        const node = map.get(cat.id)!;
        if (cat.parent_id && map.has(cat.parent_id)) {
          map.get(cat.parent_id)!.children.push(node);
        } else if (!cat.parent_id) {
          roots.push(node);
        }
      });
      return NextResponse.json({ success: true, data: roots });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, name_hindi, slug, parent_id, level, icon, display_order, is_active, is_occasion } = body;

    if (!name || !slug || !level) {
      return NextResponse.json({ success: false, error: 'name, slug, and level are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('spf_categories')
      .insert({ name, name_hindi, slug, parent_id: parent_id || null, level, icon, display_order: display_order || 0, is_active: is_active ?? true, is_occasion: is_occasion ?? false })
      .select()
      .single();

    if (error) throw error;

    await invalidateCategoryCache();
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create category';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
