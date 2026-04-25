'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import MultiImageUpload from '@/components/MultiImageUpload';
import { useCategories, type CategoryNode } from '@/hooks/useCategories';

export default function AddProductPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // ── Dynamic category tree ──────────────────────────────────────────────────
  const { tree } = useCategories();
  const [catIds, setCatIds] = useState({ l1: '', l2: '', l3: '' });

  const l1Nodes: CategoryNode[] = useMemo(() => tree, [tree]);
  const l2Nodes: CategoryNode[] = useMemo(() => {
    if (!catIds.l1) return [];
    return l1Nodes.find(n => n.id === catIds.l1)?.children ?? [];
  }, [l1Nodes, catIds.l1]);
  const l3Nodes: CategoryNode[] = useMemo(() => {
    if (!catIds.l2) return [];
    return l2Nodes.find(n => n.id === catIds.l2)?.children ?? [];
  }, [l2Nodes, catIds.l2]);

  const l1Node = useMemo(() => l1Nodes.find(n => n.id === catIds.l1) ?? null, [l1Nodes, catIds.l1]);
  const l2Node = useMemo(() => l2Nodes.find(n => n.id === catIds.l2) ?? null, [l2Nodes, catIds.l2]);

  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    nameHi: '',
    price: '',
    originalPrice: '',
    priceRange: 'mid',
    description: '',
    descriptionHi: '',
    fabric: '',
    fabricHi: '',
    images: [] as string[],
    stockQuantity: '100',
    isNewArrival: false,
    isBestSeller: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          product: {
            productId: formData.productId,
            name: formData.name,
            nameHi: formData.nameHi,
            category: l1Node?.slug || l1Node?.name || '',
            subCategory: l2Node?.slug || l2Node?.name || '',
            l1CategoryId: catIds.l1 || null,
            l2CategoryId: catIds.l2 || null,
            l3CategoryId: catIds.l3 || null,
            price: parseInt(formData.price),
            originalPrice: formData.originalPrice ? parseInt(formData.originalPrice) : undefined,
            priceRange: formData.priceRange,
            description: formData.description,
            descriptionHi: formData.descriptionHi,
            fabric: formData.fabric,
            fabricHi: formData.fabricHi,
            mainImage: formData.images[0] || '',
            images: formData.images,
            colors: [],
            sizes: [],
            stockQuantity: parseInt(formData.stockQuantity),
            isNewArrival: formData.isNewArrival,
            isBestSeller: formData.isBestSeller,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Product created successfully!');
        setTimeout(() => router.push('/admin/products'), 1500);
      } else {
        setMessage(data.error || 'Failed to create product');
      }
    } catch (error) {
      setMessage('Error creating product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
            Add New Product
          </h1>
          <p className="text-[#6B6B6B] mt-1">Create a new product in your inventory</p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#E8E2D9] p-8">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Product ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  placeholder="e.g., mens-jeans-6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  placeholder="e.g., Classic Blue Jeans"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Product Name (Hindi)</label>
                <input
                  type="text"
                  value={formData.nameHi}
                  onChange={(e) => setFormData({ ...formData, nameHi: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Category (L1) <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={catIds.l1}
                  onChange={(e) => setCatIds({ l1: e.target.value, l2: '', l3: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {l1Nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>
              {l2Nodes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Sub-Category (L2) <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={catIds.l2}
                    onChange={(e) => setCatIds(prev => ({ ...prev, l2: e.target.value, l3: '' }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  >
                    <option value="">Select Sub-Category</option>
                    {l2Nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {l3Nodes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Type (L3)
                  </label>
                  <select
                    value={catIds.l3}
                    onChange={(e) => setCatIds(prev => ({ ...prev, l3: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  >
                    <option value="">Select Type (optional)</option>
                    {l3Nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Original Price (₹)</label>
                <input
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Price Range</label>
                <select
                  value={formData.priceRange}
                  onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                >
                  <option value="budget">Budget</option>
                  <option value="mid">Mid-Range</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">Product Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Fabric</label>
                  <input
                    type="text"
                    value={formData.fabric}
                    onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="mt-4">
                <MultiImageUpload
                  label="Product Images"
                  currentImageIds={formData.images}
                  onImagesChange={(imageIds) => setFormData({ ...formData, images: imageIds })}
                  maxImages={5}
                />
              </div>
            </div>
          </div>

          {/* Flags */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">Product Flags</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.isNewArrival}
                  onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                  className="w-5 h-5 text-[#722F37] border-gray-300 rounded focus:ring-[#722F37]"
                />
                <span className="text-sm font-medium text-[#2D2D2D]">New Arrival</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.isBestSeller}
                  onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                  className="w-5 h-5 text-[#722F37] border-gray-300 rounded focus:ring-[#722F37]"
                />
                <span className="text-sm font-medium text-[#2D2D2D]">Best Seller</span>
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/products')}
              className="px-8 py-3 border-2 border-[#722F37] text-[#722F37] font-semibold rounded-full hover:bg-[#722F37] hover:text-white transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
