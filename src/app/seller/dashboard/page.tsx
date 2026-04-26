'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import KpiCard from '@/components/seller/KpiCard';

const LocationPickerMap = dynamic(() => import('@/components/LocationPickerMap'), { ssr: false });

/* ── Types ── */
interface Seller {
  id: string;
  businessName: string;
  status: string;
  commissionPercentage: number;
  latitude?: number | null;
  longitude?: number | null;
  pincode?: string | null;
  pickupPincode?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
}

interface Product {
  id: string;
  productId: string;
  name: string;
  category: string;
  price: number;
  stockQuantity: number;
  approvalStatus?: string;
  isActive: boolean;
}

interface OrderToPack {
  id: string;
  order_number: string;
  delivery_address: any;
  items: any[];
  packing_deadline?: string;
  sla_deadline?: string;
  created_at: string;
}

interface EarningsSummary {
  total: number;
  pending: number;
  paid: number;
  commission: number;
}

/* ── Helpers ── */
function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

function deadlineColor(deadline?: string) {
  if (!deadline) return 'text-[#666666]';
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff < 0) return 'text-red-600 font-semibold';
  if (diff < 2 * 3600 * 1000) return 'text-red-500 font-semibold';
  if (diff < 8 * 3600 * 1000) return 'text-amber-600 font-medium';
  return 'text-[#666666]';
}

