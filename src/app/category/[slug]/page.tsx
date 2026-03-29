'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, SlidersHorizontal, ArrowUpDown, Home, X } from 'lucide-react';

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
  productId?: string;
  name: string;
  nameHi?: string;
  category: string;
  subCategory?: string;
  price: number;
  originalPrice?: number;
  mainImage?: string;
  images?: string[];
  fabric?: string;
  colors?: { name: string; hex: string }[];
  sizes?: string[];
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  seller?: { id: string; businessName: string; businessNameHi?: string; city?: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Walk the full category tree to find a node by slug, return it + ancestor chain */
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

/** Sort products client-side */
function sortProducts(products: Product[], sortBy: string): Product[] {
  const copy = [...products];
  switch (sortBy) {
    case 'price_low':  return copy.sort((a, b) => a.price - b.price);
    case 'price_high': return copy.sort((a, b) => b.price - a.price);
    case 'discount':
      return copy.sort((a, b) => {
        const da = a.originalPrice ? ((a.originalPrice - a.price) / a.originalPrice) : 0;
        const db = b.originalPrice ? ((b.originalPrice - b.price) / b.originalPrice) : 0;
        return db - da;
      });
    case 'newest':
    default:
      return copy; // API already returns newest first
  }
}

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest' },
  { value: 'price_low',  label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'discount',   label: 'Most Discount' },
];

