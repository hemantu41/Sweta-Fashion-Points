import { supabaseAdmin } from '@/lib/supabase-admin';

export interface NavbarPromo {
  label: string;
  title: string;
  link: string;
}

export interface NavbarL3Item {
  id: string;
  name: string;
  slug: string;
}

export interface NavbarL2Group {
  id: string;
  name: string;
  slug: string;
  items: NavbarL3Item[];
}

export interface NavbarCategory {
  id: string;
  name: string;
  slug: string;
  navbar_icon: string | null;
  navbar_promo: NavbarPromo | null;
  groups: NavbarL2Group[];
}

export async function getNavbarCategories(): Promise<NavbarCategory[]> {
  const { data, error } = await supabaseAdmin
    .from('spf_categories')
    .select('id, name, slug, parent_id, level, show_in_navbar, navbar_sort_order, navbar_icon, navbar_promo, display_order, is_active')
    .eq('is_active', true)
    .order('navbar_sort_order', { ascending: true })
    .order('display_order', { ascending: true });

  if (error || !data) return [];

  // L1 categories with show_in_navbar = true
  const l1List = data.filter(c => !c.parent_id && c.show_in_navbar);
  const l1Ids = new Set(l1List.map(c => c.id));

  // L2 = direct children of L1 (group column headings in the mega menu)
  const l2List = data.filter(c => c.parent_id && l1Ids.has(c.parent_id));
  const l2Ids = new Set(l2List.map(c => c.id));

  // L3 = children of L2 (clickable links inside each column)
  const l3List = data.filter(c => c.parent_id && l2Ids.has(c.parent_id));

  return l1List.map(l1 => ({
    id: l1.id,
    name: l1.name,
    slug: l1.slug,
    navbar_icon: l1.navbar_icon ?? null,
    navbar_promo: l1.navbar_promo ?? null,
    groups: l2List
      .filter(l2 => l2.parent_id === l1.id)
      .map(l2 => ({
        id: l2.id,
        name: l2.name,
        slug: l2.slug,
        items: l3List
          .filter(l3 => l3.parent_id === l2.id)
          .map(l3 => ({
            id: l3.id,
            name: l3.name,
            slug: l3.slug,
          })),
      })),
  }));
}
