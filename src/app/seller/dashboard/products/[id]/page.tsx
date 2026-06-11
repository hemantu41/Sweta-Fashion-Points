'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, ArrowLeft, Edit2, Package, Tag, Ruler, Palette, Star, CheckCircle, Clock, XCircle, RefreshCw, MessageSquare } from 'lucide-react';

const CLOUD = 'https://res.cloudinary.com/duoxrodmv/image/upload';
function toImg(src: string | undefined | null): string {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  return `${CLOUD}/${src}`;
}

function fmt(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
  approved:     { label: 'Approved',     bg: '#EBF7EF', color: '#2E7D32', icon: <CheckCircle size={14} /> },
  pending:      { label: 'Pending QC',   bg: '#FEF7EA', color: '#C49A3C', icon: <Clock size={14} /> },
  under_review: { label: 'Under Review', bg: '#EBF2FB', color: '#1565C0', icon: <RefreshCw size={14} /> },
  rejected:     { label: 'Rejected',     bg: '#FDF3F3', color: '#C62828', icon: <XCircle size={14} /> },
};

interface Product {
  id: string;
  productId: string;
  name: string;
  nameHi?: string;
  category?: string;
  subCategory?: string;
  l1CategoryId?: string;
  l2CategoryId?: string;
  l3CategoryId?: string;
  description?: string;
  fabric?: string;
  price: number;
  originalPrice?: number;
  stockQuantity: number;
  sizes?: string[];
  colors?: Array<{ name: string; hex: string } | string>;
  images?: string[];
  mainImage?: string;
  isActive: boolean;
  approvalStatus?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
  seller?: { businessName?: string; city?: string; state?: string };
}

interface QcEntry {
  id: string;
  message: string;
  author_type: 'admin' | 'seller';
  author_name?: string;
  created_at: string;
  is_read: boolean;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2.5 border-b border-[#F5EDF2] last:border-0">
      <span className="text-xs text-[#999] w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-[#333] font-medium flex-1">{value}</span>
    </div>
  );
}

