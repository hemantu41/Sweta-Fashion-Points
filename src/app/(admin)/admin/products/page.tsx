'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

interface Seller {
  id: string;
  businessName: string;
  businessNameHi?: string;
  city?: string;
  state?: string;
}

interface Product {
  id: string;
  productId?: string;
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
  mainImage?: string | null;
  image?: string; // Legacy field from static products
  images?: string[];
  colors?: { name: string; nameHi?: string; hex: string }[];
  sizes?: string[];
  stockQuantity?: number;
  isActive?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  approvalStatus?: string;
  rejectionReason?: string;
  sellerId?: string | null;
  seller?: Seller | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
  deletedByRole?: string | null;
  deletionReason?: string | null;
}

export default function AdminProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deletionHistory, setDeletionHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [deletionReason, setDeletionReason] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Add timestamp to bust both browser and server cache
      const timestamp = Date.now();
      const url = `/api/products?isActive=all&includeAllStatuses=true&_t=${timestamp}`;
      const response = await fetch(url, { cache: 'no-store' });
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
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
          deletedByRole: 'admin',
        }),
      });

      if (response.ok) {
        alert('Product deleted successfully');
        setShowDeleteModal(false);
        setProductToDelete(null);
        setDeletionReason('');
        fetchProducts();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete product');
      }
    } catch (error) {
      alert('Error deleting product');
    }
  };

  const handleProductClick = async (product: Product) => {
    setSelectedProduct(product);
    setShowModal(true);

    // Fetch deletion history if product has been deleted
    if (product.deletedAt) {
      setLoadingHistory(true);
      try {
        const response = await fetch(`/api/products/${product.productId || product.id}/deletion-history`);
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
  };

  const filteredProducts = products.filter(p => {
    const productIdValue = p.productId || p.id || '';
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                         productIdValue.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    const matchesApprovalStatus = !approvalStatusFilter || p.approvalStatus === approvalStatusFilter;
    const matchesActiveStatus = !activeStatusFilter ||
      (activeStatusFilter === 'active' ? p.isActive === true : p.isActive === false);
    const matchesSeller = !sellerFilter ||
      (sellerFilter === 'admin' ? !p.sellerId : p.seller?.businessName === sellerFilter);
    const matchesStock = !stockFilter ||
      (stockFilter === 'in-stock' ? (p.stockQuantity || 0) > 0 : (p.stockQuantity || 0) === 0);
    return matchesSearch && matchesCategory && matchesApprovalStatus &&
           matchesActiveStatus && matchesSeller && matchesStock;
  });

  const stats = {
    total: products.length,
    active: products.filter(p => p.isActive).length,
    pending: products.filter(p => p.approvalStatus === 'pending').length,
    outOfStock: products.filter(p => p.stockQuantity === 0).length,
  };

  // Get unique sellers for filter dropdown
  const uniqueSellers = Array.from(
    new Set(
      products
        .filter(p => p.seller?.businessName)
        .map(p => p.seller!.businessName)
    )
  ).sort();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
              Product Management
            </h1>
            <p className="text-[#6B6B6B] mt-1">Manage your products inventory</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/products/review"
              className={`px-6 py-3 font-semibold rounded-full hover:shadow-lg transition-all flex items-center gap-2 ${
                stats.pending > 0
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {stats.pending > 0 && (
                <span className="bg-white text-orange-600 rounded-full min-w-[24px] h-6 px-2 flex items-center justify-center text-sm font-bold">
                  {stats.pending}
                </span>
              )}
              Review Products
            </Link>
            <Link
              href="/admin/products/new"
              className="px-6 py-3 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              + Add New Product
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-6">
            <p className="text-[#6B6B6B] text-sm">Total Products</p>
            <p className="text-3xl font-bold text-[#722F37] mt-2">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-6">
            <p className="text-[#6B6B6B] text-sm">Active Products</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
          </div>
          <div className="bg-orange-50 rounded-xl border border-orange-200 p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/admin/products/review'}>
            <p className="text-orange-700 text-sm font-semibold">Pending Approval</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E8E2D9] p-6">
            <p className="text-[#6B6B6B] text-sm">Out of Stock</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.outOfStock}</p>
          </div>
        </div>

        {/* Filters */}
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
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
            >
              <option value="">All Sellers</option>
              <option value="admin">Admin Products</option>
              {uniqueSellers.map(seller => (
                <option key={seller} value={seller}>{seller}</option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
            >
              <option value="">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>

            {/* Clear Filters Button */}
            {(search || categoryFilter || approvalStatusFilter || activeStatusFilter || sellerFilter || stockFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('');
                  setApprovalStatusFilter('');
                  setActiveStatusFilter('');
                  setSellerFilter('');
                  setStockFilter('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F0E8]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#2D2D2D]">Image</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#2D2D2D]">Product ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#2D2D2D]">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#2D2D2D]">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#2D2D2D]">Seller</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#2D2D2D]">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#2D2D2D]">Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#2D2D2D]">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#2D2D2D]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  <tr
                    key={product.id}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]'} hover:bg-[#F0EDE8] transition-colors cursor-pointer`}
                    onClick={() => handleProductClick(product)}
                  >
                    <td className="px-6 py-4">
                      {(product.mainImage || product.image) ? (
                        <Image
                          src={`https://res.cloudinary.com/duoxrodmv/image/upload/c_fill,w_50,h_50/${product.mainImage || product.image}`}
                          alt={product.name}
                          width={50}
                          height={50}
                          className="rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B6B6B]">{product.productId || product.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[#2D2D2D]">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-[#6B6B6B] capitalize">{product.category}</td>
                    <td className="px-6 py-4 text-sm">
                      {product.seller ? (
                        <div>
                          <p className="font-medium text-[#2D2D2D]">{product.seller.businessName}</p>
                          {product.seller.city && (
                            <p className="text-xs text-[#6B6B6B]">{product.seller.city}</p>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-1 bg-[#722F37] text-white text-xs rounded">Admin</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#2D2D2D]">
                      <div>
                        <span className="font-semibold">₹{product.price.toLocaleString('en-IN')}</span>
                        {product.originalPrice && (
                          <span className="ml-2 text-xs text-gray-400 line-through">
                            ₹{product.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={product.stockQuantity === 0 ? 'text-red-600 font-semibold' : 'text-[#2D2D2D]'}>
                        {product.stockQuantity || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        product.isActive
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/products/edit/${product.productId || product.id}`}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product.productId || product.id)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#6B6B6B]">No products found</p>
            </div>
          )}
        </div>

        {/* Product Details Modal */}
        {showModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-[#E8E2D9] px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#722F37]">Product Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[#6B6B6B] hover:text-[#2D2D2D] text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Product Images */}
                {selectedProduct.mainImage && (
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Image
                        src={`https://res.cloudinary.com/duoxrodmv/image/upload/c_fill,w_400,h_400/${selectedProduct.mainImage}`}
                        alt={selectedProduct.name}
                        width={400}
                        height={400}
                        className="rounded-xl object-cover w-full"
                      />
                    </div>
                    {selectedProduct.images && selectedProduct.images.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {selectedProduct.images.slice(0, 3).map((img, idx) => (
                          <Image
                            key={idx}
                            src={`https://res.cloudinary.com/duoxrodmv/image/upload/c_fill,w_100,h_100/${img}`}
                            alt={`${selectedProduct.name} ${idx + 1}`}
                            width={100}
                            height={100}
                            className="rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Product Info */}
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
                      : selectedProduct.approvalStatus === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {selectedProduct.approvalStatus === 'approved' ? 'Approved' : selectedProduct.approvalStatus === 'rejected' ? 'Rejected' : 'Pending Approval'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedProduct.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedProduct.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {selectedProduct.deletedAt && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                      Soft Deleted
                    </span>
                  )}
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

                {/* Rejection Reason */}
                {selectedProduct.approvalStatus === 'rejected' && selectedProduct.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 mb-2">Rejection Reason</h4>
                    <p className="text-red-800">{selectedProduct.rejectionReason}</p>
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
                    <p className={`font-semibold ${(selectedProduct.stockQuantity || 0) < 10 ? 'text-orange-600' : 'text-[#2D2D2D]'}`}>
                      {selectedProduct.stockQuantity || 0} units
                    </p>
                  </div>
                </div>

                {/* Seller Information */}
                {selectedProduct.seller && (
                  <div className="bg-[#F0EDE8] rounded-lg p-4">
                    <h4 className="font-semibold text-[#2D2D2D] mb-2">Seller Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-[#6B6B6B]">Business Name</p>
                        <p className="font-medium text-[#2D2D2D]">{selectedProduct.seller.businessName}</p>
                        {selectedProduct.seller.businessNameHi && (
                          <p className="text-sm text-[#6B6B6B]">{selectedProduct.seller.businessNameHi}</p>
                        )}
                      </div>
                      {selectedProduct.seller.city && (
                        <div>
                          <p className="text-sm text-[#6B6B6B]">Location</p>
                          <p className="font-medium text-[#2D2D2D]">
                            {selectedProduct.seller.city}{selectedProduct.seller.state && `, ${selectedProduct.seller.state}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                  <div className="flex gap-8">
                    <div>
                      <h4 className="font-semibold text-[#2D2D2D] mb-2">Fabric</h4>
                      <p className="text-[#6B6B6B]">{selectedProduct.fabric}</p>
                      {selectedProduct.fabricHi && (
                        <p className="text-[#6B6B6B]">{selectedProduct.fabricHi}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-[#2D2D2D] mb-2">Available Sizes</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.sizes.map((size, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-white border border-[#E8E2D9] rounded-lg text-sm font-medium text-[#2D2D2D]"
                        >
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
                  Product ID: <span className="font-mono">{selectedProduct.productId || selectedProduct.id}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-[#E8E2D9]">
                  <Link
                    href={`/admin/products/edit/${selectedProduct.productId || selectedProduct.id}`}
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
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">Delete Product</h2>
              <p className="text-[#6B6B6B] mb-4">
                Are you sure you want to delete this product? This action cannot be undone.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Deletion Reason (Required) *
                </label>
                <textarea
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Please provide a reason for deleting this product..."
                  required
                />
                <p className="text-xs text-[#6B6B6B] mt-1">
                  This reason will be visible to the seller and will be recorded in the product history.
                </p>
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
