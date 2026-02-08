'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Seller {
  id: string;
  userId: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  city?: string;
  state?: string;
  gstin?: string;
  commissionPercentage: number;
  isActive: boolean;
  createdAt: string;
  user: {
    name: string;
    email: string;
    phone_number: string;
  };
}

export default function AdminSellersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchSellers();
  }, [user, filter]);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const statusParam = filter === 'all' ? '' : `&status=${filter}`;
      const response = await fetch(`/api/sellers?userId=${user?.id}${statusParam}`);
      const data = await response.json();

      if (response.ok) {
        setSellers(data.sellers || []);
      } else {
        console.error('Failed to fetch sellers:', data.error);
      }
    } catch (error) {
      console.error('Fetch sellers error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sellerId: string) => {
    if (!confirm('Are you sure you want to approve this seller?')) return;

    try {
      const response = await fetch(`/api/sellers/${sellerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          action: 'approve',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Seller approved successfully!');
        fetchSellers();
      } else {
        alert(data.error || 'Failed to approve seller');
      }
    } catch (error) {
      alert('Error approving seller');
    }
  };

  const handleReject = async (sellerId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/sellers/${sellerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          action: 'reject',
          rejectionReason: reason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Seller rejected');
        fetchSellers();
      } else {
        alert(data.error || 'Failed to reject seller');
      }
    } catch (error) {
      alert('Error rejecting seller');
    }
  };

  const handleSuspend = async (sellerId: string) => {
    if (!confirm('Are you sure you want to suspend this seller? They will not be able to add/edit products.')) return;

    try {
      const response = await fetch(`/api/sellers/${sellerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          action: 'suspend',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Seller suspended');
        fetchSellers();
      } else {
        alert(data.error || 'Failed to suspend seller');
      }
    } catch (error) {
      alert('Error suspending seller');
    }
  };

  const filteredSellers = sellers.filter(s =>
    s.businessName.toLowerCase().includes(search.toLowerCase()) ||
    s.user.name.toLowerCase().includes(search.toLowerCase()) ||
    s.businessEmail.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: sellers.length,
    pending: sellers.filter(s => s.status === 'pending').length,
    approved: sellers.filter(s => s.status === 'approved').length,
    rejected: sellers.filter(s => s.status === 'rejected').length,
    suspended: sellers.filter(s => s.status === 'suspended').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'approved': return 'bg-green-100 text-green-700 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-300';
      case 'suspended': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-white to-[#F5F0E8] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
              Seller Management
            </h1>
            <p className="text-[#6B6B6B] mt-2">Manage vendor registrations and approvals</p>
          </div>
          <Link
            href="/admin/products"
            className="px-6 py-3 bg-white border-2 border-[#722F37] text-[#722F37] rounded-full font-semibold hover:bg-[#722F37] hover:text-white transition-all"
          >
            ← Back to Products
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-[#E8E2D9]">
            <p className="text-sm text-[#6B6B6B] mb-1">Total Sellers</p>
            <p className="text-3xl font-bold text-[#722F37]">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <p className="text-sm text-yellow-700 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-800">{stats.pending}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <p className="text-sm text-green-700 mb-1">Approved</p>
            <p className="text-3xl font-bold text-green-800">{stats.approved}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-6 border border-red-200">
            <p className="text-sm text-red-700 mb-1">Rejected</p>
            <p className="text-3xl font-bold text-red-800">{stats.rejected}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <p className="text-sm text-gray-700 mb-1">Suspended</p>
            <p className="text-3xl font-bold text-gray-800">{stats.suspended}</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl p-6 mb-6 border border-[#E8E2D9]">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search by business name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
            />

            {/* Status Filter */}
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'rejected', 'suspended'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === status
                      ? 'bg-[#722F37] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sellers Table */}
        <div className="bg-white rounded-xl border border-[#E8E2D9] overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[#6B6B6B]">Loading sellers...</div>
          ) : filteredSellers.length === 0 ? (
            <div className="p-12 text-center text-[#6B6B6B]">
              No sellers found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Business Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Contact Person</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Location</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">GSTIN</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9]">
                  {filteredSellers.map((seller, index) => (
                    <tr key={seller.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]'}>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#2D2D2D]">{seller.businessName}</div>
                        <div className="text-xs text-[#6B6B6B]">
                          Registered: {new Date(seller.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#2D2D2D]">{seller.user.name}</td>
                      <td className="px-6 py-4 text-[#2D2D2D]">{seller.businessEmail}</td>
                      <td className="px-6 py-4 text-[#2D2D2D]">{seller.businessPhone}</td>
                      <td className="px-6 py-4 text-[#2D2D2D]">
                        {seller.city && seller.state ? `${seller.city}, ${seller.state}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-[#2D2D2D] font-mono text-sm">
                        {seller.gstin || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(seller.status)}`}>
                          {seller.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {seller.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(seller.id)}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                                title="Approve"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleReject(seller.id)}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700"
                                title="Reject"
                              >
                                ✗ Reject
                              </button>
                            </>
                          )}
                          {seller.status === 'approved' && (
                            <button
                              onClick={() => handleSuspend(seller.id)}
                              className="px-3 py-1 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700"
                              title="Suspend"
                            >
                              Suspend
                            </button>
                          )}
                          <Link
                            href={`/admin/sellers/${seller.id}`}
                            className="px-3 py-1 bg-[#722F37] text-white text-xs rounded-lg hover:bg-[#8B3D47]"
                          >
                            View Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
