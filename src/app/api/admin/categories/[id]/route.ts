import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { invalidateCategoryCache } from '@/lib/categoryCache';

async function resolveUniqueSlug(base: string, excludeId: string): Promise<string> {
  let candidate = base;
  let suffix = 2;
  while (true) {
    const { data } = await supabaseAdmin
      .from('spf_categories')
      .select('id')
      .eq('slug', candidate)
      .neq('id', excludeId)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Only include fields that were explicitly sent — avoids overwriting with undefined/null
    const update: Record<string, unknown> = {};
    if (body.name !== undefined)          update.name          = body.name;
    if (body.name_hindi !== undefined)    update.name_hindi    = body.name_hindi;
    if (body.icon !== undefined)          update.icon          = body.icon;
    if (body.display_order !== undefined) update.display_order = body.display_order;
    if (body.is_active !== undefined)     update.is_active     = body.is_active;
    if (body.is_occasion !== undefined)   update.is_occasion   = body.is_occasion;

    // Resolve slug uniqueness (excluding this category's own id)
    if (body.slug !== undefined) {
      update.slug = await resolveUniqueSlug(body.slug, id);
    }

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

    invalidateCategoryCache().catch(() => {});
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    const message = err?.message || 'Failed to update category';
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

    invalidateCategoryCache().catch(() => {});
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete category';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
