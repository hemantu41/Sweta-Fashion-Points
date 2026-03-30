'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';

import CategoryHeader from './_components/CategoryHeader';
import SortBar        from './_components/SortBar';
import ProductCard    from './_components/ProductCard';
import { FilterSidebar, FilterDrawer, DEFAULT_FILTERS } from './_components/Filters';
import type { FilterState } from './_components/Filters';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryNode {
  id: string;
  name: string;
  name_hindi?: string;
  slug: string;
  parent_id?: string | null;
  level: number;
  icon?: string;
  product_count?: number;
  children?: CategoryNode[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  mainImage?: string;
  images?: string[];
  sizes?: string[];
  fabric?: string;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  seller?: { businessName: string; businessNameHi?: string; city?: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findInTree(
  nodes: CategoryNode[],
  slug: string,
  ancestors: CategoryNode[] = [],
): { node: CategoryNode; breadcrumb: CategoryNode[] } | null {
  for (const node of nodes) {
    if (node.slug === slug) return { node, breadcrumb: [...ancestors, node] };
    if (node.children?.length) {
      const found = findInTree(node.children, slug, [...ancestors, node]);
      if (found) return found;
    }
  }
  return null;
}

function applyFilters(products: Product[], f: FilterState): Product[] {
  return products.filter(p => {
    if (f.minPrice    !== null && p.price < f.minPrice)                                    return false;
    if (f.maxPrice    !== null && p.price > f.maxPrice)                                    return false;
    if (f.sizes.length       > 0 && !f.sizes.some(s => p.sizes?.includes(s)))             return false;
    if (f.fabrics.length     > 0 && (!p.fabric || !f.fabrics.includes(p.fabric)))         return false;
    if (f.cities.length      > 0 && (!p.seller?.city || !f.cities.includes(p.seller.city))) return false;
    if (f.minDiscount !== null) {
      const disc = p.originalPrice && p.originalPrice > p.price
        ? ((p.originalPrice - p.price) / p.originalPrice) * 100 : 0;
      if (disc < f.minDiscount) return false;
    }
    return true;
  });
}

function sortProducts(products: Product[], by: string): Product[] {
  const c = [...products];
  switch (by) {
    case 'price_low':  return c.sort((a, b) => a.price - b.price);
    case 'price_high': return c.sort((a, b) => b.price - a.price);
    case 'discount':
      return c.sort((a, b) => {
        const da = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0;
        const db = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0;
        return db - da;
      });
    case 'popular':
      return c; // Would need real view/order counts; keep insertion order for now
    default: return c; // 'newest' — API already orders by created_at desc
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 24;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CategoryPage() {
  const { slug }       = useParams<{ slug: string }>();
  const router         = useRouter();
  const searchParams   = useSearchParams();

  // ── Parse URL filter state ──
  const sortBy      = searchParams.get('sort')      || 'newest';
  const pageParam   = parseInt(searchParams.get('page') || '1');
  const minPrice    = searchParams.get('price_min')  ? parseInt(searchParams.get('price_min')!)  : null;
  const maxPrice    = searchParams.get('price_max')  ? parseInt(searchParams.get('price_max')!)  : null;
  const sizes       = searchParams.get('sizes')?.split(',').filter(Boolean)   ?? [];
  const fabrics     = searchParams.get('fabrics')?.split(',').filter(Boolean) ?? [];
  const minRating   = searchParams.get('rating')     ? parseFloat(searchParams.get('rating')!)   : null;
  const cities      = searchParams.get('cities')?.split(',').filter(Boolean)  ?? [];
  const minDiscount = searchParams.get('discount')   ? parseInt(searchParams.get('discount')!)   : null;

  const filters: FilterState = { minPrice, maxPrice, sizes, fabrics, minRating, cities, minDiscount };

  // ── Component state ──
  const [tree,            setTree]            = useState<CategoryNode[]>([]);
  const [category,        setCategory]        = useState<CategoryNode | null>(null);
  const [breadcrumb,      setBreadcrumb]      = useState<CategoryNode[]>([]);
  const [childCategories, setChildCategories] = useState<CategoryNode[]>([]);
  const [products,        setProducts]        = useState<Product[]>([]);
  const [treeLoading,     setTreeLoading]     = useState(true);
  const [prodsLoading,    setProdsLoading]    = useState(false);
  const [notFound,        setNotFound]        = useState(false);
  const [drawerOpen,      setDrawerOpen]      = useState(false);

  // ── 1. Fetch full category tree (server-cached, cheap) ──
  useEffect(() => {
    fetch('/api/categories?tree=true')
      .then(r => r.json())
      .then(d => { if (d.success) setTree(d.data || []); })
      .catch(() => {})
      .finally(() => setTreeLoading(false));
  }, []);

  // ── 2. Resolve category + breadcrumb from tree ──
  useEffect(() => {
    if (treeLoading || !slug) return;
    const result = findInTree(tree, slug as string);
    if (!result) { setNotFound(true); return; }
    setNotFound(false);
    setCategory(result.node);
    setBreadcrumb(result.breadcrumb);
    setChildCategories(result.node.children ?? []);
  }, [tree, treeLoading, slug]);

  // ── 3. Fetch products for this category ──
  const fetchProducts = useCallback(async (cat: CategoryNode) => {
    setProdsLoading(true);
    try {
      const param = cat.level === 1
        ? `category=${encodeURIComponent(cat.id)}`
        : cat.level === 2
          ? `subCategory=${encodeURIComponent(cat.id)}`
          : `subCategory=${encodeURIComponent(cat.parent_id ?? cat.id)}`; // L3 → show L2 products

      const res  = await fetch(`/api/products?${param}`, { cache: 'no-store' });
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch {/* silent */}
    finally { setProdsLoading(false); }
  }, []);

  useEffect(() => {
    if (category) fetchProducts(category);
  }, [category, fetchProducts]);

  // ── URL update helpers ──
  const updateFilters = useCallback((patch: Partial<FilterState & { sort?: string; page?: number }>) => {
    const p = new URLSearchParams(window.location.search);

    const setOrDel = (key: string, val: string | null) => {
      if (val != null && val !== '') p.set(key, val); else p.delete(key);
    };

    if (!('page' in patch)) p.delete('page'); // reset page on any filter change

    if ('sort'        in patch) setOrDel('sort',      patch.sort      ?? null);
    if ('page'        in patch) setOrDel('page',      patch.page != null ? String(patch.page) : null);
    if ('minPrice'    in patch) setOrDel('price_min', patch.minPrice  != null ? String(patch.minPrice)    : null);
    if ('maxPrice'    in patch) setOrDel('price_max', patch.maxPrice  != null ? String(patch.maxPrice)    : null);
    if ('sizes'       in patch) setOrDel('sizes',     patch.sizes?.join(',')   || null);
    if ('fabrics'     in patch) setOrDel('fabrics',   patch.fabrics?.join(',') || null);
    if ('minRating'   in patch) setOrDel('rating',    patch.minRating != null ? String(patch.minRating)   : null);
    if ('cities'      in patch) setOrDel('cities',    patch.cities?.join(',')  || null);
    if ('minDiscount' in patch) setOrDel('discount',  patch.minDiscount != null ? String(patch.minDiscount) : null);

    router.push(`/category/${slug}?${p.toString()}`, { scroll: false });
  }, [router, slug]);

  const clearFilters = useCallback(() => {
    const p = new URLSearchParams();
    const s = searchParams.get('sort');
    if (s) p.set('sort', s);
    router.push(`/category/${slug}?${p.toString()}`, { scroll: false });
  }, [router, slug, searchParams]);

  // ── Derived values ──
  const filtered    = useMemo(() => applyFilters(products, filters),    [products, filters]);  // eslint-disable-line
  const sorted      = useMemo(() => sortProducts(filtered, sortBy),     [filtered, sortBy]);
  const totalPages  = Math.ceil(sorted.length / PAGE_SIZE);
  const page        = Math.max(1, Math.min(pageParam, totalPages || 1));
  const paginated   = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const availableFabrics = useMemo(
    () => [...new Set(products.map(p => p.fabric).filter((f): f is string => !!f))],
    [products],
  );
  const availableCities = useMemo(
    () => [...new Set(products.map(p => p.seller?.city).filter((c): c is string => !!c))],
    [products],
  );

  const isLoading = treeLoading || prodsLoading;

  // ─── Not found ───────────────────────────────────────────────────────────────
  if (!treeLoading && notFound) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-5"
        style={{ background: '#FAFAFA', fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}
      >
        <div className="text-center max-w-md">
          <div className="text-[72px] mb-4">🔍</div>
          <h1
            className="text-[44px] font-extrabold mb-2"
            style={{ fontFamily: 'var(--font-playfair, Playfair Display, serif)', color: '#5B1A3A' }}
          >
            404
          </h1>
          <h2
            className="text-[20px] font-semibold mb-2"
            style={{ fontFamily: 'var(--font-playfair, Playfair Display, serif)', color: '#5B1A3A' }}
          >
            Category Not Found
          </h2>
          <p className="text-gray-400 text-sm mb-2">The category you're looking for doesn't exist.</p>
          <p className="text-sm italic mb-6" style={{ color: '#C49A3C' }}>
            आप जो कैटेगरी ढूंढ रहे हैं वह मौजूद नहीं है।
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/"
              className="px-7 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}
            >
              Back to Home
            </Link>
          </div>
          <div className="mt-8">
            <p className="text-gray-300 text-xs mb-3">Browse popular categories</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {['women', 'men', 'kids', 'accessories', 'occasion'].map(s => (
                <Link key={s} href={`/category/${s}`}
                  className="px-4 py-1.5 rounded-full border text-[12px] font-medium capitalize transition-colors"
                  style={{ borderColor: '#E5E7EB', color: '#5B1A3A' }}
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main layout ─────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen pb-20 md:pb-0"
      style={{ background: '#FAFAFA', fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5">
        <div className="flex gap-6 items-start">

          {/* ── Filter Sidebar (desktop) ── */}
          <FilterSidebar
            filters={filters}
            onChange={updateFilters}
            onClear={clearFilters}
            availableFabrics={availableFabrics}
            availableCities={availableCities}
          />

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">

            {/* Category header */}
            <CategoryHeader
              breadcrumb={breadcrumb}
              category={category}
              totalProducts={products.length}
              filteredTotal={sorted.length}
              currentPage={page}
              pageSize={PAGE_SIZE}
            />

            {/* Subcategory chips */}
            {!treeLoading && childCategories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
                <Link
                  href={`/category/${slug}`}
                  className="flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold text-white"
                  style={{ background: '#5B1A3A' }}
                >
                  All {category?.name}
                </Link>
                {childCategories.map(child => (
                  <Link
                    key={child.id}
                    href={`/category/${child.slug}`}
                    className="flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-medium border transition-colors"
                    style={{ borderColor: '#E5E7EB', color: '#374151', background: '#fff' }}
                  >
                    {child.icon && <span className="mr-1">{child.icon}</span>}
                    {child.name}
                    {(child.product_count ?? 0) > 0 && (
                      <span className="ml-1 text-[10px]" style={{ color: '#C49A3C' }}>
                        ({child.product_count})
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {/* Sort bar */}
            <SortBar
              sort={sortBy}
              onSortChange={s => updateFilters({ sort: s })}
              filteredTotal={sorted.length}
              currentPage={page}
              pageSize={PAGE_SIZE}
            />

            {/* ── Loading skeletons ── */}
            {isLoading && (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                    <div
                      className="w-full"
                      style={{
                        aspectRatio: '3/4',
                        backgroundImage: 'linear-gradient(90deg,#f0eaed 25%,#FAF7F8 50%,#f0eaed 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite',
                      }}
                    />
                    <div className="p-3 space-y-2">
                      <div className="h-3 w-4/5 bg-[#f0eaed] rounded" />
                      <div className="h-3 w-3/5 bg-[#f0eaed] rounded" />
                      <div className="h-4 w-2/5 bg-[#f0eaed] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Empty state ── */}
            {!isLoading && paginated.length === 0 && (
              <div
                className="text-center py-20 rounded-2xl border"
                style={{ background: '#fff', borderColor: 'rgba(196,154,60,0.1)' }}
              >
                <div className="text-[56px] mb-4">🛍️</div>
                <h2
                  className="text-[20px] font-bold mb-2"
                  style={{ fontFamily: 'var(--font-playfair, Playfair Display, serif)', color: '#5B1A3A' }}
                >
                  {sorted.length === 0 && products.length > 0 ? 'No matches for these filters' : 'No Products Yet'}
                </h2>
                <p className="text-gray-400 text-sm mb-1">
                  {sorted.length === 0 && products.length > 0
                    ? 'Try clearing some filters to see more results.'
                    : "This category doesn't have any products listed yet."}
                </p>
                <p className="text-sm italic mb-6" style={{ color: '#C49A3C' }}>
                  {sorted.length === 0 && products.length > 0
                    ? 'फ़िल्टर हटाकर और प्रोडक्ट देखें।'
                    : 'इस कैटेगरी में अभी कोई प्रोडक्ट नहीं है।'}
                </p>
                {sorted.length === 0 && products.length > 0 ? (
                  <button
                    onClick={clearFilters}
                    className="px-7 py-3 rounded-xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}
                  >
                    Clear All Filters
                  </button>
                ) : (
                  <Link
                    href="/"
                    className="inline-block px-7 py-3 rounded-xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}
                  >
                    Browse Other Categories
                  </Link>
                )}
              </div>
            )}

            {/* ── Product grid ── */}
            {!isLoading && paginated.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {paginated.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* ── Pagination ── */}
            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                {page > 1 && (
                  <button
                    onClick={() => updateFilters({ page: page - 1 })}
                    className="px-5 py-2 rounded-xl border text-sm font-semibold transition-colors"
                    style={{ borderColor: '#5B1A3A', color: '#5B1A3A', background: '#fff' }}
                  >
                    ← Prev
                  </button>
                )}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pn: number;
                  if (totalPages <= 5)             pn = i + 1;
                  else if (page <= 3)              pn = i + 1;
                  else if (page >= totalPages - 2) pn = totalPages - 4 + i;
                  else                             pn = page - 2 + i;
                  const active = pn === page;
                  return (
                    <button
                      key={pn}
                      onClick={() => updateFilters({ page: pn })}
                      className="w-9 h-9 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background:  active ? '#5B1A3A' : '#fff',
                        color:       active ? '#fff'    : '#6B7280',
                        fontWeight:  active ? 700       : 500,
                        boxShadow:   active ? '0 4px 12px rgba(91,26,58,0.2)' : '0 1px 3px rgba(0,0,0,0.07)',
                        border:      active ? 'none' : '1px solid #E5E7EB',
                      }}
                    >
                      {pn}
                    </button>
                  );
                })}
                {page < totalPages && (
                  <button
                    onClick={() => updateFilters({ page: page + 1 })}
                    className="px-5 py-2 rounded-xl border-none text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)', boxShadow: '0 4px 12px rgba(91,26,58,0.2)' }}
                  >
                    Next →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApply={() => setDrawerOpen(false)}
        filters={filters}
        onChange={updateFilters}
        onClear={clearFilters}
        availableFabrics={availableFabrics}
        availableCities={availableCities}
      />

      {/* ── Mobile sticky bottom bar ── */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 flex z-40">
        <button
          onClick={() => {
            const next = sortBy === 'newest' ? 'price_low' : sortBy === 'price_low' ? 'price_high' : 'newest';
            updateFilters({ sort: next });
          }}
          className="flex-1 py-3 text-[13px] font-semibold flex items-center justify-center gap-2 text-gray-700"
        >
          <ArrowUpDown size={15} /> Sort
        </button>
        <div className="w-px bg-gray-200" />
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 py-3 text-[13px] font-semibold flex items-center justify-center gap-2"
          style={{ color: '#5B1A3A' }}
        >
          <SlidersHorizontal size={15} /> Filters
          {(sizes.length + fabrics.length + cities.length + (minPrice || maxPrice ? 1 : 0) + (minDiscount ? 1 : 0)) > 0 && (
            <span
              className="w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
              style={{ background: '#5B1A3A' }}
            >
              {sizes.length + fabrics.length + cities.length + (minPrice || maxPrice ? 1 : 0) + (minDiscount ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>
    </div>
  );
}