function fmtDeadline(deadline?: string) {
  if (!deadline) return '—';
  return new Date(deadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function StatBar({ value, max = 100, color = '#5B1A3A' }: { value: number; max?: number; color?: string }) {
  return (
    <div className="h-1.5 bg-[#E8E0E4] rounded-full overflow-hidden mt-2">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
    </div>
  );
}

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [ordersToPack, setOrdersToPack] = useState<OrderToPack[]>([]);
  const [earnings, setEarnings] = useState<EarningsSummary>({ total: 0, pending: 0, paid: 0, commission: 0 });
  const [loading, setLoading] = useState(true);
  const [packingIds, setPackingIds] = useState<Set<string>>(new Set());
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // ── Pickup address modal ──────────────────────────────────────────────────
  const [showPickupModal, setShowPickupModal]   = useState(false);
  const [pickupPincodeInput, setPickupPincodeInput] = useState('');
  const [savingPickup, setSavingPickup]         = useState(false);
  const [pickupSaveError, setPickupSaveError]   = useState('');

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const [sellerRes, productsRes, ordersRes] = await Promise.allSettled([
          fetch(`/api/sellers/me?userId=${user.id}`).then(r => r.json()),
          fetch(`/api/products?sellerId=${user.sellerId}&isActive=all`).then(r => r.json()),
          fetch(`/api/orders?sellerId=${user.sellerId}`).then(r => r.json()),
        ]);

        if (sellerRes.status === 'fulfilled') {
          const d = sellerRes.value;
          if (d.seller) {
            setSeller(d.seller);
            // fetch earnings
            if (d.seller.id) {
              try {
                const er = await fetch(`/api/sellers/${d.seller.id}/earnings`).then(r => r.json());
                const list: any[] = er.earnings || [];
                const total = list.reduce((s, e) => s + (e.amount || 0), 0);
                const pending = list.filter(e => e.paymentStatus === 'pending').reduce((s, e) => s + (e.amount || 0), 0);
                const paid = list.filter(e => e.paymentStatus === 'paid').reduce((s, e) => s + (e.amount || 0), 0);
                const commission = list.reduce((s, e) => s + (e.commissionAmount || 0), 0);
                setEarnings({ total, pending, paid, commission });
              } catch {/* silent */}
            }
          }
        }
        if (productsRes.status === 'fulfilled') {
          setProducts(productsRes.value.products || []);
        }
        if (ordersRes.status === 'fulfilled') {
          const d = ordersRes.value;
          setOrdersToPack(Array.isArray(d) ? d : d.orders || []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, user?.sellerId]);

  const approved = products.filter(p => p.approvalStatus === 'approved' && p.isActive);
  const pending = products.filter(p => p.approvalStatus === 'pending' || p.approvalStatus === 'under_review');
  const inStock = products.filter(p => p.stockQuantity > 5);
  const lowStock = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 5);
  const outOfStock = products.filter(p => p.stockQuantity === 0);
  const totalUnits = products.reduce((s, p) => s + p.stockQuantity, 0);
  const approvalRate = products.length ? Math.round((approved.length / products.length) * 100) : 0;
  const fulfillmentRate = 87; // demo — replace with real data

  async function markPacked(orderId: string) {
    setPackingIds(s => new Set(s).add(orderId));
    try {
      await fetch(`/api/orders/${orderId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'packed' }) });
      setOrdersToPack(o => o.filter(x => x.id !== orderId));
    } catch {/* silent */}
    setPackingIds(s => { const n = new Set(s); n.delete(orderId); return n; });
  }

  async function saveLocation(coords: { lat: number; lng: number }) {
    if (!seller) return;
    setSavingLocation(true);
    try {
      await fetch(`/api/sellers/${seller.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ latitude: coords.lat, longitude: coords.lng }) });
      setSeller(s => s ? { ...s, latitude: coords.lat, longitude: coords.lng } : s);
    } finally { setSavingLocation(false); setShowLocationModal(false); setPendingCoords(null); }
  }

  function useCurrentLocation() {
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      pos => { setPendingCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoStatus('success'); setShowLocationModal(true); },
      () => setGeoStatus('error'),
    );
  }

  async function savePickupPincode() {
    if (!seller || !/^\d{6}$/.test(pickupPincodeInput)) {
      setPickupSaveError('Please enter a valid 6-digit pincode.');
      return;
    }
    setSavingPickup(true);
    setPickupSaveError('');
    try {
      const res = await fetch(`/api/sellers/${seller.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupPincode: pickupPincodeInput }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSeller(s => s ? { ...s, pickupPincode: pickupPincodeInput } : s);
      setShowPickupModal(false);
    } catch {
      setPickupSaveError('Failed to save. Please try again.');
    } finally {
      setSavingPickup(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#5B1A3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5" style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>

      {/* ── Pickup address missing banner ── */}
      {seller && !seller.pickupPincode && !seller.pincode && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-700">Pickup address not set</p>
              <p className="text-xs text-red-600 mt-0.5">Customers cannot get accurate delivery charges until you set your pickup pincode.</p>
            </div>
          </div>
          <button
            onClick={() => { setPickupPincodeInput(seller.pincode || ''); setPickupSaveError(''); setShowPickupModal(true); }}
            className="flex-shrink-0 px-4 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Set Now
          </button>
        </div>
      )}

      {/* ── Alert banner ── */}
      {(pending.length > 0 || ordersToPack.length > 0) && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
          </svg>
          <p className="text-sm text-amber-800">
            {[
              pending.length > 0 && `${pending.length} product${pending.length > 1 ? 's' : ''} pending QC approval`,
              ordersToPack.length > 0 && `${ordersToPack.length} order${ordersToPack.length > 1 ? 's' : ''} to pack today`,
            ].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Products"
          value={products.length}
          subtitle={`${approved.length} approved & live`}
          trend={{ value: 'this month', positive: true }}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>}
          href="/seller/dashboard/products"
        />
        <KpiCard
          title="Approved & Live"
          value={approved.length}
          subtitle={`${approvalRate}% approval rate`}
          accent="#2E7D32"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          href="/seller/dashboard/products?filter=approved"
        />
        <KpiCard
          title="Pending QC"
          value={pending.length}
          subtitle="Awaiting admin review"
          accent="#C49A3C"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>}
          href="/seller/dashboard/qc"
        />
        <KpiCard
          title="This Month Revenue"
          value={fmt(earnings.paid)}
          subtitle={`₹${earnings.pending.toLocaleString('en-IN')} pending payout`}
          trend={{ value: 'vs last month', positive: true }}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>}
          href="/seller/dashboard/earnings"
        />
      </div>

      {/* ── Quick stats row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Order summary */}
        <div
          className="bg-white rounded-xl border border-[#E8E0E4] p-5 shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-[#5B1A3A]/30 transition-all duration-300"
          onClick={() => router.push('/seller/dashboard/orders')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && router.push('/seller/dashboard/orders')}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Order Summary</h3>
            <span className="text-xs text-[#5B1A3A] font-medium">View all →</span>
          </div>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
            {[
              { label: 'Pending Pack', value: ordersToPack.length, color: '#C49A3C' },
              { label: 'Shipped', value: 0, color: '#1565C0' },
              { label: 'Delivered', value: 0, color: '#2E7D32' },
              { label: 'Returned', value: 0, color: '#5B1A3A' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-1">
                <span className="text-[#666666] text-xs">{s.label}</span>
                <span className="font-semibold text-sm" style={{ color: s.color, fontFamily: 'var(--font-playfair)' }}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-[#666666] mb-1">
              <span>Fulfillment Rate</span><span>{fulfillmentRate}%</span>
            </div>
            <StatBar value={fulfillmentRate} color="#2E7D32" />
          </div>
        </div>

        {/* Inventory */}
        <div
          className="bg-white rounded-xl border border-[#E8E0E4] p-5 shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-[#5B1A3A]/30 transition-all duration-300"
          onClick={() => router.push('/seller/dashboard/inventory')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && router.push('/seller/dashboard/inventory')}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Inventory Status</h3>
            <span className="text-xs text-[#5B1A3A] font-medium">View all →</span>
          </div>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            {[
              { label: 'In Stock SKUs', value: inStock.length, color: '#2E7D32' },
              { label: 'Low Stock', value: lowStock.length, color: '#C49A3C' },
              { label: 'Out of Stock', value: outOfStock.length, color: '#5B1A3A' },
              { label: 'Total Units', value: totalUnits, color: '#1565C0' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-1">
                <span className="text-[#666666] text-xs">{s.label}</span>
                <span className="font-semibold text-sm" style={{ color: s.color, fontFamily: 'var(--font-playfair)' }}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-[#666666] mb-1">
              <span>Stock Health</span>
              <span>{products.length ? Math.round((inStock.length / products.length) * 100) : 0}%</span>
            </div>
            <StatBar value={products.length ? (inStock.length / products.length) * 100 : 0} color="#2E7D32" />
          </div>
        </div>

        {/* Earnings */}
        <div
          className="bg-white rounded-xl border border-[#E8E0E4] p-5 shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-[#5B1A3A]/30 transition-all duration-300"
          onClick={() => router.push('/seller/dashboard/earnings')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && router.push('/seller/dashboard/earnings')}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Earnings Overview</h3>
            <span className="text-xs text-[#5B1A3A] font-medium">Details →</span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Pending Payout', value: fmt(earnings.pending), color: '#C49A3C' },
              { label: 'Paid This Month', value: fmt(earnings.paid), color: '#2E7D32' },
              { label: 'Commission Deducted', value: fmt(earnings.commission), color: '#5B1A3A' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                <span className="text-xs text-[#666666]">{s.label}</span>
                <span className="text-sm font-semibold" style={{ color: s.color, fontFamily: 'var(--font-playfair)' }}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 px-3 py-2 bg-[#F5EDF2] rounded-lg">
            <p className="text-[10px] text-[#999999] uppercase tracking-wide">Next Payout</p>
            <p className="text-sm font-semibold text-gray-700 mt-0.5">Every Monday</p>
          </div>
        </div>
      </div>

      {/* ── Orders to Pack ── */}
      <div className="bg-white rounded-xl border border-[#E8E0E4] shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div>
            <h2 className="text-sm font-semibold text-[#333333]">Orders to Pack Today</h2>
            <p className="text-xs text-[#999999] mt-0.5">{ordersToPack.length} pending</p>
          </div>
          <Link href="/seller/dashboard/orders" className="text-xs text-[#5B1A3A] hover:underline font-medium">View all orders →</Link>
        </div>

        {ordersToPack.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#999999] gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            <p className="text-sm">All orders packed! Great work.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {ordersToPack.map(order => {
              const deadline = order.packing_deadline || order.sla_deadline;
              const itemCount = order.items?.length || 0;
              const isPacking = packingIds.has(order.id);
              return (
                <div key={order.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <svg className="text-amber-600" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#333333]">#{order.order_number}</p>
                    <p className="text-xs text-[#999999]">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-[#999999]">Pack by</p>
                    <p className={`text-sm ${deadlineColor(deadline)}`}>{fmtDeadline(deadline)}</p>
                  </div>
                  <button
                    onClick={() => markPacked(order.id)}
                    disabled={isPacking}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-all disabled:opacity-60 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #5B1A3A, #7A2350)' }}
                  >
                    {isPacking ? 'Packing…' : 'Mark Packed'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Shop Location ── */}
      <div className="bg-white rounded-xl border border-[#E8E0E4] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#333333]">Shop Location</h2>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${seller?.latitude ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            {seller?.latitude ? 'Location Set' : 'Not Set'}
          </span>
        </div>
        {seller?.latitude ? (
          <p className="text-sm text-gray-600 mb-4">
             Lat: {seller.latitude.toFixed(4)}, Lng: {seller.longitude?.toFixed(4)} — Amas, Gaya, Bihar
          </p>
        ) : (
          <p className="text-sm text-[#999999] mb-4">No location set. Add your shop location for delivery radius calculation.</p>
        )}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowLocationModal(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #5B1A3A, #7A2350)' }}
          >
            Pin on Map
          </button>
          <button
            onClick={useCurrentLocation}
            disabled={geoStatus === 'loading'}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-[#C49A3C]/5 transition-all disabled:opacity-60"
          >
            {geoStatus === 'loading' ? 'Detecting…' : geoStatus === 'error' ? 'Location Error' : 'Use Current Location'}
          </button>
        </div>
      </div>

      {/* ── Pickup address modal ── */}
      {showPickupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={e => { if (e.target === e.currentTarget) setShowPickupModal(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E0E4]">
              <div>
                <h3 className="font-semibold text-[#333333]">Set Pickup Pincode</h3>
                <p className="text-xs text-[#999999] mt-0.5">Used to calculate delivery charges for your products</p>
              </div>
              <button onClick={() => setShowPickupModal(false)} className="text-[#999999] hover:text-gray-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">
                  Pickup Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={pickupPincodeInput}
                  onChange={e => { setPickupPincodeInput(e.target.value.replace(/\D/g, '').slice(0, 6)); setPickupSaveError(''); }}
                  placeholder="e.g. 824219"
                  maxLength={6}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5B1A3A] focus:border-transparent text-sm tracking-widest"
                />
                <p className="text-xs text-[#9CA3AF] mt-1">Enter the 6-digit pincode where your products will be picked up from.</p>
                {pickupSaveError && <p className="text-xs text-red-600 mt-1">{pickupSaveError}</p>}
              </div>
              {seller?.addressLine1 && (
                <div className="p-3 bg-[#FAF7F2] rounded-lg text-xs text-[#6B6B6B]">
                  <p className="font-medium text-[#2D2D2D] mb-0.5">Your registered address</p>
                  <p>{seller.addressLine1}, {seller.city}, {seller.state} – {seller.pincode || '—'}</p>
                  {seller.pincode && (
                    <button
                      onClick={() => setPickupPincodeInput(seller.pincode!)}
                      className="mt-1.5 text-[#5B1A3A] font-medium hover:underline"
                    >
                      Use this pincode →
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setShowPickupModal(false)} className="flex-1 py-2.5 text-sm border border-gray-200 rounded-lg text-[#6B6B6B] hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={savePickupPincode}
                disabled={savingPickup || pickupPincodeInput.length !== 6}
                className="flex-1 py-2.5 text-sm font-semibold rounded-lg text-white disabled:opacity-50 transition-all"
                style={{ background: 'linear-gradient(135deg, #5B1A3A, #7A2350)' }}
              >
                {savingPickup ? 'Saving…' : 'Save Pincode'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E0E4]">
              <h3 className="font-semibold text-[#333333]">Pin Shop Location</h3>
              <button onClick={() => setShowLocationModal(false)} className="text-[#999999] hover:text-gray-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="h-72">
              <LocationPickerMap
                initialLat={pendingCoords?.lat ?? seller?.latitude ?? 24.6193}
                initialLng={pendingCoords?.lng ?? seller?.longitude ?? 84.6553}
                onLocationSelect={(lat: number, lng: number) => setPendingCoords({ lat, lng })}
              />
            </div>
            <div className="px-5 py-4 border-t border-[#E8E0E4] flex gap-3">
              <button onClick={() => setShowLocationModal(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-[#C49A3C]/5">Cancel</button>
              <button
                onClick={() => pendingCoords && saveLocation(pendingCoords)}
                disabled={!pendingCoords || savingLocation}
                className="flex-1 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #5B1A3A, #7A2350)' }}
              >
                {savingLocation ? 'Saving…' : 'Save Location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
