'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AdminAuthGuard from '@/components/AdminAuthGuard';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminProductReviewPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/products/review?status=${filter}`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedProduct || !user?.id) return;

    if (action === 'reject' && !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/admin/products/review', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.product_id,
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined,
          adminUserId: user.id,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setShowModal(false);
        setRejectionReason('');
        fetchProducts();
      } else {
        alert(data.error || 'Failed to process product');
      }
    } catch (error) {
      alert('Error processing product');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-[#FAF7F2] p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-[#722F37]">Product Review</h1>
            <Link
              href="/admin/products"
              className="px-6 py-3 bg-[#722F37] text-white font-semibold rounded-full hover:bg-[#8B3D47] hover:shadow-lg transition-all"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-xl shadow-md mb-6 p-1 flex gap-2">
            {(['pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-[#722F37] text-white'
                    : 'text-[#6B6B6B] hover:bg-[#F0EDE8]'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-[#6B6B6B]">
              No {filter} products found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden border border-[#E8E2D9]"
                >
                  <div className="relative h-48 bg-[#F0EDE8]">
                    {product.main_image ? (
                      <Image
                        src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_400,h_400,c_fill/${product.main_image}`}
                        alt={product.name || 'Product'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-6xl">📦</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[#2D2D2D] mb-2">{product.name}</h3>
                    <p className="text-sm text-[#6B6B6B] mb-2">₹{product.price}</p>
                    <p className="text-xs text-[#6B6B6B] mb-3">
                      by {product.seller?.business_name}
                    </p>
                    {filter === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setAction('approve');
                            setShowModal(true);
                          }}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setAction('reject');
                            setShowModal(true);
                          }}
                          className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {filter === 'rejected' && product.rejection_reason && (
                      <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                        <p className="text-xs text-red-700">{product.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Modal */}
        {showModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">
                {action === 'approve' ? 'Approve Product' : 'Reject Product'}
              </h2>
              <p className="text-sm text-[#6B6B6B] mb-4">
                {selectedProduct.name} by {selectedProduct.seller?.business_name}
              </p>

              {action === 'reject' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg"
                    rows={3}
                    placeholder="Explain why this product is being rejected..."
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-[#E8E2D9] rounded-lg text-[#2D2D2D] hover:bg-[#F0EDE8]"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReview}
                  className={`flex-1 px-4 py-2 rounded-lg text-white ${
                    action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminAuthGuard>
  );
}
