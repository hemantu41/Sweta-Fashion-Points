import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { categoryCacheGet, categoryCacheSet } from '@/lib/categoryCache';

// DB row shape
interface DBCategory {
  id: string;
  name: string;
  name_hindi: string | null;
  slug: string;
  parent_id: string | null;
  level: number;
  icon: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  is_occasion: boolean;
  product_count: number;
}

function buildTree(flat: DBCategory[]) {
  const map = new Map<string, DBCategory & { children: any[] }>();
  const roots: any[] = [];
  flat.forEach(cat => map.set(cat.id, { ...cat, children: [] }));
  flat.forEach(cat => {
    const node = map.get(cat.id)!;
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children.push(node);
    } else if (!cat.parent_id) {
      roots.push(node);
    }
  });
  return roots;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get('parent_id') || searchParams.get('parentId');
  const level = searchParams.get('level');
  const activeOnly = searchParams.get('active') !== 'false'; // default true
  const tree = searchParams.get('tree') === 'true';
  const slug = searchParams.get('slug');

  try {
    // ── Full tree ──
    if (tree) {
      const cacheKey = 'tree';
      const cached = await categoryCacheGet<any[]>(cacheKey);
      const CDN_TREE = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' };
      if (cached) return NextResponse.json({ success: true, data: cached, source: 'cache' }, { headers: CDN_TREE });

      const { data, error } = await supabaseAdmin
        .from('spf_categories')
        .select('id,name,name_hindi,slug,parent_id,level,icon,image_url,display_order,is_active,is_occasion,product_count')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      const treeData = buildTree(data as DBCategory[]);
      await categoryCacheSet(cacheKey, treeData);
      return NextResponse.json({ success: true, data: treeData, source: 'db' }, { headers: CDN_TREE });
    }

    // ── Find by slug ──
    if (slug) {
      const { data, error } = await supabaseAdmin
        .from('spf_categories')
        .select('id,name,name_hindi,slug,parent_id,level,icon,image_url,display_order,is_active,is_occasion,product_count')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    // ── Filtered query ──
    const CDN_FILTER = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' };
    const cacheKey = `filter:${level || 'all'}:${parentId || 'root'}:${activeOnly}`;
    const cached = await categoryCacheGet<DBCategory[]>(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached, source: 'cache' }, { headers: CDN_FILTER });

    let query = supabaseAdmin
      .from('spf_categories')
      .select('id,name,name_hindi,slug,parent_id,level,icon,image_url,display_order,is_active,is_occasion,product_count')
      .order('display_order', { ascending: true });

    if (activeOnly) query = query.eq('is_active', true);
    if (level) query = query.eq('level', parseInt(level));
    if (parentId) {
      query = query.eq('parent_id', parentId);
    } else if (level === '1') {
      query = query.is('parent_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;

    await categoryCacheSet(cacheKey, data);
    return NextResponse.json({ success: true, data, source: 'db' }, { headers: CDN_FILTER });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch categories';
    console.error('[Categories API] GET error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
