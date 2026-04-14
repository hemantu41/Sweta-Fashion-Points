import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { invalidateCategoryCache } from '@/lib/categoryCache';

async function applyUpdate(
  request: NextRequest,
  id: string,
): Promise<NextResponse> {
  const body = await request.json();

  // Only include fields that were explicitly sent — avoids overwriting with undefined/null
  const update: Record<string, unknown> = {};
  // Standard fields
  if (body.name !== undefined)              update.name              = body.name;
  if (body.name_hindi !== undefined)        update.name_hindi        = body.name_hindi;
  if (body.slug !== undefined)              update.slug              = body.slug;
  if (body.icon !== undefined)              update.icon              = body.icon;
  if (body.display_order !== undefined)     update.display_order     = body.display_order;
  if (body.is_active !== undefined)         update.is_active         = body.is_active;
  if (body.is_occasion !== undefined)       update.is_occasion       = body.is_occasion;
  // Navbar fields
  if (body.show_in_navbar !== undefined)    update.show_in_navbar    = body.show_in_navbar;
  if (body.navbar_sort_order !== undefined) update.navbar_sort_order = body.navbar_sort_order;
  if (body.navbar_icon !== undefined)       update.navbar_icon       = body.navbar_icon;
  if (body.navbar_promo !== undefined)      update.navbar_promo      = body.navbar_promo;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('spf_categories')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  if (!data) return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });

  await invalidateCategoryCache();
  return NextResponse.json({ success: true, data });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return applyUpdate(request, id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update category';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return applyUpdate(request, id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update category';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('spf_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await invalidateCategoryCache();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete category';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
