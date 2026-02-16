'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MultiImageUpload from '@/components/MultiImageUpload';

export default function SellerAddProductPage() {
  const { user, sellerId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
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

  // Auto-generate product ID when category and subcategory are selected
  useEffect(() => {
    if (formData.category && formData.subCategory) {
      // Generate random number (timestamp + random)
      const randomNum = Date.now().toString().slice(-4) + Math.floor(Math.random() * 100);

      // Format: category_subcategory_randomnumber
      const generatedId = `${formData.category}_${formData.subCategory}_${randomNum}`;

      setFormData(prev => ({ ...prev, productId: generatedId }));
    }
  }, [formData.category, formData.subCategory]);

  // Fetch seller profile and pre-populate shop information
  useEffect(() => {
    const fetchSellerProfile = async () => {
      if (!user?.id) {
        setLoadingProfile(false);
        return;
      }

      try {
        const response = await fetch(`/api/sellers/me?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          const seller = data.seller;

          // Pre-populate shop information from seller profile
          setFormData(prev => ({
            ...prev,
            shopName: seller.businessName || '',
            shopMobile: seller.businessPhone || '',
            shopLocation: seller.addressLine1 || `${seller.city || ''}, ${seller.state || ''}`.trim(),
          }));
        }
      } catch (error) {
        console.error('Error fetching seller profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchSellerProfile();
  }, [user?.id]);

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

    // Validate product ID is generated
    if (!formData.productId) {
      setMessage('Please select category and subcategory to generate product ID');
      setLoading(false);
      return;
    }

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
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          sellerId: sellerId, // Include seller ID
          product: {
            productId: formData.productId,
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
            colors: [],
            sizes: [],
            stockQuantity: parseInt(formData.stockQuantity),
            isNewArrival: false,
            isBestSeller: false,
            // Shop Information
            shopName: formData.shopName,
            shopMobile: formData.shopMobile,
            shopLocation: formData.shopLocation,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Product created successfully! It will be visible to customers once approved by admin.');
        setTimeout(() => router.push('/seller/dashboard'), 1500);
      } else {
        setMessage(data.error || 'Failed to create product');
      }
    } catch (error) {
      setMessage('Error creating product');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while fetching seller profile
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
          </div>
          <p className="text-[#6B6B6B] mt-4">Loading your shop information...</p>
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
              Add New Product
            </h1>
            <p className="text-[#6B6B6B] mt-1">Add a new product to your shop</p>
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
          {/* Shop Information (Auto-populated) */}
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#722F37] mb-2 flex items-center gap-2">
              <span>🏪</span> Shop Information
              {loadingProfile ? (
                <span className="text-sm font-normal text-gray-500">(Loading...)</span>
              ) : (
                <span className="text-sm font-normal text-green-600">✓ Auto-filled from your profile</span>
              )}
            </h2>
            <p className="text-xs text-gray-600 mb-4">
              These details are automatically filled from your seller profile. You can update them if needed.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Shop Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  placeholder="e.g., Sweta Fashion Store"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Shop Mobile <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formData.shopMobile}
                  onChange={(e) => setFormData({ ...formData, shopMobile: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  placeholder="10 digit number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Shop Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.shopLocation}
                  onChange={(e) => setFormData({ ...formData, shopLocation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  placeholder="e.g., Sector 15, Noida"
                />
              </div>
            </div>
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

          {/* Auto-Generated Product ID */}
          {formData.productId && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-900 mb-1">
                    Auto-Generated Product ID
                  </h3>
                  <p className="text-xs text-green-700 mb-3">
                    This unique ID is automatically created based on category and subcategory
                  </p>
                  <div className="bg-white rounded-lg p-3 border border-green-300">
                    <code className="text-sm font-mono text-[#722F37] font-semibold break-all">
                      {formData.productId}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}

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
              {loading ? 'Creating Product...' : 'Create Product'}
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
