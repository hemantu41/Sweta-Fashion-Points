'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import MultiImageUpload from '@/components/MultiImageUpload';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState('');
  const [productId, setProductId] = useState('');

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
    colors: [] as Array<{ name: string; nameHi: string; hex: string }>,
    sizes: [] as string[],
    stockQuantity: '100',
    isNewArrival: false,
    isBestSeller: false,
    isActive: true,
  });

  // Color and size management
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState({ name: '', nameHi: '', hex: '#000000' });

  const subCategories = {
    mens: ['jeans', 'shirts', 'tshirts', 'ethnic'],
    womens: ['daily', 'party', 'ethnic', 'seasonal'],
    sarees: ['daily', 'party', 'wedding', 'festival'],
    kids: ['0-3', '4-7', '8-12'],
  };

  // Fetch product data
  useEffect(() => {
    async function fetchProduct() {
      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        setProductId(id);

        const response = await fetch(`/api/products/${id}`, { cache: 'no-store' });
        const data = await response.json();

        if (response.ok && data.product) {
          const product = data.product;
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
            images: product.images || (product.mainImage ? [product.mainImage] : []),
            colors: product.colors || [],
            sizes: product.sizes || [],
            stockQuantity: product.stockQuantity?.toString() || '100',
            isNewArrival: product.isNewArrival || false,
            isBestSeller: product.isBestSeller || false,
            isActive: product.isActive !== false,
          });
        } else {
          setMessage('Product not found');
        }
      } catch (error) {
        setMessage('Error loading product');
        console.error('Fetch error:', error);
      } finally {
        setFetching(false);
      }
    }

    fetchProduct();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

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
            colors: formData.colors,
            sizes: formData.sizes,
            stockQuantity: parseInt(formData.stockQuantity),
            isNewArrival: formData.isNewArrival,
            isBestSeller: formData.isBestSeller,
            isActive: formData.isActive,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Product updated successfully!');
        setTimeout(() => router.push('/admin/products'), 1500);
      } else {
        setMessage(data.error || 'Failed to update product');
      }
    } catch (error) {
      setMessage('Error updating product');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
            Edit Product
          </h1>
          <p className="text-[#6B6B6B] mt-1">Update product details in your inventory</p>
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
                  Product ID
                </label>
                <input
                  type="text"
                  disabled
                  value={formData.productId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-[#6B6B6B] mt-1">Product ID cannot be changed</p>
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
                  placeholder="Describe the product..."
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

          {/* Colors */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">Available Colors (Optional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <input
                type="text"
                value={newColor.name}
                onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                placeholder="Color name (English)"
              />
              <input
                type="text"
                value={newColor.nameHi}
                onChange={(e) => setNewColor({ ...newColor, nameHi: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                placeholder="रंग का नाम (Hindi)"
              />
              <input
                type="color"
                value={newColor.hex}
                onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={() => {
                  if (newColor.name.trim()) {
                    setFormData({ ...formData, colors: [...formData.colors, newColor] });
                    setNewColor({ name: '', nameHi: '', hex: '#000000' });
                  }
                }}
                className="px-6 py-2 bg-[#722F37] text-white rounded-lg hover:bg-[#8B3D47] transition-colors"
              >
                Add Color
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.colors.map((color, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[#F5F0E8] px-3 py-1.5 rounded-lg border border-[#E8E2D9]">
                  <div className="w-5 h-5 rounded-full border border-gray-300" style={{ backgroundColor: color.hex }}></div>
                  <span className="text-sm font-medium text-[#2D2D2D]">{color.name}</span>
                  {color.nameHi && <span className="text-sm text-[#6B6B6B]">({color.nameHi})</span>}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, colors: formData.colors.filter((_, i) => i !== idx) })}
                    className="text-red-600 hover:text-red-700 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
              {formData.colors.length === 0 && (
                <p className="text-sm text-[#6B6B6B]">No colors added yet</p>
              )}
            </div>
          </div>

          {/* Sizes */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">Available Sizes (Optional)</h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                placeholder="e.g., S, M, L, XL or 30, 32, 34"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newSize.trim() && !formData.sizes.includes(newSize.trim())) {
                      setFormData({ ...formData, sizes: [...formData.sizes, newSize.trim()] });
                      setNewSize('');
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newSize.trim() && !formData.sizes.includes(newSize.trim())) {
                    setFormData({ ...formData, sizes: [...formData.sizes, newSize.trim()] });
                    setNewSize('');
                  }
                }}
                className="px-6 py-2 bg-[#722F37] text-white rounded-lg hover:bg-[#8B3D47] transition-colors"
              >
                Add Size
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.sizes.map((size, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[#F5F0E8] px-3 py-1.5 rounded-lg border border-[#E8E2D9]">
                  <span className="text-sm font-medium text-[#2D2D2D]">{size}</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sizes: formData.sizes.filter((_, i) => i !== idx) })}
                    className="text-red-600 hover:text-red-700 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
              {formData.sizes.length === 0 && (
                <p className="text-sm text-[#6B6B6B]">No sizes added yet</p>
              )}
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
            />
            <p className="text-sm text-[#6B6B6B] mt-2">
              First image will be used as the main product image
            </p>
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
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-[#722F37] border-gray-300 rounded focus:ring-[#722F37]"
                />
                <span className="text-sm font-medium text-[#2D2D2D]">Active (visible on website)</span>
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
              {loading ? 'Updating...' : 'Update Product'}
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
