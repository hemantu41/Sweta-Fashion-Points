import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { invalidateCategoryCache } from '@/lib/categoryCache';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, name_hindi, slug, icon, display_order, is_active, is_occasion } = body;

    const { data, error } = await supabaseAdmin
      .from('spf_categories')
      .update({ name, name_hindi, slug, icon, display_order, is_active, is_occasion })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });

    await invalidateCategoryCache();
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update category';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('spf_categories')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    await invalidateCategoryCache();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete category';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
