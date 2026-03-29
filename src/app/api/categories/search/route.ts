import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('spf_categories')
      .select('id,name,name_hindi,slug,parent_id,level,icon')
      .eq('is_active', true)
      .or(`name.ilike.%${q}%,name_hindi.ilike.%${q}%`)
      .order('level', { ascending: true })
      .limit(15);

    if (error) throw error;

    // For each match, resolve parent chain to get l1_id and l2_id
    const enriched = await Promise.all(
      (data || []).map(async (cat) => {
        let l1Id: string | null = null;
        let l2Id: string | null = null;
        let breadcrumb = cat.name;

        if (cat.level === 1) {
          l1Id = cat.id;
          breadcrumb = cat.name;
        } else if (cat.level === 2) {
          l2Id = cat.id;
          l1Id = cat.parent_id;
          if (l1Id) {
            const { data: l1 } = await supabaseAdmin
              .from('spf_categories').select('name').eq('id', l1Id).single();
            breadcrumb = l1 ? `${l1.name} > ${cat.name}` : cat.name;
          }
        } else if (cat.level === 3) {
          l2Id = cat.parent_id;
          breadcrumb = cat.name;
          if (l2Id) {
            const { data: l2 } = await supabaseAdmin
              .from('spf_categories').select('id,name,parent_id').eq('id', l2Id).single();
            if (l2) {
              l1Id = l2.parent_id;
              breadcrumb = `${l1Id ? '' : ''}${l2.name} > ${cat.name}`;
              if (l1Id) {
                const { data: l1 } = await supabaseAdmin
                  .from('spf_categories').select('name').eq('id', l1Id).single();
                if (l1) breadcrumb = `${l1.name} > ${l2.name} > ${cat.name}`;
              }
            }
          }
        }

        return { ...cat, l1_id: l1Id, l2_id: l2Id, breadcrumb };
      })
    );

    return NextResponse.json({ success: true, data: enriched });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Search failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