export default function ProductDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productUUID = params.id as string;

  const [product, setProduct]     = useState<Product | null>(null);
  const [qcFeed, setQcFeed]       = useState<QcEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [sellerId, setSellerId]   = useState('');

  /* Load seller ID */
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/sellers/me?userId=${user.id}`)
      .then(r => r.json())
      .then(d => { if (d.seller) setSellerId(d.seller.id); });
  }, [user?.id]);

  /* Fetch product + QC feedback */
  useEffect(() => {
    if (!productUUID || !user?.id) return;
    const load = async () => {
      try {
        const sId = await new Promise<string>(resolve => {
          let attempts = 0;
          const check = () => {
            if (sellerId) { resolve(sellerId); return; }
            if (++attempts > 20) { resolve(''); return; }
            setTimeout(check, 150);
          };
          check();
        });

        const [prodRes, qcRes] = await Promise.all([
          fetch(`/api/products/${productUUID}?sellerId=${sId || 'pending'}`),
          fetch(`/api/products/${productUUID}/qc-feedback`),
        ]);

        if (!prodRes.ok) throw new Error('Product not found');
        const prodData = await prodRes.json();
        setProduct(prodData.product);
        setActiveImg(0);

        if (qcRes.ok) {
          const qcData = await qcRes.json();
          setQcFeed(qcData.feedback || []);
        }
      } catch (err: any) {
        setLoadError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productUUID, user?.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ fontFamily: 'var(--font-dm-sans,DM Sans,sans-serif)' }}>
        <div className="w-9 h-9 border-4 border-[#5B1A3A] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#666]">Loading product…</p>
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="max-w-md mx-auto text-center py-16" style={{ fontFamily: 'var(--font-dm-sans,DM Sans,sans-serif)' }}>
        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl">
          <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-red-700 mb-1">Could not load product</p>
          <p className="text-xs text-red-500 mb-4">{loadError || 'Product not found'}</p>
          <button onClick={() => router.push('/seller/dashboard/products')}
            className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}>
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const images   = (product.images || []).map(toImg).filter(Boolean);
  const statusCfg = STATUS_CONFIG[product.approvalStatus || 'pending'];
  const isLive   = product.isActive && product.approvalStatus === 'approved';
  const colors   = (product.colors || []).map(c => typeof c === 'string' ? { name: c, hex: '#888' } : c);
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  /* Build timeline from available data */
  const timeline: { date: string; label: string; sub?: string; type: 'submit' | 'update' | 'approve' | 'reject' | 'review' | 'comment' }[] = [];

  if (product.createdAt) {
    timeline.push({ date: product.createdAt, label: 'Product submitted for review', type: 'submit' });
  }
  qcFeed.forEach(entry => {
    if (entry.author_type === 'admin') {
      timeline.push({ date: entry.created_at, label: `Admin comment`, sub: entry.message, type: 'review' });
    } else {
      timeline.push({ date: entry.created_at, label: 'Seller replied', sub: entry.message, type: 'comment' });
    }
  });
  if (product.updatedAt && product.updatedAt !== product.createdAt) {
    if (product.approvalStatus === 'approved') {
      timeline.push({ date: product.updatedAt, label: 'Product approved by admin', type: 'approve' });
    } else if (product.approvalStatus === 'rejected') {
      timeline.push({ date: product.updatedAt, label: 'Product rejected by admin', sub: product.rejectionReason || undefined, type: 'reject' });
    } else if (product.approvalStatus === 'under_review') {
      timeline.push({ date: product.updatedAt, label: 'Product moved to under review', type: 'review' });
    } else {
      timeline.push({ date: product.updatedAt, label: 'Product details updated', type: 'update' });
    }
  }
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const timelineIcon = (type: string) => {
    switch (type) {
      case 'approve':  return <CheckCircle size={14} className="text-green-500" />;
      case 'reject':   return <XCircle size={14} className="text-red-500" />;
      case 'review':   return <RefreshCw size={14} className="text-blue-500" />;
      case 'submit':   return <Package size={14} className="text-[#C49A3C]" />;
      case 'update':   return <Edit2 size={14} className="text-purple-500" />;
      case 'comment':  return <MessageSquare size={14} className="text-[#5B1A3A]" />;
      default:         return <Clock size={14} className="text-[#999]" />;
    }
  };

  return (
    <div style={{ fontFamily: 'var(--font-dm-sans,DM Sans,sans-serif)' }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.push('/seller/dashboard/products')}
            className="mt-0.5 p-1.5 rounded-lg border border-[#E8E0E4] text-[#666] hover:bg-[#F5EDF2] transition-colors flex-shrink-0">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#333]" style={{ fontFamily: 'var(--font-playfair)' }}>{product.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-[#999]">{product.productId}</span>
              <span className="text-[#E8E0E4]">·</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: statusCfg?.bg, color: statusCfg?.color }}>
                {statusCfg?.icon}{statusCfg?.label}
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${isLive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-400'}`} />
                {isLive ? 'Live' : 'Not Live'}
              </span>
            </div>
          </div>
        </div>
        <Link href={`/seller/dashboard/products/edit/${productUUID}`}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white rounded-lg flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)' }}>
          <Edit2 size={12} /> Edit Product
        </Link>
      </div>

      {/* Rejection notice */}
      {product.approvalStatus === 'rejected' && product.rejectionReason && (
        <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800">
          <XCircle size={14} className="mt-0.5 flex-shrink-0 text-red-500" />
          <div>
            <p className="font-semibold mb-0.5">Rejection Reason</p>
            <p>{product.rejectionReason}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── LEFT: Images + Details ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Image gallery */}
          <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] shadow-[0_2px_16px_rgba(91,26,58,0.04)] p-4">
            {images.length > 0 ? (
              <>
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#F5EDF2] mb-3 flex items-center justify-center">
                  <Image
                    src={images[activeImg]}
                    alt={product.name}
                    width={500}
                    height={667}
                    className="w-full h-full object-contain"
                  />
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((img, i) => (
                      <button key={i} type="button" onClick={() => setActiveImg(i)}
                        className={`aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${i === activeImg ? 'border-[#5B1A3A]' : 'border-[#E8E0E4] hover:border-[#C49A3C]'}`}>
                        <Image src={img} alt="" width={120} height={160} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-[3/4] rounded-xl bg-[#F5EDF2] flex items-center justify-center text-[#CCC]">
                <Package size={40} />
              </div>
            )}
          </div>

          {/* Product details */}
          <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] shadow-[0_2px_16px_rgba(91,26,58,0.04)] p-5">
            <h3 className="text-sm font-semibold text-[#333] mb-3">Product Details</h3>
            <div>
              <DetailRow label="Product ID"  value={<span className="font-mono text-[#5B1A3A]">{product.productId}</span>} />
              <DetailRow label="Category"    value={[product.category, product.subCategory].filter(Boolean).join(' › ')} />
              <DetailRow label="Description" value={<span className="leading-relaxed whitespace-pre-line">{product.description}</span>} />
              <DetailRow label="Fabric"      value={product.fabric} />
              <DetailRow label="Sizes"       value={product.sizes?.length ? (
                <div className="flex flex-wrap gap-1">
                  {product.sizes.map(s => (
                    <span key={s} className="px-2 py-0.5 bg-[#F5EDF2] text-[#5B1A3A] rounded text-[10px] font-medium">{s}</span>
                  ))}
                </div>
              ) : null} />
              <DetailRow label="Colors" value={colors.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  {colors.map((c, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full border border-[#E8E0E4] shadow-sm" style={{ background: c.hex }} />
                      <span className="text-[10px] text-[#666]">{c.name}</span>
                    </div>
                  ))}
                </div>
              ) : null} />
              <DetailRow label="Seller"      value={product.seller?.businessName} />
              <DetailRow label="Location"    value={[product.seller?.city, product.seller?.state].filter(Boolean).join(', ')} />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] shadow-[0_2px_16px_rgba(91,26,58,0.04)] p-5">
            <h3 className="text-sm font-semibold text-[#333] mb-3">Pricing & Stock</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-[#F5EDF2] rounded-xl">
                <p className="text-[10px] text-[#999] mb-1">Customer Price</p>
                <p className="text-lg font-bold text-[#5B1A3A]" style={{ fontFamily: 'var(--font-playfair)' }}>
                  ₹{product.price?.toLocaleString('en-IN')}
                </p>
                {discount > 0 && <p className="text-[9px] text-green-600 font-semibold">{discount}% off MRP</p>}
              </div>
              <div className="text-center p-3 bg-[#F5F0E8] rounded-xl">
                <p className="text-[10px] text-[#999] mb-1">MRP</p>
                <p className="text-lg font-bold text-[#333]" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {product.originalPrice ? `₹${product.originalPrice.toLocaleString('en-IN')}` : '—'}
                </p>
              </div>
              <div className="text-center p-3 bg-[#F0FAF3] rounded-xl">
                <p className="text-[10px] text-[#999] mb-1">Stock</p>
                <p className={`text-lg font-bold ${product.stockQuantity === 0 ? 'text-red-500' : product.stockQuantity <= 5 ? 'text-amber-600' : 'text-green-700'}`}
                  style={{ fontFamily: 'var(--font-playfair)' }}>
                  {product.stockQuantity}
                </p>
                <p className="text-[9px] text-[#999]">
                  {product.stockQuantity === 0 ? 'Out of Stock' : product.stockQuantity <= 5 ? 'Low Stock' : 'In Stock'}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT: Status + Timeline ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Status card */}
          <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] shadow-[0_2px_16px_rgba(91,26,58,0.04)] p-5">
            <h3 className="text-sm font-semibold text-[#333] mb-4">Status Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#666]">QC Status</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: statusCfg?.bg, color: statusCfg?.color }}>
                  {statusCfg?.icon}{statusCfg?.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#666]">Live on Site</span>
                <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-medium ${isLive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {isLive ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[#F5EDF2]">
                <span className="text-xs text-[#666]">Submitted</span>
                <span className="text-xs text-[#333] font-medium">{fmtDate(product.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#666]">Last Updated</span>
                <span className="text-xs text-[#333] font-medium">{fmtDate(product.updatedAt)}</span>
              </div>
              {product.images?.length !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#666]">Photos</span>
                  <span className="text-xs text-[#333] font-medium">{product.images?.length} uploaded</span>
                </div>
              )}
            </div>
          </div>

          {/* History / Timeline */}
          <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] shadow-[0_2px_16px_rgba(91,26,58,0.04)] p-5">
            <h3 className="text-sm font-semibold text-[#333] mb-4">Product History</h3>

            {timeline.length === 0 ? (
              <p className="text-xs text-[#999] text-center py-4">No history available yet.</p>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-[#F0E8F0]" />

                <div className="space-y-4">
                  {timeline.map((entry, i) => (
                    <div key={i} className="flex gap-3 relative">
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-full bg-white border border-[#E8E0E4] flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                        {timelineIcon(entry.type)}
                      </div>
                      {/* Content */}
                      <div className="flex-1 pt-1.5 min-w-0">
                        <p className="text-xs font-semibold text-[#333]">{entry.label}</p>
                        {entry.sub && (
                          <p className="text-[11px] text-[#666] mt-0.5 leading-relaxed line-clamp-3">{entry.sub}</p>
                        )}
                        <p className="text-[10px] text-[#999] mt-1">{fmt(entry.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] shadow-[0_2px_16px_rgba(91,26,58,0.04)] p-5">
            <h3 className="text-sm font-semibold text-[#333] mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link href={`/seller/dashboard/products/edit/${productUUID}`}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border border-[#E8E0E4] text-xs font-medium text-[#5B1A3A] hover:bg-[#F5EDF2] transition-colors">
                <Edit2 size={13} /> Edit Product Details
              </Link>
              <Link href="/seller/dashboard/qc"
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border border-[#E8E0E4] text-xs font-medium text-[#5B1A3A] hover:bg-[#F5EDF2] transition-colors">
                <RefreshCw size={13} /> View QC Pipeline
              </Link>
              <Link href="/seller/dashboard/products"
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border border-[#E8E0E4] text-xs font-medium text-[#666] hover:bg-[#F9F9F9] transition-colors">
                <ArrowLeft size={13} /> Back to All Products
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
