import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { invalidateCategoryCache } from '@/lib/categoryCache';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Only include fields that were explicitly sent — avoids overwriting with undefined/null
    const update: Record<string, unknown> = {};
    if (body.name !== undefined)          update.name          = body.name;
    if (body.name_hindi !== undefined)    update.name_hindi    = body.name_hindi;
    if (body.slug !== undefined)          update.slug          = body.slug;
    if (body.icon !== undefined)          update.icon          = body.icon;
    if (body.display_order !== undefined) update.display_order = body.display_order;
    if (body.is_active !== undefined)     update.is_active     = body.is_active;
    if (body.is_occasion !== undefined)   update.is_occasion   = body.is_occasion;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('spf_categories')
      .update(update)
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
