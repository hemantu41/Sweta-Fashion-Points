'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import QcPipeline, { QcStage } from '@/components/seller/QcPipeline';

interface Product {
  id: string;
  productId: string;
  name: string;
  category: string;
  price: number;
  stockQuantity: number;
  approvalStatus?: string;
  rejectionReason?: string;
  adminNote?: string;
  mainImage?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}

function qcStage(status?: string): QcStage {
  switch (status) {
    case 'approved': return 4;
    case 'under_review': return 2;
    case 'rejected': return 3;
    default: return 1; // pending = "submitted"
  }
}

export default function QcPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.sellerId) return;
    fetch(`/api/products?sellerId=${user.sellerId}&isActive=all`)
      .then(r => r.json())
      .then(d => {
        const all: Product[] = d.products || [];
        // Show only non-approved products in QC tracker
        setProducts(all.filter(p => p.approvalStatus !== 'approved' || p.rejectionReason));
      })
      .finally(() => setLoading(false));
  }, [user?.sellerId]);

  const pending = products.filter(p => p.approvalStatus === 'pending' || !p.approvalStatus);
  const underReview = products.filter(p => p.approvalStatus === 'under_review');
  const rejected = products.filter(p => p.approvalStatus === 'rejected');

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>

      {/* Pipeline diagram */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-1">Product Approval Pipeline</h2>
        <p className="text-xs text-gray-400 mb-6">Every product goes through these 5 stages before going live to customers.</p>
        <QcPipeline currentStage={0} />
        <div className="mt-4 grid grid-cols-5 gap-2 text-center">
          {[
            { label: 'Submitted', desc: 'Product listed by seller' },
            { label: 'Image Check', desc: 'Min 4 clear images' },
            { label: 'Content Review', desc: 'Title, desc & pricing' },
            { label: 'Admin Approval', desc: 'Final sign-off' },
            { label: 'Live', desc: 'Visible to customers' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-[10px] text-gray-400 leading-tight">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending QC', count: pending.length, bg: '#FEF7EA', color: '#8B5E0A' },
          { label: 'Under Review', count: underReview.length, bg: '#EBF2FB', color: '#1A3D6B' },
          { label: 'Rejected', count: rejected.length, bg: '#FDF3F3', color: '#8B1A1A' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: s.bg }}>
            <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'var(--font-playfair)' }}>{s.count}</p>
            <p className="text-xs mt-1" style={{ color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#8B1A1A] border-t-transparent rounded-full animate-spin" /></div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
            <svg className="text-green-600" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">All products approved!</h3>
          <p className="text-sm text-gray-400 mb-4">No products are currently pending review.</p>
          <Link href="/seller/dashboard/add" className="text-sm text-[#8B1A1A] hover:underline font-medium">Add a new product →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map(p => {
            const stage = qcStage(p.approvalStatus);
            const isRejected = p.approvalStatus === 'rejected';
            const hasNote = !!(p.rejectionReason || p.adminNote);
            const img = p.mainImage || p.images?.[0];

            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex gap-4 p-4 sm:p-5">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {img ? (
                      <Image src={img} alt={p.name} width={64} height={64} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-800 leading-tight">{p.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{p.productId} · {p.category} · ₹{p.price?.toLocaleString('en-IN')}</p>
                      </div>
                      <span
                        className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          isRejected ? 'bg-red-50 text-red-600' : stage === 2 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {isRejected ? 'Rejected' : stage === 2 ? 'Under Review' : 'Pending QC'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Submitted {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>

                {/* QC progress */}
                <div className="px-4 sm:px-5 pb-4">
                  <QcPipeline currentStage={stage} rejected={isRejected} />
                </div>

                {/* Admin note */}
                {hasNote && (
                  <div className="mx-4 sm:mx-5 mb-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-100">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Admin Feedback</p>
                    <p className="text-sm text-blue-800">{p.rejectionReason || p.adminNote}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="px-4 sm:px-5 pb-4 flex gap-2">
                  <Link
                    href={`/seller/dashboard/products/edit/${p.id}`}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Edit Listing
                  </Link>
                  {isRejected && (
                    <Link
                      href={`/seller/dashboard/products/edit/${p.id}`}
                      className="px-4 py-2 text-xs font-semibold rounded-lg text-white"
                      style={{ background: '#8B1A1A' }}
                    >
                      Fix &amp; Resubmit
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
