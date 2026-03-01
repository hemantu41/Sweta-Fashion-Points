'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Seller {
  id: string;
  businessName: string;
  status: string;
  commissionPercentage: number;
}

interface Product {
  id: string;
  productId: string;
  name: string;
  nameHi?: string;
  category: string;
  subCategory?: string;
  price: number;
  originalPrice?: number;
  priceRange?: string;
  description?: string;
  descriptionHi?: string;
  fabric?: string;
  fabricHi?: string;
  mainImage?: string;
  images?: string[];
  colors?: Array<{ name: string; nameHi?: string; hex: string }>;
  sizes?: string[];
  stockQuantity: number;
  isActive: boolean;
  approvalStatus?: string;
  rejectionReason?: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
  deletedByRole?: string | null;
  deletionReason?: string | null;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
}

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deletionHistory, setDeletionHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [deletionReason, setDeletionReason] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchSellerData();
  }, [user]);

  const fetchSellerData = async () => {
    try {
      setLoading(true);

      // Fetch seller profile first
      const sellerResponse = await fetch(`/api/sellers/me?userId=${user?.id}`, {
        cache: 'no-store'
      });
      const sellerData = await sellerResponse.json();

      if (!sellerResponse.ok) {
        alert('You are not registered as a seller. Please contact admin.');
        router.push('/');
        return;
      }

      // Check if seller is approved before fetching products
      if (sellerData.seller.status !== 'approved') {
        alert(`Your seller account is ${sellerData.seller.status}. Please wait for admin approval.`);
        router.push('/');
        return;
      }

      // Set seller data immediately so UI can start rendering
      setSeller(sellerData.seller);

      // Fetch products - this will be faster now
      // Add timestamp to bust both browser and server cache
      const timestamp = Date.now();
      const productsResponse = await fetch(
        `/api/products?sellerId=${sellerData.seller.id}&isActive=all&_t=${timestamp}`,
        { cache: 'no-store' }
      );
      const productsData = await productsResponse.json();

      if (productsResponse.ok) {
        setProducts(productsData.products || []);
      }
    } catch (error) {
      console.error('Fetch seller data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (productId: string) => {
    setProductToDelete(productId);
    setDeletionReason('');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete || !user?.id) return;

    if (!deletionReason.trim()) {
      alert('Please provide a reason for deletion');
      return;
    }

    try {
      const response = await fetch(`/api/products/${productToDelete}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          deletionReason: deletionReason.trim(),
          deletedByRole: 'seller',
        }),
      });

      if (response.ok) {
        // Remove deleted product from local state immediately
        setProducts(prev => prev.filter(p => p.id !== productToDelete));
        setShowDeleteModal(false);
        setShowModal(false);
        setProductToDelete(null);
        setDeletionReason('');
        setSelectedProduct(null);
        alert('Product deleted successfully');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete product');
      }
    } catch (error) {
      alert('Error deleting product');
    }
  };

  const handleProductClick = async (product: Product) => {
    // Set product and show modal
    setSelectedProduct(product);
    setShowModal(true);

    // Fetch deletion history if product has been deleted
    if (product.deletedAt) {
      setLoadingHistory(true);
      try {
        const response = await fetch(`/api/products/${product.id}/deletion-history`);
        const data = await response.json();
        if (response.ok) {
          setDeletionHistory(data.history || []);
        }
      } catch (error) {
        console.error('Error fetching deletion history:', error);
      } finally {
        setLoadingHistory(false);
      }
    } else {
      setDeletionHistory([]);
    }

    // For approved/pending (not rejected or deleted), try to fetch full details
    if (product.approvalStatus !== 'rejected' && !product.deletedAt) {
      try {
        const response = await fetch(`/api/products/${product.id}?sellerId=${product.sellerId}`);
        const data = await response.json();
        if (response.ok && data.product) {
          setSelectedProduct(data.product);
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-white to-[#F5F0E8] p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-9 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Navigation Tabs Skeleton */}
          <div className="bg-white rounded-xl shadow-md mb-6 p-2 flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-1 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-[#E8E2D9]">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Table Skeleton */}
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-white to-[#F5F0E8] p-8">
        <div className="max-w-7xl mx-auto text-center py-12">
          <p className="text-red-600">Not authorized as seller</p>
        </div>
      </div>
    );
  }

  // Apply filters
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                         p.productId.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    const matchesApprovalStatus = !approvalStatusFilter || p.approvalStatus === approvalStatusFilter;
    const matchesActiveStatus = !activeStatusFilter ||
      (activeStatusFilter === 'active' ? p.isActive === true : p.isActive === false);
    const matchesStock = !stockFilter ||
      (stockFilter === 'in-stock' ? p.stockQuantity > 0 :
       stockFilter === 'low-stock' ? p.stockQuantity < 10 && p.stockQuantity > 0 :
       p.stockQuantity === 0);
    return matchesSearch && matchesCategory && matchesApprovalStatus &&
           matchesActiveStatus && matchesStock;
  });

  const stats = {
    total: products.length,
    active: products.filter(p => p.isActive).length,
    pending: products.filter(p => p.approvalStatus === 'pending').length,
    approved: products.filter(p => p.approvalStatus === 'approved').length,
    lowStock: products.filter(p => p.stockQuantity < 10).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-white to-[#F5F0E8] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
            Seller Dashboard
          </h1>
          <p className="text-[#6B6B6B] mt-2">Welcome, {seller.businessName}</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6 p-2 flex gap-2 overflow-x-auto">
          <Link
            href="/seller/dashboard"
            className="flex-1 min-w-[120px] py-3 px-6 rounded-lg font-medium bg-[#722F37] text-white text-center"
          >
            Dashboard
          </Link>
          <Link
            href="/seller/dashboard/earnings"
            className="flex-1 min-w-[120px] py-3 px-6 rounded-lg font-medium text-[#6B6B6B] hover:bg-[#F0EDE8] transition-colors text-center"
          >
            Earnings
          </Link>
          <Link
            href="/seller/dashboard/analytics"
            className="flex-1 min-w-[120px] py-3 px-6 rounded-lg font-medium text-[#6B6B6B] hover:bg-[#F0EDE8] transition-colors text-center"
          >
            Analytics
          </Link>
          <Link
            href="/seller/dashboard/products/new"
            className="flex-1 min-w-[120px] py-3 px-6 rounded-lg font-medium text-[#6B6B6B] hover:bg-[#F0EDE8] transition-colors text-center"
          >
            + Add Product
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-[#E8E2D9]">
            <p className="text-sm text-[#6B6B6B] mb-1">Total Products</p>
            <p className="text-3xl font-bold text-[#722F37]">{stats.total}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <p className="text-sm text-green-700 mb-1">Approved</p>
            <p className="text-3xl font-bold text-green-800">{stats.approved}</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
            <p className="text-sm text-orange-700 mb-1">Pending Approval</p>
            <p className="text-3xl font-bold text-orange-800">{stats.pending}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-6 border border-red-200">
            <p className="text-sm text-red-700 mb-1">Low Stock</p>
            <p className="text-3xl font-bold text-red-800">{stats.lowStock}</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#722F37]">My Products</h2>
          {products.length > 0 && (
            <Link
              href="/seller/dashboard/products/new"
              className="px-6 py-3 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white rounded-full font-semibold hover:shadow-lg transition-all"
            >
              + Add New Product
            </Link>
          )}
        </div>

        {/* Filters */}
        {products.length > 0 && (
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="mens">Men's</option>
                <option value="womens">Women's</option>
                <option value="sarees">Sarees</option>
                <option value="kids">Kids</option>
              </select>

              <select
                value={approvalStatusFilter}
                onChange={(e) => setApprovalStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
              >
                <option value="">All Approval Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={activeStatusFilter}
                onChange={(e) => setActiveStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
              >
                <option value="">All Stock</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock (&lt;10)</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>

              {/* Clear Filters Button */}
              {(search || categoryFilter || approvalStatusFilter || activeStatusFilter || stockFilter) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setCategoryFilter('');
                    setApprovalStatusFilter('');
                    setActiveStatusFilter('');
                    setStockFilter('');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] overflow-hidden">
          {products.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[#6B6B6B] mb-4">You haven't added any products yet.</p>
              <Link
                href="/seller/dashboard/products/new"
                className="inline-block px-6 py-3 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white rounded-full font-semibold hover:shadow-lg transition-all"
              >
                Add Your First Product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Image</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Product ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Price</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Stock</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Approval</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Active</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9]">
                  {filteredProducts.map((product, index) => (
                    <tr
                      key={product.id}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]'} cursor-pointer hover:bg-[#F0EDE8] transition-colors`}
                      onClick={() => handleProductClick(product)}
                    >
                      <td className="px-6 py-4">
                          {product.mainImage ? (
                            <Image
                              src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_60,h_60,c_fill/${product.mainImage}`}
                              alt={product.name}
                              width={60}
                              height={60}
                              className="rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-[60px] h-[60px] bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-2xl">📦</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-[#6B6B6B]">{product.productId}</td>
                        <td className="px-6 py-4 font-semibold text-[#2D2D2D]">{product.name}</td>
                        <td className="px-6 py-4 text-[#6B6B6B] capitalize">{product.category}</td>
                        <td className="px-6 py-4 font-bold text-[#722F37]">₹{product.price.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={product.stockQuantity < 10 ? 'text-orange-600 font-bold' : 'text-[#2D2D2D]'}>
                            {product.stockQuantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            product.approvalStatus === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : product.approvalStatus === 'pending'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {product.approvalStatus === 'approved' ? 'Approved' : product.approvalStatus === 'pending' ? 'Pending' : 'Rejected'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            product.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {product.isActive ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/seller/dashboard/products/edit/${product.id}`}
                              className="px-3 py-1 bg-[#722F37] text-white text-xs rounded-lg hover:bg-[#8B3D47]"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && products.length > 0 && (
                <div className="text-center py-8 border-t border-[#E8E2D9]">
                  <p className="text-[#6B6B6B]">No products match your filters</p>
                  <button
                    onClick={() => {
                      setSearch('');
                      setCategoryFilter('');
                      setApprovalStatusFilter('');
                      setActiveStatusFilter('');
                      setStockFilter('');
                    }}
                    className="mt-3 px-4 py-2 text-sm text-[#722F37] hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Seller Info */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-2">Seller Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-semibold">Business Name:</span>
              <p className="text-blue-900">{seller.businessName}</p>
            </div>
            <div>
              <span className="text-blue-700 font-semibold">Account Status:</span>
              <p className="text-blue-900 capitalize">{seller.status}</p>
            </div>
            <div>
              <span className="text-blue-700 font-semibold">Commission:</span>
              <p className="text-blue-900">{seller.commissionPercentage}%</p>
            </div>
          </div>
        </div>

        {/* Product Details Modal */}
        {showModal && selectedProduct && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-[#E8E2D9] px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#722F37]">
                  {selectedProduct.approvalStatus === 'rejected' ? 'Rejection Details' : 'Product Details'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[#6B6B6B] hover:text-[#2D2D2D] transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {selectedProduct.approvalStatus === 'rejected' ? (
                  /* Rejection Reason Display */
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-6">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-red-800 mb-2">Why was this product rejected?</h3>
                        <p className="text-red-700 mb-4">{selectedProduct.rejectionReason}</p>
                        <div className="bg-white rounded-lg p-4 border border-red-200">
                          <p className="text-sm font-semibold text-[#2D2D2D] mb-2">Product: {selectedProduct.name}</p>
                          <p className="text-sm text-[#6B6B6B]">Product ID: {selectedProduct.productId}</p>
                        </div>
                        <div className="mt-4 flex gap-3">
                          <Link
                            href={`/seller/dashboard/products/edit/${selectedProduct.id}`}
                            className="px-4 py-2 bg-[#722F37] text-white rounded-lg hover:bg-[#8B3D47] transition-colors"
                          >
                            Edit Product
                          </Link>
                          <button
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 border border-[#E8E2D9] text-[#2D2D2D] rounded-lg hover:bg-[#F0EDE8] transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Product Details Display */
                  <div className="space-y-6">
                    {/* Images */}
                    {selectedProduct.mainImage && (
                      <div className="flex gap-4 overflow-x-auto">
                        <div className="flex-shrink-0">
                          <Image
                            src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_fill/${selectedProduct.mainImage}`}
                            alt={selectedProduct.name}
                            width={300}
                            height={300}
                            className="rounded-lg object-cover border border-[#E8E2D9]"
                          />
                        </div>
                        {selectedProduct.images && selectedProduct.images.length > 0 && (
                          <div className="flex gap-2">
                            {selectedProduct.images.slice(0, 3).map((img, idx) => (
                              <Image
                                key={idx}
                                src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_100,h_100,c_fill/${img}`}
                                alt={`${selectedProduct.name} ${idx + 1}`}
                                width={100}
                                height={100}
                                className="rounded-lg object-cover border border-[#E8E2D9]"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Basic Info */}
                    <div>
                      <h3 className="text-2xl font-bold text-[#2D2D2D] mb-2">{selectedProduct.name}</h3>
                      {selectedProduct.nameHi && (
                        <p className="text-lg text-[#6B6B6B] mb-2">{selectedProduct.nameHi}</p>
                      )}
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-3xl font-bold text-[#722F37]">₹{selectedProduct.price.toLocaleString('en-IN')}</span>
                        {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                          <span className="text-lg text-gray-400 line-through">₹{selectedProduct.originalPrice.toLocaleString('en-IN')}</span>
                        )}
                      </div>
                      {selectedProduct.priceRange && (
                        <p className="text-sm text-[#6B6B6B] mb-4">Price Range: {selectedProduct.priceRange}</p>
                      )}
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedProduct.approvalStatus === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {selectedProduct.approvalStatus === 'approved' ? 'Approved' : 'Pending Approval'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedProduct.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedProduct.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {selectedProduct.isNewArrival && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">New Arrival</span>
                      )}
                      {selectedProduct.isBestSeller && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Best Seller</span>
                      )}
                    </div>

                    {/* Deletion History - Show complete history of all deletion attempts */}
                    {selectedProduct.deletedAt && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Product Deletion History
                          {deletionHistory.length > 1 && (
                            <span className="ml-auto text-xs bg-red-700 text-white px-2 py-1 rounded-full">
                              {deletionHistory.length} deletions
                            </span>
                          )}
                        </h4>

                        {loadingHistory ? (
                          <div className="text-center py-4 text-red-700">Loading deletion history...</div>
                        ) : deletionHistory.length > 0 ? (
                          <div className="space-y-3">
                            {deletionHistory.map((history, index) => (
                              <div
                                key={history.id}
                                className={`bg-white rounded-lg p-3 border ${
                                  index === 0 ? 'border-red-300' : 'border-red-200'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-xs font-semibold ${index === 0 ? 'text-red-900' : 'text-red-700'}`}>
                                    {index === 0 ? '🔴 Most Recent' : `Deletion #${deletionHistory.length - index}`}
                                  </span>
                                  <span className="text-xs text-red-600">
                                    {new Date(history.deletedAt).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-red-700">Deleted By:</span>
                                    <span className="text-sm font-semibold text-red-900">
                                      {history.deletedByRole === 'admin' && '🛡️ Admin'}
                                      {history.deletedByRole === 'seller' && '🏪 Seller'}
                                      {!history.deletedByRole && 'User'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-xs font-medium text-red-700">Reason: </span>
                                    <span className="text-sm text-red-800">{history.deletionReason}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium text-red-700 mb-1">Deleted By:</p>
                              <p className="text-sm font-semibold text-red-900">
                                {selectedProduct.deletedByRole === 'admin' && '🛡️ Admin'}
                                {selectedProduct.deletedByRole === 'seller' && '🏪 Seller'}
                                {!selectedProduct.deletedByRole && 'User'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-red-700 mb-1">Reason:</p>
                              <p className="text-red-800">{selectedProduct.deletionReason}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-red-700 mb-1">Deleted On:</p>
                              <p className="text-xs text-red-600">
                                {new Date(selectedProduct.deletedAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Category & Stock */}
                    <div className="grid grid-cols-2 gap-4 bg-[#FAF7F2] rounded-lg p-4">
                      <div>
                        <p className="text-sm text-[#6B6B6B] mb-1">Category</p>
                        <p className="font-semibold text-[#2D2D2D] capitalize">{selectedProduct.category}</p>
                        {selectedProduct.subCategory && (
                          <p className="text-sm text-[#6B6B6B] capitalize">{selectedProduct.subCategory}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-[#6B6B6B] mb-1">Stock Quantity</p>
                        <p className={`font-semibold ${selectedProduct.stockQuantity < 10 ? 'text-orange-600' : 'text-[#2D2D2D]'}`}>
                          {selectedProduct.stockQuantity} units
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    {selectedProduct.description && (
                      <div>
                        <h4 className="font-semibold text-[#2D2D2D] mb-2">Description</h4>
                        <p className="text-[#6B6B6B] whitespace-pre-wrap">{selectedProduct.description}</p>
                        {selectedProduct.descriptionHi && (
                          <p className="text-[#6B6B6B] mt-2 whitespace-pre-wrap">{selectedProduct.descriptionHi}</p>
                        )}
                      </div>
                    )}

                    {/* Fabric */}
                    {selectedProduct.fabric && (
                      <div>
                        <h4 className="font-semibold text-[#2D2D2D] mb-2">Fabric</h4>
                        <p className="text-[#6B6B6B]">{selectedProduct.fabric}</p>
                        {selectedProduct.fabricHi && (
                          <p className="text-[#6B6B6B] mt-1">{selectedProduct.fabricHi}</p>
                        )}
                      </div>
                    )}

                    {/* Sizes */}
                    {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-[#2D2D2D] mb-2">Available Sizes</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.sizes.map((size, idx) => (
                            <span key={idx} className="px-3 py-1 bg-white border border-[#E8E2D9] rounded-lg text-sm">
                              {size}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Colors */}
                    {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-[#2D2D2D] mb-2">Available Colors</h4>
                        <div className="flex flex-wrap gap-3">
                          {selectedProduct.colors.map((color, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white border border-[#E8E2D9] rounded-lg px-3 py-2">
                              <div
                                className="w-6 h-6 rounded-full border border-gray-300"
                                style={{ backgroundColor: color.hex }}
                              ></div>
                              <div>
                                <p className="text-sm font-medium text-[#2D2D2D]">{color.name}</p>
                                {color.nameHi && (
                                  <p className="text-xs text-[#6B6B6B]">{color.nameHi}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Product ID */}
                    <div className="text-sm text-[#6B6B6B] border-t border-[#E8E2D9] pt-4">
                      Product ID: <span className="font-mono">{selectedProduct.productId}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-[#E8E2D9]">
                      <Link
                        href={`/seller/dashboard/products/edit/${selectedProduct.id}`}
                        className="px-4 py-2 bg-[#722F37] text-white rounded-lg hover:bg-[#8B3D47] transition-colors"
                      >
                        Edit Product
                      </Link>
                      <button
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 border border-[#E8E2D9] text-[#2D2D2D] rounded-lg hover:bg-[#F0EDE8] transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Deletion Reason Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">Delete Product</h2>
              <p className="text-sm text-[#6B6B6B] mb-4">
                Please provide a reason for deleting this product. This will be visible to the admin.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Deletion Reason *
                </label>
                <textarea
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  rows={4}
                  placeholder="e.g., Out of stock permanently, Product quality issues, Supplier discontinued..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProductToDelete(null);
                    setDeletionReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-[#E8E2D9] text-[#2D2D2D] rounded-lg hover:bg-[#F0EDE8] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
