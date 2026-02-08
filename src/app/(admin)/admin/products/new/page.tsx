'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import MultiImageUpload from '@/components/MultiImageUpload';

export default function AddProductPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    nameHi: '',
    category: 'mens',
    subCategory: '',
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

  const subCategories = {
    mens: ['jeans', 'shirts', 'tshirts', 'ethnic'],
    womens: ['daily', 'party', 'ethnic', 'seasonal'],
    sarees: ['daily', 'party', 'wedding', 'festival'],
    kids: ['0-3', '4-7', '8-12'],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // DISABLED: Products are loaded from static file, adding new products is not available
    setMessage('Cannot add new product: Products are currently loaded from static file. To enable this feature, migrate products to the database first.');
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

        {/* Warning Banner - Static Products Mode */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Feature Disabled: Products are currently loaded from static file
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Adding new products is temporarily disabled. Products need to be migrated to the database first.
                </p>
                <p className="mt-2">
                  <strong>To enable this feature:</strong> Products must be stored in the <code className="bg-yellow-100 px-1 rounded">spf_productdetails</code> database table instead of the static file.
                </p>
              </div>
            </div>
          </div>
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
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value, subCategory: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                >
                  <option value="mens">Men's</option>
                  <option value="womens">Women's</option>
                  <option value="sarees">Sarees</option>
                  <option value="kids">Kids</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Sub-Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                >
                  <option value="">Select Sub-Category</option>
                  {subCategories[formData.category as keyof typeof subCategories].map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
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
              disabled={true}
              className="px-8 py-3 bg-gray-400 text-white font-semibold rounded-full cursor-not-allowed opacity-60"
              title="Adding products disabled - products are loaded from static file"
            >
              Create Product (Disabled)
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/products')}
              className="px-8 py-3 border-2 border-[#722F37] text-[#722F37] font-semibold rounded-full hover:bg-[#722F37] hover:text-white transition-all"
            >
              Back to Products
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