const PAGE_SIZE = 24;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const sortBy    = searchParams.get('sort')  || 'newest';
  const pageParam = parseInt(searchParams.get('page') || '1');

  const [tree,           setTree]           = useState<CategoryNode[]>([]);
  const [category,       setCategory]       = useState<CategoryNode | null>(null);
  const [breadcrumb,     setBreadcrumb]     = useState<CategoryNode[]>([]);
  const [childCategories,setChildCategories]= useState<CategoryNode[]>([]);
  const [products,       setProducts]       = useState<Product[]>([]);
  const [treeLoading,    setTreeLoading]    = useState(true);
  const [productsLoading,setProductsLoading]= useState(false);
  const [notFound,       setNotFound]       = useState(false);

  // ── 1. Fetch full category tree (cached on server, cheap) ──
  useEffect(() => {
    fetch('/api/categories?tree=true')
      .then(r => r.json())
      .then(d => {
        if (d.success) setTree(d.data || []);
      })
      .catch(() => {/* silent */})
      .finally(() => setTreeLoading(false));
  }, []);

  // ── 2. Once tree is ready, resolve category + breadcrumb ──
  useEffect(() => {
    if (treeLoading || !slug) return;
    const result = findInTree(tree, slug as string);
    if (!result) { setNotFound(true); return; }

    setNotFound(false);
    setCategory(result.node);
    setBreadcrumb(result.breadcrumb);
    setChildCategories(result.node.children || []);
  }, [tree, treeLoading, slug]);

  // ── 3. Fetch products whenever the resolved category changes ──
  const fetchProducts = useCallback(async (cat: CategoryNode) => {
    setProductsLoading(true);
    try {
      let url: string;
      if (cat.level === 1) {
        // L1: products stored under this top-level category
        url = `/api/products?category=${encodeURIComponent(cat.id)}`;
      } else if (cat.level === 2) {
        // L2: products with this subcategory
        url = `/api/products?subCategory=${encodeURIComponent(cat.id)}`;
      } else {
        // L3: products don't store L3 — show parent L2 products
        // parent_id of L3 is the L2 id
        url = `/api/products?subCategory=${encodeURIComponent(cat.parent_id || cat.id)}`;
      }

      const res  = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      setProducts(data.products || []);
    } catch {/* silent */}
    finally { setProductsLoading(false); }
  }, []);

  useEffect(() => {
    if (category) fetchProducts(category);
  }, [category, fetchProducts]);

  // ── URL helpers ──
  const updateQuery = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    if (key !== 'page') params.delete('page'); // reset page on sort change
    router.push(`/category/${slug}?${params.toString()}`);
  }, [router, slug]);

  // ── Derived ──
  const sorted     = sortProducts(products, sortBy);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const page       = Math.max(1, Math.min(pageParam, totalPages || 1));
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const discountOf = (p: Product) =>
    p.originalPrice && p.originalPrice > p.price
      ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
      : 0;

  // ─── Not-found state ───────────────────────────────────────────────────────
  if (!treeLoading && notFound) {
    return (
      <div style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)', background: '#FAF7F8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>🔍</div>
          <h1 style={{ fontFamily: 'var(--font-playfair, Playfair Display, serif)', fontSize: 44, fontWeight: 800, color: '#5B1A3A', margin: '0 0 8px' }}>404</h1>
          <h2 style={{ fontFamily: 'var(--font-playfair, Playfair Display, serif)', fontSize: 22, color: '#5B1A3A', margin: '0 0 8px' }}>Category Not Found</h2>
          <p style={{ color: '#999', fontSize: 14, margin: '0 0 4px' }}>The category you're looking for doesn't exist or may have been removed.</p>
          <p style={{ color: '#C49A3C', fontSize: 13, fontStyle: 'italic', margin: '0 0 28px' }}>आप जो कैटेगरी ढूंढ रहे हैं वह मौजूद नहीं है।</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 10, background: 'linear-gradient(135deg,#5B1A3A,#7A2350)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Back to Home
            </Link>
          </div>
          <div style={{ marginTop: 32 }}>
            <p style={{ color: '#bbb', fontSize: 12, marginBottom: 12 }}>Browse popular categories</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['women', 'men', 'kids', 'accessories'].map((s) => (
                <Link key={s} href={`/category/${s}`} style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid #E8E0E4', background: '#fff', color: '#5B1A3A', fontSize: 12, fontWeight: 500, textDecoration: 'none', textTransform: 'capitalize' }}>
                  {s}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Skeleton (tree still loading or product fetch in flight) ─────────────
  const isLoading = treeLoading || productsLoading;

  // ─── Main Render ──────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)', background: '#FAF7F8', minHeight: '100vh' }}>

      {/* ── Breadcrumb ── */}
      <div style={{ background: '#fff', padding: '12px 24px', borderBottom: '1px solid rgba(196,154,60,0.1)', fontSize: 13 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#999', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Home size={12} /> Home
          </Link>
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ChevronRight size={12} color="#ccc" />
              {i === breadcrumb.length - 1 ? (
                <span style={{ color: '#5B1A3A', fontWeight: 600 }}>{crumb.name}</span>
              ) : (
                <Link href={`/category/${crumb.slug}`} style={{ color: '#777', textDecoration: 'none' }}>{crumb.name}</Link>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* ── Category Header ── */}
      <div style={{ background: 'linear-gradient(135deg,#5B1A3A 0%,#7A2350 100%)', padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {category?.icon && <span style={{ fontSize: 32, display: 'block', marginBottom: 6 }}>{category.icon}</span>}
          <h1 style={{ fontFamily: 'var(--font-playfair, Playfair Display, serif)', fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
            {treeLoading ? (
              <span style={{ display: 'inline-block', width: 180, height: 28, background: 'rgba(255,255,255,0.15)', borderRadius: 6 }} />
            ) : (category?.name || '')}
          </h1>
          {category?.name_hindi && (
            <p style={{ color: '#C49A3C', fontSize: 13, fontStyle: 'italic', margin: '0 0 6px' }}>{category.name_hindi}</p>
          )}
          {!isLoading && (
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>{products.length} products available</p>
          )}
        </div>
      </div>

      {/* ── Subcategory Chips ── */}
      {!treeLoading && childCategories.length > 0 && (
        <div style={{ background: '#fff', padding: '14px 24px', borderBottom: '1px solid rgba(196,154,60,0.08)', overflowX: 'auto' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 8, flexWrap: 'nowrap' }}>
            <Link href={`/category/${category?.slug}`} style={{ padding: '7px 16px', borderRadius: 20, background: '#5B1A3A', color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
              All {category?.name}
            </Link>
            {childCategories.map((child) => (
              <Link key={child.id} href={`/category/${child.slug}`} style={{ padding: '7px 16px', borderRadius: 20, background: '#fff', color: '#5B1A3A', border: '1px solid #E8E0E4', fontSize: 12, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {child.icon && <span style={{ marginRight: 4 }}>{child.icon}</span>}
                {child.name}
                {(child.product_count ?? 0) > 0 && (
                  <span style={{ color: '#C49A3C', marginLeft: 5, fontSize: 11 }}>({child.product_count})</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Sort / Results bar ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(196,154,60,0.06)', padding: '10px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#666' }}>
            {!isLoading && (
              <>Showing <strong style={{ color: '#5B1A3A' }}>{products.length}</strong> results</>
            )}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#aaa', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowUpDown size={12} /> Sort:
            </span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateQuery('sort', opt.value)}
                style={{
                  padding: '5px 13px', borderRadius: 18, border: sortBy === opt.value ? 'none' : '1px solid #E8E0E4',
                  background: sortBy === opt.value ? '#5B1A3A' : '#fff',
                  color: sortBy === opt.value ? '#fff' : '#666',
                  fontSize: 11, fontWeight: sortBy === opt.value ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Product Grid ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>

        {/* ─ Loading Skeleton ─ */}
        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px,1fr))', gap: 16 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(196,154,60,0.08)' }}>
                <div style={{ width: '100%', aspectRatio: '3/4', background: 'linear-gradient(90deg,#f0eaed 25%,#FAF7F8 50%,#f0eaed 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ width: '80%', height: 12, background: '#f0eaed', borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ width: '50%', height: 12, background: '#f0eaed', borderRadius: 6, marginBottom: 12 }} />
                  <div style={{ width: '40%', height: 18, background: '#f0eaed', borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─ Empty State ─ */}
        {!isLoading && paginated.length === 0 && (
          <div style={{ textAlign: 'center', padding: '72px 20px', background: '#fff', borderRadius: 16, border: '1px solid rgba(196,154,60,0.1)' }}>
            <div style={{ fontSize: 60, marginBottom: 14 }}>🛍️</div>
            <h2 style={{ fontFamily: 'var(--font-playfair, Playfair Display, serif)', fontSize: 22, color: '#5B1A3A', margin: '0 0 8px' }}>No Products Yet</h2>
            <p style={{ color: '#999', fontSize: 14, margin: '0 0 4px' }}>This category doesn't have any products listed yet.</p>
            <p style={{ color: '#C49A3C', fontSize: 13, fontStyle: 'italic', margin: '0 0 24px' }}>इस कैटेगरी में अभी कोई प्रोडक्ट नहीं है।</p>
            <Link href="/" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: 'linear-gradient(135deg,#5B1A3A,#7A2350)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Browse Other Categories
            </Link>
          </div>
        )}

        {/* ─ Product Cards ─ */}
        {!isLoading && paginated.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px,1fr))', gap: 16 }}>
            {paginated.map((product) => {
              const discount = discountOf(product);
              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(196,154,60,0.08)', boxShadow: '0 2px 10px rgba(91,26,58,0.04)', transition: 'transform 0.25s, box-shadow 0.25s', cursor: 'pointer' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 30px rgba(91,26,58,0.09)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 10px rgba(91,26,58,0.04)'; }}
                  >
                    {/* Image */}
                    <div style={{ width: '100%', aspectRatio: '3/4', background: '#f5f0ed', position: 'relative', overflow: 'hidden' }}>
                      {product.mainImage ? (
                        <img src={product.mainImage} alt={product.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: '#ddd' }}>👗</div>
                      )}
                      {/* Discount badge */}
                      {discount > 0 && (
                        <div style={{ position: 'absolute', top: 8, left: 8, background: '#C62828', color: '#fff', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                          {discount}% OFF
                        </div>
                      )}
                      {/* New arrival badge */}
                      {product.isNewArrival && (
                        <div style={{ position: 'absolute', top: 8, right: 8, background: '#5B1A3A', color: '#fff', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                          NEW
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: '12px 14px 16px' }}>
                      {/* Seller */}
                      {product.seller && (
                        <div style={{ fontSize: 10, color: '#C49A3C', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                          🏪 {product.seller.businessName}{product.seller.city ? `, ${product.seller.city}` : ''}
                        </div>
                      )}
                      {/* Name */}
                      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#333', margin: '0 0 8px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {product.name}
                      </h3>
                      {/* Price */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#5B1A3A' }}>
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span style={{ fontSize: 11, color: '#bbb', textDecoration: 'line-through' }}>
                            ₹{product.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      {/* Sizes row */}
                      {product.sizes && product.sizes.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                          {product.sizes.slice(0, 4).map((s) => (
                            <span key={s} style={{ padding: '2px 6px', border: '1px solid #E8E0E4', borderRadius: 4, fontSize: 9, color: '#888' }}>{s}</span>
                          ))}
                          {product.sizes.length > 4 && <span style={{ fontSize: 9, color: '#bbb' }}>+{product.sizes.length - 4}</span>}
                        </div>
                      )}
                      {/* Fabric */}
                      {product.fabric && (
                        <div style={{ marginTop: 6, fontSize: 10, color: '#999', background: '#FAF7F8', padding: '2px 7px', borderRadius: 8, display: 'inline-block' }}>
                          {product.fabric}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ─ Pagination ─ */}
        {!isLoading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 40, paddingBottom: 20 }}>
            {page > 1 && (
              <button onClick={() => updateQuery('page', String(page - 1))} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #5B1A3A', background: '#fff', color: '#5B1A3A', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Prev
              </button>
            )}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pn: number;
              if (totalPages <= 5)        pn = i + 1;
              else if (page <= 3)         pn = i + 1;
              else if (page >= totalPages - 2) pn = totalPages - 4 + i;
              else                        pn = page - 2 + i;
              return (
                <button key={pn} onClick={() => updateQuery('page', String(pn))} style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: page === pn ? 'linear-gradient(135deg,#5B1A3A,#7A2350)' : '#fff', color: page === pn ? '#fff' : '#666', fontWeight: page === pn ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: page === pn ? '0 4px 12px rgba(91,26,58,0.2)' : '0 1px 4px rgba(0,0,0,0.06)' }}>
                  {pn}
                </button>
              );
            })}
            {page < totalPages && (
              <button onClick={() => updateQuery('page', String(page + 1))} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#5B1A3A,#7A2350)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(91,26,58,0.2)' }}>
                Next →
              </button>
            )}
          </div>
        )}
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
