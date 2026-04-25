'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useCategories, type CategoryNode } from '@/hooks/useCategories';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  productId: string;
  name: string;
  nameHi?: string;
  category: string;
  subCategory?: string;
  l1CategoryId?: string | null;
  l2CategoryId?: string | null;
  l3CategoryId?: string | null;
  price: number;
  originalPrice?: number;
  description?: string;
  fabric?: string;
  fit?: string;
  collar?: string;
  pattern?: string;
  occasion?: string;
  mainImage?: string;
  images: string[];
  colors: string[];
  sizes: string[];
  stockQuantity: number;
  isNewArrival: boolean;
  isBestSeller: boolean;
}

// ─── Image URL helper ─────────────────────────────────────────────────────────
// Images may be stored as Cloudinary public IDs (e.g. "insta-fashion-points/xyz")
// or as full https:// URLs. Normalise to a full URL before passing to <Image>.
const CLOUD = 'https://res.cloudinary.com/duoxrodmv/image/upload';
function toImageUrl(src: string | undefined | null): string {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  return `${CLOUD}/${src}`;
}

// ─── Deterministic mock rating seeded from product id ─────────────────────────

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h);
}
function mockRating(id: string)      { return +(3.5 + (hashId(id) % 20) / 10).toFixed(1); }
function mockReviewCount(id: string) { return 50 + (hashId(id + 'r') % 950); }

// ─── Tiny SVG helper ──────────────────────────────────────────────────────────

function Svg({
  d, size = 16, fill = 'none', stroke = 'currentColor', sw = 1.8,
}: {
  d: string; size?: number; fill?: string; stroke?: string; sw?: number;
}) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={fill} stroke={stroke} strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const I = {
  chevron: 'M9 18l6-6-6-6',
  heart:   'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  star:    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  refresh: 'M1 4v6h6 M3.51 15a9 9 0 102.13-9.36L1 10',
  mapPin:  'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z',
  shield:  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  home:    'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  clock:   'M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z M12 6v6l4 2',
  check:   'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  bag:     'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0',
  zap:     'M13 10V3L4 14h7v7l9-11h-7z',
};

// ─── Brand constants ──────────────────────────────────────────────────────────

const C = {
  maroon:     '#5B1A3A',
  maroonPale: '#F5EDF2',
  gold:       '#C49A3C',
  goldPale:   '#FDF5E4',
  cream:      '#FAF8F5',
  text:       '#1A1714',
  muted:      '#6B6560',
  border:     '#E8E0E4',
  subtle:     '#F0EAE6',
  green:      '#1D9E75',
  red:        '#DC2626',
};

