'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import QcPipeline, { QcStage } from '@/components/seller/QcPipeline';

interface Product {
  id: string;
  productId: string;
  name: string;
  category: string;
  subCategory?: string;
  price: number;
  originalPrice?: number;
  stockQuantity: number;
  isActive: boolean;
  approvalStatus?: string;
  rejectionReason?: string;
  mainImage?: string;
  images?: string[];
  createdAt?: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  approved: { label: 'Approved', bg: '#EBF7EF', color: '#2E7D32' },
  pending: { label: 'Pending QC', bg: '#FEF7EA', color: '#C49A3C' },
  under_review: { label: 'Under Review', bg: '#EBF2FB', color: '#1565C0' },
  rejected: { label: 'Rejected', bg: '#FDF3F3', color: '#C62828' },
};

function qcStage(status?: string): QcStage {
  switch (status) {
    case 'approved': return 4;
    case 'under_review': return 2;
    case 'rejected': return 3;
    default: return 1;
  }
}

const CATEGORIES = ['All', 'Clothes', 'Footwear', 'Beauty & Makeup', 'Sarees', 'Kids'];
const STATUSES = ['All', 'approved', 'pending', 'under_review', 'rejected'];
const STOCKS = ['All', 'In Stock', 'Low Stock', 'Out of Stock'];

function ProductsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState(() => {
    const f = searchParams.get('filter');
    return STATUSES.includes(f || '') ? (f as string) : 'All';
  });
  const [stockFilter, setStockFilter] = useState('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  useEffect(() => {
    if (!user?.sellerId) return;
    fetch(`/api/products?sellerId=${user.sellerId}&isActive=all`)
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .finally(() => setLoading(false));
  }, [user?.sellerId]);

  async function handleDelete(product: Product) {
    setDeletingId(product.id);
    try {
      await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
      setProducts(p => p.filter(x => x.id !== product.id));
    } finally { setDeletingId(null); setConfirmDelete(null); }
  }

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !p.productId?.toLowerCase().includes(q)) return false;
    if (catFilter !== 'All' && !p.category?.toLowerCase().includes(catFilter.toLowerCase())) return false;
    if (statusFilter !== 'All' && p.approvalStatus !== statusFilter) return false;
    if (stockFilter === 'In Stock' && p.stockQuantity <= 5) return false;
    if (stockFilter === 'Low Stock' && (p.stockQuantity === 0 || p.stockQuantity > 5)) return false;
    if (stockFilter === 'Out of Stock' && p.stockQuantity !== 0) return false;
    return true;
  });

  return (
    <div className="space-y-5" style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{filtered.length} of {products.length} products</p>
        <Link href="/seller/dashboard/add"
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg"
          style={{ background: 'linear-gradient(135deg, #5B1A3A, #7A2350)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
          Add New Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or ID…"
          className="flex-1 min-w-48 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#5B1A3A]/30"
        />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
          {STATUSES.map(s => <option key={s}>{s === 'All' ? 'All Status' : STATUS_CONFIG[s]?.label || s}</option>)}
        </select>
        <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
          {STOCKS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E8E0E4] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[#5B1A3A] border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            <p className="text-sm">No products found</p>
            <Link href="/seller/dashboard/add" className="text-sm text-[#5B1A3A] hover:underline">Add your first product →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E0E4] bg-[#F5EDF2]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">QC Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Live</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => {
                  const img = p.mainImage || p.images?.[0];
                  const statusCfg = STATUS_CONFIG[p.approvalStatus || 'pending'];
                  const isLow = p.stockQuantity > 0 && p.stockQuantity <= 5;
                  const isOut = p.stockQuantity === 0;
                  return (
                    <tr key={p.id} className="hover:bg-[#C49A3C]/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {img ? (
                              <Image src={img} alt={p.name} width={40} height={40} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate max-w-[160px]">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.productId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 capitalize hidden md:table-cell">{p.category}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-800" style={{ fontFamily: 'var(--font-playfair)' }}>
                          ₹{p.price?.toLocaleString('en-IN')}
                        </span>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <span className="text-xs text-gray-400 line-through ml-1">₹{p.originalPrice.toLocaleString('en-IN')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-semibold ${isOut ? 'text-red-500' : isLow ? 'text-amber-600' : 'text-gray-700'}`}
                          style={{ fontFamily: 'var(--font-playfair)' }}>
                          {p.stockQuantity}
                        </span>
                        {isLow && <p className="text-[10px] text-amber-500">Low</p>}
                        {isOut && <p className="text-[10px] text-red-500">Out</p>}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="space-y-1.5">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: statusCfg?.bg, color: statusCfg?.color }}>
                            {statusCfg?.label || p.approvalStatus}
                          </span>
                          <QcPipeline currentStage={qcStage(p.approvalStatus)} rejected={p.approvalStatus === 'rejected'} compact />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${p.isActive && p.approvalStatus === 'approved' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.isActive && p.approvalStatus === 'approved' ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {p.isActive && p.approvalStatus === 'approved' ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/seller/dashboard/products/edit/${p.id}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </Link>
                          <button onClick={() => setConfirmDelete(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6">
            <h3 className="font-semibold text-gray-800 mb-2">Delete Product?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={!!deletingId}
                className="flex-1 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #5B1A3A, #7A2350)' }}
              >
                {deletingId ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-[#5B1A3A] border-t-transparent rounded-full animate-spin" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
