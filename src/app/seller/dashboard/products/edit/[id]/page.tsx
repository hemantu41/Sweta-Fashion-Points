'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import MultiImageUpload from '@/components/MultiImageUpload';

export default function SellerEditProductPage() {
  const { user, sellerId } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    // Product Information
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

    // Shop Information (Auto-populated from seller profile)
    shopName: '',
    shopMobile: '',
    shopLocation: '',
  });

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setLoadingProduct(false);
        return;
      }

      try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }

        const data = await response.json();
        const product = data.product;

        // Check if current user owns this product
        if (product.sellerId !== sellerId) {
          setMessage('You are not authorized to edit this product');
          setLoadingProduct(false);
          return;
        }

        // Pre-populate form with existing product data
        setFormData({
          productId: product.productId || '',
          name: product.name || '',
          nameHi: product.nameHi || '',
          category: product.category || 'mens',
          subCategory: product.subCategory || '',
          price: product.price?.toString() || '',
          originalPrice: product.originalPrice?.toString() || '',
          priceRange: product.priceRange || 'mid',
          description: product.description || '',
          descriptionHi: product.descriptionHi || '',
          fabric: product.fabric || '',
          fabricHi: product.fabricHi || '',
          images: product.images || [],
          stockQuantity: product.stockQuantity?.toString() || '100',
          shopName: product.seller?.businessName || '',
          shopMobile: product.seller?.businessPhone || '',
          shopLocation: product.seller?.city && product.seller?.state
            ? `${product.seller.city}, ${product.seller.state}`
            : '',
        });
      } catch (error) {
        console.error('Error fetching product:', error);
        setMessage('Failed to load product data');
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [productId, sellerId]);

  const subCategories = {
    mens: ['jeans', 'shirts', 'tshirts', 'ethnic'],
    womens: ['daily', 'party', 'ethnic', 'seasonal'],
    sarees: ['daily', 'party', 'wedding', 'festival'],
    kids: ['0-3', '4-7', '8-12'],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validate shop information
    if (!formData.shopName || !formData.shopMobile || !formData.shopLocation) {
      setMessage('Please fill in all shop information fields (Shop Name, Mobile, Location)');
      setLoading(false);
      return;
    }

    if (formData.shopMobile.length !== 10) {
      setMessage('Shop mobile number must be 10 digits');
      setLoading(false);
      return;
    }

    if (formData.images.length === 0) {
      setMessage('Please upload at least one product image');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          product: {
            name: formData.name,
            nameHi: formData.nameHi,
            category: formData.category,
            subCategory: formData.subCategory,
            price: parseInt(formData.price),
            originalPrice: formData.originalPrice ? parseInt(formData.originalPrice) : undefined,
            priceRange: formData.priceRange,
            description: formData.description,
            descriptionHi: formData.descriptionHi,
            fabric: formData.fabric,
            fabricHi: formData.fabricHi,
            mainImage: formData.images[0] || '',
            images: formData.images,
            stockQuantity: parseInt(formData.stockQuantity),
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Product updated successfully!');
        setTimeout(() => router.push('/seller/dashboard'), 1500);
      } else {
        setMessage(data.error || 'Failed to update product');
      }
    } catch (error) {
      setMessage('Error updating product');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while fetching product
  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
          </div>
          <p className="text-[#6B6B6B] mt-4">Loading product data...</p>
        </div>
      </div>
    );
  }

  // Show error if unauthorized or product not found
  if (message && !formData.name) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
            <p className="text-red-700">{message}</p>
            <Link
              href="/seller/dashboard"
              className="inline-block mt-4 px-6 py-2 bg-[#722F37] text-white rounded-full hover:bg-[#8B3D47] transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
              Edit Product
            </h1>
            <p className="text-[#6B6B6B] mt-1">Update your product information</p>
          </div>
          <Link
            href="/seller/dashboard"
            className="px-6 py-2 border border-[#722F37] text-[#722F37] rounded-full hover:bg-[#722F37] hover:text-white transition-all"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#E8E2D9] p-8">
          {/* Shop Information (Read-only display) */}
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#722F37] mb-2 flex items-center gap-2">
              <span>🏪</span> Shop Information
              <span className="text-sm font-normal text-blue-600">ℹ️ From your seller profile</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-sm text-[#6B6B6B] mb-1">Shop Name</p>
                <p className="font-medium text-[#2D2D2D]">{formData.shopName}</p>
              </div>
              <div>
                <p className="text-sm text-[#6B6B6B] mb-1">Shop Mobile</p>
                <p className="font-medium text-[#2D2D2D]">{formData.shopMobile}</p>
              </div>
              <div>
                <p className="text-sm text-[#6B6B6B] mb-1">Shop Location</p>
                <p className="font-medium text-[#2D2D2D]">{formData.shopLocation}</p>
              </div>
            </div>
          </div>

          {/* Product ID (Read-only) */}
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1">
              Product ID (Cannot be changed)
            </label>
            <p className="font-mono text-[#722F37] font-semibold">{formData.productId}</p>
          </div>

          {/* Basic Product Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="हिंदी में नाम"
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
                  {subCategories[formData.category as keyof typeof subCategories]?.map((sub) => (
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
                  placeholder="499"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Original Price (₹)</label>
                <input
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  placeholder="999"
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
                  placeholder="Describe your product..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Description (Hindi)</label>
                <textarea
                  value={formData.descriptionHi}
                  onChange={(e) => setFormData({ ...formData, descriptionHi: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  placeholder="उत्पाद का विवरण..."
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
                    placeholder="e.g., Cotton, Silk"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Fabric (Hindi)</label>
                  <input
                    type="text"
                    value={formData.fabricHi}
                    onChange={(e) => setFormData({ ...formData, fabricHi: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                    placeholder="कपड़े का प्रकार"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">
              Product Images <span className="text-red-500">*</span>
            </h2>
            <MultiImageUpload
              label="Upload product images (max 5)"
              currentImageIds={formData.images}
              onImagesChange={(imageIds) => setFormData({ ...formData, images: imageIds })}
              maxImages={5}
              sellerId={sellerId}
              category={formData.category}
              productId={formData.productId}
            />
            <p className="text-sm text-[#6B6B6B] mt-2">
              First image will be used as the main product image
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Updating Product...' : 'Update Product'}
            </button>
            <Link
              href="/seller/dashboard"
              className="px-8 py-3 border border-[#722F37] text-[#722F37] font-semibold rounded-full hover:bg-[#F5F0E8] transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