// ─── Breadcrumb builder ───────────────────────────────────────────────────────
// Walks the category tree to find nodes by ID, returning ordered path entries.
function findNodeById(nodes: CategoryNode[], id: string): CategoryNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const found = findNodeById(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const params    = useParams();
  const rawId     = params?.id;
  const productId = Array.isArray(rawId) ? rawId[0] : rawId ?? '';
  const router    = useRouter();

  const { addToCart } = useCart();
  const { tree } = useCategories();

  const [product,  setProduct]  = useState<Product | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Gallery
  const [activeThumb, setActiveThumb] = useState(0);

  // Interactions
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity,     setQuantity]     = useState(1);
  const [wishlisted,   setWishlisted]   = useState(false);

  // Add-to-cart feedback
  const [cartMsg, setCartMsg] = useState('');

  // Price info popover
  const [priceInfoOpen, setPriceInfoOpen] = useState(false);
  const priceInfoRef = useRef<HTMLDivElement>(null);

  // Close price popover on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (priceInfoRef.current && !priceInfoRef.current.contains(e.target as Node)) {
        setPriceInfoOpen(false);
      }
    }
    if (priceInfoOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [priceInfoOpen]);

  // Pincode
  const [pincode,       setPincode]       = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [pincodeMsg,    setPincodeMsg]    = useState('');

  // ── Fetch product ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!productId) return;
    async function load() {
      try {
        const res = await fetch(`/api/products/${productId}`, { cache: 'no-store' });
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error('fetch failed');
        const json = await res.json();
        setProduct(json.product);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  // ── Pincode check ──────────────────────────────────────────────────────────
  async function checkPincode() {
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeStatus('error');
      setPincodeMsg('Please enter a valid 6-digit pincode.');
      return;
    }
    setPincodeStatus('checking');
    setPincodeMsg('');
    try {
      await new Promise(r => setTimeout(r, 700));
      setPincodeStatus('ok');
      setPincodeMsg(`Delivery available to ${pincode} · Estimated 4–7 business days.`);
    } catch {
      setPincodeStatus('error');
      setPincodeMsg('Unable to check delivery. Please try again.');
    }
  }

  // ── Add to cart ────────────────────────────────────────────────────────────
  function handleAddToCart() {
    if (!product) return;
    addToCart(product as any, selectedSize || undefined);
    setCartMsg('Added to cart!');
    setTimeout(() => setCartMsg(''), 2500);
  }

  // ── Buy Now — add to cart then go straight to checkout ───────────────────
  function handleBuyNow() {
    if (!product) return;
    addToCart(product as any, selectedSize || undefined);
    router.push('/checkout');
  }

  // ── Breadcrumb: resolve L1 → L2 → L3 from category tree ───────────────────
  const breadcrumb = useMemo(() => {
    const crumbs: { name: string; slug: string }[] = [];
    if (!product || tree.length === 0) return crumbs;
    const l1 = product.l1CategoryId ? findNodeById(tree, product.l1CategoryId) : null;
    const l2 = product.l2CategoryId ? findNodeById(tree, product.l2CategoryId) : null;
    const l3 = product.l3CategoryId ? findNodeById(tree, product.l3CategoryId) : null;
    if (l1) crumbs.push({ name: l1.name, slug: l1.slug });
    if (l2) crumbs.push({ name: l2.name, slug: l2.slug });
    if (l3) crumbs.push({ name: l3.name, slug: l3.slug });
    // Fallback: if no IDs, use raw string fields
    if (crumbs.length === 0 && product.category) {
      crumbs.push({ name: product.category, slug: product.category.toLowerCase().replace(/\s+/g, '-') });
      if (product.subCategory) crumbs.push({ name: product.subCategory, slug: product.subCategory.toLowerCase().replace(/\s+/g, '-') });
    }
    return crumbs;
  }, [product, tree]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const allImages    = product ? [product.mainImage, ...product.images].filter(Boolean) as string[] : [];
  const currentImage = allImages[activeThumb] ?? null;
  const discount     = product && (product.originalPrice ?? 0) > product.price
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : null;
  const maxQty       = product ? Math.min(8, Math.max(1, product.stockQuantity)) : 8;
  const lowStock     = product ? product.stockQuantity > 0 && product.stockQuantity <= 10 : false;
  const rating       = product ? mockRating(product.id) : 4.2;
  const reviewCount  = product ? mockReviewCount(product.id) : 284;
  const positivePct  = Math.round((rating / 5) * 100);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '60vh', background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="ifp-spin" style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${C.maroon}`, borderTopColor: 'transparent', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 13, color: C.muted }}>Loading product…</p>
        </div>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (notFound || !product) {
    return (
      <div style={{ minHeight: '60vh', background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '0 24px' }}>
          <p style={{ fontSize: 48, margin: '0 0 16px' }}></p>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 22, color: C.maroon, margin: '0 0 8px' }}>
            Product not found
          </h1>
          <p style={{ fontSize: 14, color: C.muted, margin: '0 0 24px' }}>
            This product may no longer be available.
          </p>
          <Link href="/" style={{ fontSize: 14, color: C.maroon, fontWeight: 600, textDecoration: 'underline' }}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const thumbs = allImages.slice(0, 5);
  const OOS    = new Set(['XS']); // XS shown as out-of-stock for demo

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.cream, minHeight: '100vh', fontFamily: 'var(--font-lato, system-ui, sans-serif)' }}>

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <nav style={{ background: '#fff', borderBottom: `0.5px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', fontSize: 12, color: C.muted }}>
            <Link href="/" style={{ color: C.muted, textDecoration: 'none' }}>Home</Link>
            {breadcrumb.map(crumb => (
              <span key={crumb.slug} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Svg d={I.chevron} size={11} />
                <Link href={`/category/${crumb.slug}`} style={{ color: C.muted, textDecoration: 'none' }}>
                  {crumb.name}
                </Link>
              </span>
            ))}
            <Svg d={I.chevron} size={11} />
            <span style={{ color: C.maroon, fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {product.name}
            </span>
          </div>
        </div>
      </nav>

      {/* ── Main section ────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px 32px' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* ── LEFT: Image Gallery ──────────────────────────────────────────── */}
          <div>

            {/* Desktop: thumbnail strip left + main image right */}
            <div className="hidden md:flex" style={{ gap: 10, alignItems: 'flex-start' }}>

              {/* Thumbnail strip */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                {thumbs.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveThumb(i)}
                    style={{
                      width: 64, height: 74, borderRadius: 8, overflow: 'hidden',
                      padding: 0, cursor: 'pointer', flexShrink: 0, background: C.cream,
                      border: i === activeThumb ? `1.5px solid ${C.maroon}` : `1.5px solid ${C.border}`,
                    }}
                  >
                    <Image
                      src={toImageUrl(img)} alt={`View ${i + 1}`}
                      width={64} height={74}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  </button>
                ))}
              </div>

              {/* Main image */}
              <div style={{ flex: 1, position: 'relative', height: 480, borderRadius: 12, overflow: 'hidden', background: C.cream }}>
                {discount && (
                  <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
                    <span style={{ background: C.maroon, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>
                      {discount}% OFF
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setWishlisted(v => !v)}
                  style={{
                    position: 'absolute', top: 12, right: 12, zIndex: 2,
                    width: 36, height: 36, borderRadius: '50%',
                    background: '#fff', border: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  }}
                >
                  <svg width={18} height={18} viewBox="0 0 24 24"
                    fill={wishlisted ? '#e11d48' : 'none'}
                    stroke={wishlisted ? '#e11d48' : '#9E9892'}
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d={I.heart} />
                  </svg>
                </button>
                {currentImage ? (
                  <Image
                    src={toImageUrl(currentImage)} alt={product.name}
                    fill style={{ objectFit: 'contain' }}
                    sizes="(max-width:768px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 72, opacity: 0.25 }}></span>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile: main image on top, horizontal thumbnails below */}
            <div className="md:hidden">
              <div style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 12, overflow: 'hidden', background: C.cream, marginBottom: 10 }}>
                {discount && (
                  <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
                    <span style={{ background: C.maroon, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>
                      {discount}% OFF
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setWishlisted(v => !v)}
                  style={{
                    position: 'absolute', top: 12, right: 12, zIndex: 2,
                    width: 36, height: 36, borderRadius: '50%',
                    background: '#fff', border: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <svg width={18} height={18} viewBox="0 0 24 24"
                    fill={wishlisted ? '#e11d48' : 'none'}
                    stroke={wishlisted ? '#e11d48' : '#9E9892'}
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d={I.heart} />
                  </svg>
                </button>
                {currentImage ? (
                  <Image src={toImageUrl(currentImage)} alt={product.name} fill style={{ objectFit: 'contain' }} sizes="100vw" priority />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 72, opacity: 0.25 }}></span>
                  </div>
                )}
              </div>
              {/* Horizontal thumbnail strip */}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {thumbs.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveThumb(i)}
                    style={{
                      width: 64, height: 74, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                      padding: 0, cursor: 'pointer', background: C.cream,
                      border: i === activeThumb ? `1.5px solid ${C.maroon}` : `1.5px solid ${C.border}`,
                    }}
                  >
                    <Image src={toImageUrl(img)} alt={`View ${i + 1}`} width={64} height={74} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Product Info ──────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* ── Top info card: name + rating + price ──────────────────────── */}
            <div style={{
              border: `1.5px solid ${C.border}`,
              borderRadius: 12,
              padding: '16px 18px 18px',
              background: '#fff',
              marginBottom: 16,
            }}>
              {/* Product name */}
              <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 22, fontWeight: 700, color: C.text, margin: 0, lineHeight: 1.35 }}>
                {product.name}
              </h1>

              {/* Subtitle */}
              {(product.fabric || product.fit || product.subCategory) && (
                <p style={{ fontSize: 13, color: C.muted, margin: '5px 0 0', lineHeight: 1.5 }}>
                  {[product.fabric, product.fit, product.subCategory].filter(Boolean).join(' · ')}
                </p>
              )}

              {/* Rating row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: C.green, borderRadius: 4, padding: '3px 9px' }}>
                  <Svg d={I.star} size={11} fill="#fff" stroke="none" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{rating}</span>
                </div>
                <span style={{ fontSize: 12, color: C.muted }}>{reviewCount.toLocaleString()} ratings</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 48, height: 3.5, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${positivePct}%`, height: '100%', background: C.green, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, color: C.muted }}>{positivePct}% positive</span>
                </div>
              </div>

              {/* Thin divider */}
              <div style={{ borderTop: `0.5px solid ${C.border}`, margin: '14px 0' }} />

              {/* Price row with info icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 26, fontWeight: 700, color: C.maroon, fontFamily: 'var(--font-playfair)' }}>
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {(product.originalPrice ?? 0) > product.price && (
                  <>
                    <span style={{ fontSize: 15, color: C.muted, textDecoration: 'line-through' }}>
                      ₹{product.originalPrice!.toLocaleString('en-IN')}
                    </span>
                    {discount && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', background: '#DCFCE7', padding: '3px 10px', borderRadius: 20 }}>
                        {discount}% off
                      </span>
                    )}
                  </>
                )}

                {/* (i) price info icon + popover */}
                <div ref={priceInfoRef} style={{ position: 'relative', display: 'inline-flex' }}>
                  <button
                    onClick={() => setPriceInfoOpen(v => !v)}
                    title="Price details"
                    style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: `1.5px solid ${C.muted}`, background: 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: C.muted, fontSize: 12, fontWeight: 700,
                      lineHeight: 1, padding: 0, flexShrink: 0,
                    }}
                  >
                    i
                  </button>

                  {/* Popover */}
                  {priceInfoOpen && (
                    <div style={{
                      position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#fff', border: `1px solid ${C.border}`,
                      borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      padding: '14px 16px', minWidth: 280, zIndex: 100,
                    }}>
                      {/* Arrow */}
                      <div style={{
                        position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                        width: 0, height: 0,
                        borderLeft: '7px solid transparent',
                        borderRight: '7px solid transparent',
                        borderTop: `7px solid ${C.border}`,
                      }} />
                      <div style={{
                        position: 'absolute', top: 'calc(100% - 1px)', left: '50%', transform: 'translateX(-50%)',
                        width: 0, height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '6px solid #fff',
                      }} />

                      {/* Header */}
                      <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                        Price Details
                      </p>

                      {/* Rows */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: C.muted }}>Maximum Retail Price (MRP)</span>
                          <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>
                            ₹{(product.originalPrice ?? product.price).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: C.muted }}>Product Price</span>
                          <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div style={{ borderTop: `0.5px solid ${C.border}`, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Final Price</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: C.maroon }}>
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Disclaimers */}
                      <div style={{ marginTop: 12, paddingTop: 10, borderTop: `0.5px solid ${C.border}` }}>
                        <p style={{ margin: '0 0 6px', fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
                          Prices are inclusive of all taxes.
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
                          The MRP and the Product Price has been set by the supplier. Product price may additionally include applicable charges.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: `0.5px solid ${C.border}`, margin: '0 0 16px' }} />

            {/* Size selector */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Select size</span>
                <a href="#" style={{ fontSize: 12, color: C.gold, textDecoration: 'underline', textUnderlineOffset: 2 }}>
                  Size guide
                </a>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL', 'XXL']).map(size => {
                  const oos      = OOS.has(size);
                  const selected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => !oos && setSelectedSize(s => s === size ? null : size)}
                      disabled={oos}
                      style={{
                        minWidth: 44, padding: '6px 14px', borderRadius: 20,
                        border:     selected ? `1.5px solid ${C.maroon}` : `1px solid #D1C5C0`,
                        background: selected ? C.maroonPale : '#fff',
                        color:      oos ? C.muted : selected ? C.maroon : C.text,
                        fontSize: 13, fontWeight: selected ? 600 : 400,
                        cursor:     oos ? 'not-allowed' : 'pointer',
                        opacity:    oos ? 0.35 : 1,
                        textDecoration: oos ? 'line-through' : 'none',
                        transition: 'all 0.12s',
                      }}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity + stock label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{ width: 36, height: 36, background: C.cream, border: 'none', cursor: 'pointer', fontSize: 20, color: C.maroon, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  −
                </button>
                <span style={{ width: 36, textAlign: 'center', fontSize: 14, fontWeight: 600, color: C.text, borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, lineHeight: '36px' }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                  style={{ width: 36, height: 36, background: C.cream, border: 'none', cursor: 'pointer', fontSize: 20, color: C.maroon, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  +
                </button>
              </div>
              {lowStock && (
                <span style={{ fontSize: 12, color: C.red, fontWeight: 500 }}>
                  Only {product.stockQuantity} left in stock
                </span>
              )}
            </div>

            {/* Delivery card */}
            <div style={{ background: '#F9F5F0', border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Standard delivery row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ color: C.maroon, flexShrink: 0, marginTop: 1 }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" rx="1" />
                    <path d="M16 8h4l3 3v5h-7V8z" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Standard Delivery</span>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>
                      Delivered in 4–7 business days · Enter pincode to check availability
                    </p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, background: C.goldPale, padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    FREE
                  </span>
                </div>
              </div>

              {/* Returns row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ color: C.maroon, flexShrink: 0, marginTop: 1 }}>
                  <Svg d={I.refresh} size={16} />
                </span>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>7-day easy returns & exchange</span>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>
                    Hassle-free returns and exchanges within 7 days of delivery
                  </p>
                </div>
              </div>

              {/* Pincode row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: C.muted, flexShrink: 0 }}>
                    <Svg d={I.mapPin} size={14} />
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pincode}
                    onChange={e => {
                      setPincode(e.target.value.replace(/\D/g, ''));
                      setPincodeStatus('idle');
                      setPincodeMsg('');
                    }}
                    onKeyDown={e => e.key === 'Enter' && checkPincode()}
                    placeholder="Enter pincode"
                    style={{
                      flex: 1, border: `1px solid ${C.border}`, borderRadius: 6,
                      padding: '6px 10px', fontSize: 13, outline: 'none',
                      background: '#fff', color: C.text,
                    }}
                  />
                  <button
                    onClick={checkPincode}
                    disabled={pincodeStatus === 'checking'}
                    style={{ padding: '6px 14px', border: 'none', background: 'none', color: C.maroon, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                  >
                    {pincodeStatus === 'checking' ? '…' : 'Check'}
                  </button>
                </div>
                {pincodeMsg && (
                  <p style={{ margin: 0, fontSize: 12, color: pincodeStatus === 'ok' ? '#16A34A' : C.red, paddingLeft: 22 }}>
                    {pincodeStatus === 'ok' ? ' ' : ' '}{pincodeMsg}
                  </p>
                )}
              </div>
            </div>

            {/* Cart feedback */}
            {cartMsg && (
              <div style={{ marginTop: 10, padding: '8px 14px', background: '#DCFCE7', borderRadius: 6, fontSize: 13, color: '#16A34A', fontWeight: 500 }}>
                 {cartMsg}
              </div>
            )}

            {/* CTA buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
              <button
                onClick={handleAddToCart}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: 12, borderRadius: 8,
                  border: `1.5px solid ${C.maroon}`, background: C.maroonPale,
                  color: C.maroon, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Svg d={I.bag} size={16} />
                Add to cart
              </button>
              <button
                onClick={handleBuyNow}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 12, borderRadius: 8,
                  border: 'none', background: C.maroon,
                  color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Buy Now
              </button>
            </div>

            {/* Trust highlights */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[
                { d: I.shield, text: 'Secure payments · UPI, cards, COD accepted' },
                { d: I.home,   text: '7-day easy returns & exchange' },
                { d: I.clock,  text: 'Order before 12 PM for same-day dispatch' },
              ].map(({ d, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: C.gold, flexShrink: 0 }}>
                    <Svg d={d} size={15} />
                  </span>
                  <span style={{ fontSize: 12, color: '#4A3F35' }}>{text}</span>
                </div>
              ))}
            </div>

          </div>
          {/* end product info */}
        </div>
        {/* end main grid */}
      </div>

      {/* ── Returns bar ─────────────────────────────────────────────────────── */}
      <div style={{ background: C.goldPale, borderTop: `0.5px solid #E8D89A`, borderBottom: `0.5px solid #E8D89A` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 16px' }}>
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 12 }}>
            {[
              { d: I.refresh, text: '7-day returns' },
              { d: I.check,   text: 'Free size exchange' },
              { d: I.shield,  text: '100% authentic products' },
              { d: I.zap,     text: 'Fast local delivery' },
            ].map(({ d, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Svg d={d} size={14} stroke={C.gold} />
                <span style={{ fontSize: 12, fontWeight: 500, color: '#4A3F35' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Product details + Care & wash ───────────────────────────────────── */}
      <div style={{ background: '#fff', borderTop: `0.5px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_1fr]">

            {/* Left: Product details */}
            <div className="md:pr-8">
              <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 16px' }}>
                Product details
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    { k: 'Category', v: [product.category, product.subCategory].filter(Boolean).join(' / ') || '—' },
                    { k: 'Fabric',   v: product.fabric   || '—' },
                    { k: 'Fit',      v: product.fit      || '—' },
                    { k: 'Collar',   v: product.collar   || '—' },
                    { k: 'Pattern',  v: product.pattern  || '—' },
                    { k: 'Occasion', v: product.occasion || '—' },
                  ].map(({ k, v }) => (
                    <tr key={k} style={{ borderBottom: `0.5px solid ${C.subtle}` }}>
                      <td style={{ fontSize: 13, color: C.muted, padding: '9px 0', width: '44%' }}>{k}</td>
                      <td style={{ fontSize: 13, color: C.text, fontWeight: 500, padding: '9px 0', textAlign: 'right' }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vertical divider — desktop only */}
            <div className="hidden md:block" style={{ background: C.border }} />

            {/* Right: Care & wash */}
            <div className="md:pl-8 mt-8 md:mt-0">
              <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 16px' }}>
                Care &amp; wash
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    { k: 'Wash',              v: 'Hand wash or gentle machine wash' },
                    { k: 'Dry',               v: 'Shade dry only' },
                    { k: 'Iron',              v: 'Medium heat · Do not iron on print' },
                    { k: 'Bleach',            v: 'Do not bleach' },
                    { k: 'Country of origin', v: 'India' },
                  ].map(({ k, v }) => (
                    <tr key={k} style={{ borderBottom: `0.5px solid ${C.subtle}` }}>
                      <td style={{ fontSize: 13, color: C.muted, padding: '9px 0', width: '44%' }}>{k}</td>
                      <td style={{ fontSize: 13, color: C.text, fontWeight: 500, padding: '9px 0', textAlign: 'right' }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`
        .ifp-spin { animation: ifp-spin 0.8s linear infinite; }
        @keyframes ifp-spin { to { transform: rotate(360deg); } }
      `}</style>

    </div>
  );
}
