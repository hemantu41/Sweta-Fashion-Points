'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MultiImageUpload from '@/components/MultiImageUpload';
import { useCategories, type CategoryNode } from '@/hooks/useCategories';

// Product type tabs
type ProductTab = 'clothes' | 'footwear' | 'beauty';

// Common fabric options for clothes
const fabricOptions = ['Cotton', 'Silk', 'Polyester', 'Rayon', 'Linen', 'Denim', 'Georgette', 'Chiffon', 'Velvet', 'Wool', 'Blend'];

// Common clothing sizes
const clothingSizes = [
  'Free Size',
  'One Size',
  // Letter sizes
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
  // Numeric sizes (for pants/jeans)
  '28', '30', '32', '34', '36', '38', '40', '42', '44', '46',
  // Kids sizes
  '0-3M', '3-6M', '6-12M', '12-18M', '18-24M',
  '1Y', '2Y', '3Y', '4Y', '5Y', '6Y', '7Y', '8Y', '9Y', '10Y', '11Y', '12Y',
  // Saree size
  '5.5M', '6M', '6.5M',
];

// Common colors with hex codes
const commonColors = [
  { name: 'Red', hex: '#FF0000' },
  { name: 'Dark Red', hex: '#8B0000' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Hot Pink', hex: '#FF69B4' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Gold', hex: '#FFD700' },
  { name: 'Green', hex: '#00FF00' },
  { name: 'Dark Green', hex: '#006400' },
  { name: 'Olive', hex: '#808000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Navy Blue', hex: '#000080' },
  { name: 'Sky Blue', hex: '#87CEEB' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Violet', hex: '#EE82EE' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Brown', hex: '#A52A2A' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#000000' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Cream', hex: '#FFFDD0' },
  { name: 'Peach', hex: '#FFDAB9' },
  { name: 'Turquoise', hex: '#40E0D0' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Magenta', hex: '#FF00FF' },
  { name: 'Cyan', hex: '#00FFFF' },
];

// Shoe sizes
const shoeSizes = ['6', '7', '8', '9', '10', '11', '12'];

// Common footwear materials
const footwearMaterials = [
  'Leather',
  'Synthetic Leather',
  'Canvas',
  'Rubber',
  'EVA (Ethylene Vinyl Acetate)',
  'Mesh',
  'Suede',
  'Textile',
  'PU (Polyurethane)',
  'Foam',
  'Nylon',
  'Cotton',
  'Denim',
  'Velvet',
  'Patent Leather'
];

export default function SellerAddProductPage() {
  const { user, sellerId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<ProductTab>('clothes');

  // ── Dynamic category tree (L1 → L2 → L3) ──────────────────────────────────
  const { tree } = useCategories();

  // Shared category selection state across all product tabs
  const [catIds, setCatIds] = useState({ l1: '', l2: '', l3: '' });

  const l1Nodes: CategoryNode[] = useMemo(() => tree, [tree]);

  const l2Nodes: CategoryNode[] = useMemo(() => {
    if (!catIds.l1) return [];
    const l1 = l1Nodes.find(n => n.id === catIds.l1);
    return l1?.children ?? [];
  }, [l1Nodes, catIds.l1]);

  const l3Nodes: CategoryNode[] = useMemo(() => {
    if (!catIds.l2) return [];
    const l2 = l2Nodes.find(n => n.id === catIds.l2);
    return l2?.children ?? [];
  }, [l2Nodes, catIds.l2]);

  const l1Node = useMemo(() => l1Nodes.find(n => n.id === catIds.l1) ?? null, [l1Nodes, catIds.l1]);
  const l2Node = useMemo(() => l2Nodes.find(n => n.id === catIds.l2) ?? null, [l2Nodes, catIds.l2]);
  const l3Node = useMemo(() => l3Nodes.find(n => n.id === catIds.l3) ?? null, [l3Nodes, catIds.l3]);

  // ── Common shop information
  const [shopInfo, setShopInfo] = useState({
    shopName: '',
    shopMobile: '',
    shopLocation: '',
  });

  // Clothes Form Data
  const [clothesData, setClothesData] = useState({
    productId: '',
    name: '',
    category: 'mens',
    subCategory: '',
    price: '',
    originalPrice: '',
    priceRange: 'mid',
    description: '',
    fabric: '',
    images: [] as string[],
    stockQuantity: '100',
  });

  // Footwear Form Data
  const [footwearData, setFootwearData] = useState({
    productId: '',
    name: '',
    category: 'mens',
    subCategory: '',
    brand: '',
    material: '',
    price: '',
    originalPrice: '',
    priceRange: 'mid',
    description: '',
    images: [] as string[],
    stockQuantity: '100',
  });

  // Beauty Form Data
  const [beautyData, setBeautyData] = useState({
    productId: '',
    name: '',
    category: 'makeup',
    subCategory: '',
    brand: '',
    shade: '',
    price: '',
    originalPrice: '',
    priceRange: 'mid',
    description: '',
    volume: '',
    expiryMonths: '',
    ingredients: '',
    images: [] as string[],
    stockQuantity: '100',
  });

  // Separate state for colors and sizes
  const [colors, setColors] = useState<{ name: string; hex: string }[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [newColor, setNewColor] = useState({ name: '', hex: '#000000' });
  const [newSize, setNewSize] = useState('');

  // Auto-generate product ID whenever L1/L2/L3 selection changes
  useEffect(() => {
    if (!catIds.l1) return;
    const l1Slug = l1Node?.slug || catIds.l1;
    const l2Slug = l2Node?.slug || '';
    const l3Slug = l3Node?.slug || '';
    const parts = [l1Slug, l2Slug, l3Slug].filter(Boolean);
    const randomNum = Date.now().toString().slice(-4) + Math.floor(Math.random() * 100);
    const generatedId = `${parts.join('_')}_${randomNum}`;

    setClothesData(prev => ({ ...prev, productId: generatedId }));
    setFootwearData(prev => ({ ...prev, productId: generatedId }));
    setBeautyData(prev => ({ ...prev, productId: generatedId }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catIds.l1, catIds.l2, catIds.l3]);

  // Auto-generate description for clothes (15 words)
  useEffect(() => {
    if (activeTab === 'clothes' && clothesData.name && l1Node) {
      const cat = l1Node.name;
      const sub = l2Node?.name || '';
      const autoDescription = `${clothesData.name}${sub ? ` - ${cat} ${sub}` : ` - ${cat}`}. Premium quality fabric with excellent fit and comfort for all-day wear.`;
      setClothesData(prev => ({ ...prev, description: autoDescription }));
    }
  }, [activeTab, clothesData.name, l1Node, l2Node]);

  // Auto-generate description for footwear (15 words)
  useEffect(() => {
    if (activeTab === 'footwear' && l1Node) {
      const cat = l1Node.name;
      const sub = l2Node?.name || '';
      const brandName = footwearData.brand || 'Premium';
      const autoDescription = `${brandName} ${cat}${sub ? ` ${sub}` : ''}. Comfortable and durable footwear with superior quality material and stylish design perfect for daily use.`;
      const autoName = `${brandName} ${cat}${sub ? ` ${sub}` : ''}`;
      setFootwearData(prev => ({ ...prev, name: autoName, description: autoDescription }));
    }
  }, [activeTab, footwearData.brand, l1Node, l2Node]);

  // Auto-generate description for beauty (15 words)
  useEffect(() => {
    if (activeTab === 'beauty' && beautyData.name && l1Node) {
      const cat = l1Node.name;
      const sub = l2Node?.name || '';
      const autoDescription = `${beautyData.name}${sub ? ` - ${cat} ${sub}` : ` - ${cat}`}. High-quality beauty product with premium ingredients for best results and satisfaction.`;
      setBeautyData(prev => ({ ...prev, description: autoDescription }));
    }
  }, [activeTab, beautyData.name, l1Node, l2Node]);

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

          setShopInfo({
            shopName: seller.businessName || '',
            shopMobile: seller.businessPhone || '',
            shopLocation: seller.addressLine1 || `${seller.city || ''}, ${seller.state || ''}`.trim(),
          });
        }
      } catch (error) {
        console.error('Error fetching seller profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchSellerProfile();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validate shop information
    if (!shopInfo.shopName || !shopInfo.shopMobile || !shopInfo.shopLocation) {
      setMessage('Please fill in all shop information fields (Shop Name, Mobile, Location)');
      setLoading(false);
      return;
    }

    if (shopInfo.shopMobile.length !== 10) {
      setMessage('Shop mobile number must be 10 digits');
      setLoading(false);
      return;
    }

    let productPayload: any = {};

    // Build product payload based on active tab
    if (activeTab === 'clothes') {
      if (!clothesData.productId) {
        setMessage('Please select category and subcategory to generate product ID');
        setLoading(false);
        return;
      }

      if (clothesData.images.length === 0) {
        setMessage('Please upload at least one product image');
        setLoading(false);
        return;
      }

      productPayload = {
        productId: clothesData.productId,
        name: clothesData.name,
        category: l1Node?.slug || l1Node?.name || '',
        subCategory: l2Node?.slug || l2Node?.name || '',
        l1CategoryId: catIds.l1 || null,
        l2CategoryId: catIds.l2 || null,
        l3CategoryId: catIds.l3 || null,
        price: parseInt(clothesData.price),
        originalPrice: clothesData.originalPrice ? parseInt(clothesData.originalPrice) : undefined,
        priceRange: clothesData.priceRange,
        description: clothesData.description,
        fabric: clothesData.fabric,
        mainImage: clothesData.images[0] || '',
        images: clothesData.images,
        colors: colors,
        sizes: sizes,
        stockQuantity: parseInt(clothesData.stockQuantity),
        isNewArrival: false,
        isBestSeller: false,
        shopName: shopInfo.shopName,
        shopMobile: shopInfo.shopMobile,
        shopLocation: shopInfo.shopLocation,
      };
    } else if (activeTab === 'footwear') {
      if (!footwearData.productId) {
        setMessage('Please select category and subcategory to generate product ID');
        setLoading(false);
        return;
      }

      if (footwearData.images.length === 0) {
        setMessage('Please upload at least one product image');
        setLoading(false);
        return;
      }

      productPayload = {
        productId: footwearData.productId,
        name: footwearData.name,
        category: l1Node?.slug || l1Node?.name || '',
        subCategory: l2Node?.slug || l2Node?.name || '',
        l1CategoryId: catIds.l1 || null,
        l2CategoryId: catIds.l2 || null,
        l3CategoryId: catIds.l3 || null,
        price: parseInt(footwearData.price),
        originalPrice: footwearData.originalPrice ? parseInt(footwearData.originalPrice) : undefined,
        priceRange: footwearData.priceRange,
        description: footwearData.description,
        fabric: `Brand: ${footwearData.brand}, Material: ${footwearData.material}`,
        mainImage: footwearData.images[0] || '',
        images: footwearData.images,
        colors: colors,
        sizes: sizes,
        stockQuantity: parseInt(footwearData.stockQuantity),
        isNewArrival: false,
        isBestSeller: false,
        shopName: shopInfo.shopName,
        shopMobile: shopInfo.shopMobile,
        shopLocation: shopInfo.shopLocation,
      };
    } else if (activeTab === 'beauty') {
      if (!beautyData.productId) {
        setMessage('Please select category and subcategory to generate product ID');
        setLoading(false);
        return;
      }

      if (beautyData.images.length === 0) {
        setMessage('Please upload at least one product image');
        setLoading(false);
        return;
      }

      productPayload = {
        productId: beautyData.productId,
        name: beautyData.name,
        category: l1Node?.slug || l1Node?.name || '',
        subCategory: l2Node?.slug || l2Node?.name || '',
        l1CategoryId: catIds.l1 || null,
        l2CategoryId: catIds.l2 || null,
        l3CategoryId: catIds.l3 || null,
        price: parseInt(beautyData.price),
        originalPrice: beautyData.originalPrice ? parseInt(beautyData.originalPrice) : undefined,
        priceRange: beautyData.priceRange,
        description: beautyData.description,
        fabric: `Brand: ${beautyData.brand}, Shade: ${beautyData.shade}, Volume: ${beautyData.volume}, Expiry: ${beautyData.expiryMonths} months`,
        mainImage: beautyData.images[0] || '',
        images: beautyData.images,
        colors: colors.length > 0 ? colors : [{ name: beautyData.shade, hex: '#000000' }],
        sizes: [],
        stockQuantity: parseInt(beautyData.stockQuantity),
        isNewArrival: false,
        isBestSeller: false,
        shopName: shopInfo.shopName,
        shopMobile: shopInfo.shopMobile,
        shopLocation: shopInfo.shopLocation,
      };
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          sellerId: sellerId,
          product: productPayload,
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

        {/* Product Type Tabs */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] p-2 mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('clothes')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
              activeTab === 'clothes'
                ? 'bg-[#722F37] text-white shadow-md'
                : 'text-[#6B6B6B] hover:bg-[#F0EDE8]'
            }`}
          >
            Clothes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('footwear')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
              activeTab === 'footwear'
                ? 'bg-[#722F37] text-white shadow-md'
                : 'text-[#6B6B6B] hover:bg-[#F0EDE8]'
            }`}
          >
            Footwear
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('beauty')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
              activeTab === 'beauty'
                ? 'bg-[#722F37] text-white shadow-md'
                : 'text-[#6B6B6B] hover:bg-[#F0EDE8]'
            }`}
          >
            Beauty & Makeup
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#E8E2D9] p-8">
          {/* Shop Information (Common for all tabs) */}
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#722F37] mb-2 flex items-center gap-2">
              <span></span> Shop Information
              {loadingProfile ? (
                <span className="text-sm font-normal text-gray-500">(Loading...)</span>
              ) : (
                <span className="text-sm font-normal text-green-600"> Auto-filled from your profile</span>
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
                  value={shopInfo.shopName}
                  onChange={(e) => setShopInfo({ ...shopInfo, shopName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  placeholder="e.g., Fashion Store"
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
                  value={shopInfo.shopMobile}
                  onChange={(e) => setShopInfo({ ...shopInfo, shopMobile: e.target.value.replace(/\D/g, '') })}
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
                  value={shopInfo.shopLocation}
                  onChange={(e) => setShopInfo({ ...shopInfo, shopLocation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  placeholder="e.g., Sector 15, Noida"
                />
              </div>
            </div>
          </div>

          {/* CLOTHES TAB */}
          {activeTab === 'clothes' && (
            <>
              {/* Basic Information */}
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
                      value={clothesData.name}
                      onChange={(e) => setClothesData({ ...clothesData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      placeholder="e.g., Classic Blue Jeans"
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

              {/* Auto-Generated Product ID */}
              {clothesData.productId && (
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
                          {clothesData.productId}
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
                      value={clothesData.price}
                      onChange={(e) => setClothesData({ ...clothesData, price: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      placeholder="499"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Original Price (₹)</label>
                    <input
                      type="number"
                      value={clothesData.originalPrice}
                      onChange={(e) => setClothesData({ ...clothesData, originalPrice: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      placeholder="999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Price Range</label>
                    <select
                      value={clothesData.priceRange}
                      onChange={(e) => setClothesData({ ...clothesData, priceRange: e.target.value })}
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
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                      Description <span className="text-xs text-gray-500">(Auto-generated, you can edit)</span>
                    </label>
                    <textarea
                      value={clothesData.description}
                      onChange={(e) => setClothesData({ ...clothesData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      placeholder="Product description..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Clothes Fabric</label>
                      <select
                        value={clothesData.fabric}
                        onChange={(e) => setClothesData({ ...clothesData, fabric: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      >
                        <option value="">Select Fabric</option>
                        {fabricOptions.map((fabric) => (
                          <option key={fabric} value={fabric}>{fabric}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                        Stock Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={clothesData.stockQuantity}
                        onChange={(e) => setClothesData({ ...clothesData, stockQuantity: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[#722F37] mb-4">Available Colors (Optional)</h2>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#2D2D2D] mb-1">Select Color</label>
                      <select
                        value={newColor.name}
                        onChange={(e) => {
                          const selectedColor = commonColors.find(c => c.name === e.target.value);
                          if (selectedColor) {
                            setNewColor({ name: selectedColor.name, hex: selectedColor.hex });
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      >
                        <option value="">Select a color</option>
                        {commonColors.map((color) => (
                          <option
                            key={color.name}
                            value={color.name}
                            disabled={colors.some(c => c.name === color.name)}
                          >
                            {color.name} {colors.some(c => c.name === color.name) ? '(Added)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#2D2D2D] mb-1">Color Preview</label>
                      <div className="flex items-center gap-2 h-10">
                        <input
                          type="color"
                          value={newColor.hex}
                          onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                          className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                          title="Adjust color if needed"
                        />
                        <span className="text-xs text-gray-500 flex-1">
                          {newColor.name && `${newColor.name}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (newColor.name && !colors.some(c => c.name === newColor.name)) {
                            setColors([...colors, { name: newColor.name, hex: newColor.hex }]);
                            setNewColor({ name: '', hex: '#000000' });
                          }
                        }}
                        className="w-full px-4 py-2 bg-[#722F37] text-white text-sm rounded-lg hover:bg-[#5a252c] transition-colors"
                      >
                        Add Color
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Select a color from the dropdown. You can adjust the shade using the color picker.</p>
                </div>

                {colors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg"
                      >
                        <div
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: color.hex }}
                        ></div>
                        <span className="text-sm">{color.name}</span>
                        <button
                          type="button"
                          onClick={() => setColors(colors.filter((_, i) => i !== index))}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sizes */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[#722F37] mb-4">Available Sizes (Optional)</h2>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex gap-3">
                    <select
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                    >
                      <option value="">Select Size</option>
                      {clothingSizes.map((size) => (
                        <option key={size} value={size} disabled={sizes.includes(size)}>
                          {size} {sizes.includes(size) ? '(Added)' : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (newSize && !sizes.includes(newSize)) {
                          setSizes([...sizes, newSize]);
                          setNewSize('');
                        }
                      }}
                      className="px-6 py-2 bg-[#722F37] text-white rounded-lg hover:bg-[#5a252c] transition-colors"
                    >
                      Add Size
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Select a size from the dropdown and click Add Size</p>
                </div>

                {sizes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg"
                      >
                        <span className="text-sm font-medium">{size}</span>
                        <button
                          type="button"
                          onClick={() => setSizes(sizes.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[#722F37] mb-4">
                  Product Images <span className="text-red-500">*</span>
                </h2>
                <MultiImageUpload
                  label="Upload product images (max 5)"
                  currentImageIds={clothesData.images}
                  onImagesChange={(imageIds) => setClothesData({ ...clothesData, images: imageIds })}
                  maxImages={5}
                  sellerId={sellerId}
                  category={clothesData.category}
                  productId={clothesData.productId}
                />
                <p className="text-sm text-[#6B6B6B] mt-2">
                  First image will be used as the main product image
                </p>
              </div>
            </>
          )}

          {/* FOOTWEAR TAB */}
          {activeTab === 'footwear' && (
            <>
              {/* Basic Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[#722F37] mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={footwearData.brand}
                      onChange={(e) => setFootwearData({ ...footwearData, brand: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      placeholder="e.g., Nike, Adidas, Local Brand"
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
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                      Material <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={footwearData.material}
                      onChange={(e) => setFootwearData({ ...footwearData, material: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                    >
                      <option value="">Select Material</option>
                      {footwearMaterials.map((material) => (
                        <option key={material} value={material}>
                          {material}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Auto-Generated Product ID */}
              {footwearData.productId && (
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
                          {footwearData.productId}
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
                      value={footwearData.price}
                      onChange={(e) => setFootwearData({ ...footwearData, price: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      placeholder="1999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Original Price (₹)</label>
                    <input
                      type="number"
                      value={footwearData.originalPrice}
                      onChange={(e) => setFootwearData({ ...footwearData, originalPrice: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      placeholder="2999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Price Range</label>
                    <select
                      value={footwearData.priceRange}
                      onChange={(e) => setFootwearData({ ...footwearData, priceRange: e.target.value })}
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
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                      Description <span className="text-xs text-gray-500">(Auto-generated, you can edit)</span>
                    </label>
                    <textarea
                      value={footwearData.description}
                      onChange={(e) => setFootwearData({ ...footwearData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      placeholder="Product description..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                      Stock Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={footwearData.stockQuantity}
                      onChange={(e) => setFootwearData({ ...footwearData, stockQuantity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[#722F37] mb-4">Available Colors (Optional)</h2>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#2D2D2D] mb-1">Select Color</label>
                      <select
                        value={newColor.name}
                        onChange={(e) => {
                          const selectedColor = commonColors.find(c => c.name === e.target.value);
                          if (selectedColor) {
                            setNewColor({ name: selectedColor.name, hex: selectedColor.hex });
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      >
                        <option value="">Select a color</option>
                        {commonColors.map((color) => (
                          <option
                            key={color.name}
                            value={color.name}
                            disabled={colors.some(c => c.name === color.name)}
                          >
                            {color.name} {colors.some(c => c.name === color.name) ? '(Added)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#2D2D2D] mb-1">Color Preview</label>
                      <div className="flex items-center gap-2 h-10">
                        <input
                          type="color"
                          value={newColor.hex}
                          onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                          className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                          title="Adjust color if needed"
                        />
                        <span className="text-xs text-gray-500 flex-1">
                          {newColor.name && `${newColor.name}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (newColor.name && !colors.some(c => c.name === newColor.name)) {
                            setColors([...colors, { name: newColor.name, hex: newColor.hex }]);
                            setNewColor({ name: '', hex: '#000000' });
                          }
                        }}
                        className="w-full px-4 py-2 bg-[#722F37] text-white text-sm rounded-lg hover:bg-[#5a252c] transition-colors"
                      >
                        Add Color
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Select a color from the dropdown. You can adjust the shade using the color picker.</p>
                </div>

                {colors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg"
                      >
                        <div
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: color.hex }}
                        ></div>
                        <span className="text-sm">{color.name}</span>
                        <button
                          type="button"
                          onClick={() => setColors(colors.filter((_, i) => i !== index))}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sizes - Pre-populated for footwear */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[#722F37] mb-4">
                  Shoe Sizes <span className="text-red-500">*</span>
                </h2>
                <p className="text-sm text-[#6B6B6B] mb-4">Select available sizes for this footwear</p>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                    {shoeSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          if (sizes.includes(size)) {
                            setSizes(sizes.filter(s => s !== size));
                          } else {
                            setSizes([...sizes, size]);
                          }
                        }}
                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                          sizes.includes(size)
                            ? 'bg-[#722F37] text-white border-[#722F37]'
                            : 'bg-white text-[#2D2D2D] border-gray-300 hover:border-[#722F37]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {sizes.length > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                     Selected sizes: {sizes.join(', ')}
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[#722F37] mb-4">
                  Product Images <span className="text-red-500">*</span>
                </h2>
                <MultiImageUpload
                  label="Upload footwear images (max 5)"
                  currentImageIds={footwearData.images}
                  onImagesChange={(imageIds) => setFootwearData({ ...footwearData, images: imageIds })}
                  maxImages={5}
                  sellerId={sellerId}
                  category="footwear"
                  productId={footwearData.productId}
                />
                <p className="text-sm text-[#6B6B6B] mt-2">
                  First image will be used as the main product image
                </p>
              </div>
            </>
          )}

          {/* BEAUTY & MAKEUP TAB */}
          {activeTab === 'beauty' && (
            <>
              {/* Basic Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[#722F37] mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={beautyData.name}
                      onChange={(e) => setBeautyData({ ...beautyData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      placeholder="e.g., Matte Lipstick"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={beautyData.brand}
                      onChange={(e) => setBeautyData({ ...beautyData, brand: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      placeholder="e.g., Lakme, Maybelline, Local Brand"
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
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                      Shade/Color
                    </label>
                    <input
                      type="text"
                      value={beautyData.shade}
                      onChange={(e) => setBeautyData({ ...beautyData, shade: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      placeholder="e.g., Ruby Red, Fair, Medium, Dark"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                      Volume/Quantity
                    </label>
                    <input
                      type="text"
                      value={beautyData.volume}
                      onChange={(e) => setBeautyData({ ...beautyData, volume: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      placeholder="e.g., 50ml, 100g, 3.5g"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                      Expiry Period <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        required
                        value={beautyData.expiryMonths}
                        onChange={(e) => setBeautyData({ ...beautyData, expiryMonths: e.target.value })}
                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                        placeholder="12"
                      />
                      <span className="text-sm text-[#6B6B6B]">months from manufacturing</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto-Generated Product ID */}
              {beautyData.productId && (
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
                          {beautyData.productId}
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
                      value={beautyData.price}
                      onChange={(e) => setBeautyData({ ...beautyData, price: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      placeholder="299"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Original Price (₹)</label>
                    <input
                      type="number"
                      value={beautyData.originalPrice}
                      onChange={(e) => setBeautyData({ ...beautyData, originalPrice: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      placeholder="499"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Price Range</label>
                    <select
                      value={beautyData.priceRange}
                      onChange={(e) => setBeautyData({ ...beautyData, priceRange: e.target.value })}
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
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                      Description <span className="text-xs text-gray-500">(Auto-generated, you can edit)</span>
                    </label>
                    <textarea
                      value={beautyData.description}
                      onChange={(e) => setBeautyData({ ...beautyData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      placeholder="Product description..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Ingredients (Optional)</label>
                    <textarea
                      value={beautyData.ingredients}
                      onChange={(e) => setBeautyData({ ...beautyData, ingredients: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      placeholder="List main ingredients..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                      Stock Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={beautyData.stockQuantity}
                      onChange={(e) => setBeautyData({ ...beautyData, stockQuantity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                    />
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
                  currentImageIds={beautyData.images}
                  onImagesChange={(imageIds) => setBeautyData({ ...beautyData, images: imageIds })}
                  maxImages={5}
                  sellerId={sellerId}
                  category="beauty"
                  productId={beautyData.productId}
                />
                <p className="text-sm text-[#6B6B6B] mt-2">
                  First image will be used as the main product image
                </p>
              </div>
            </>
          )}

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
