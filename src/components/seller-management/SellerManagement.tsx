'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
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
  suspensionReason?: string;
  reactivationRequest?: string;
  reactivationRequestedAt?: string;
  user: {
    name: string;
    email: string;
    mobile: string;
  };
}

export default function SellerManagement() {
  const { user } = useAuth();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Suspend modal state
  const [suspendModal, setSuspendModal] = useState<{ open: boolean; sellerId: string; businessName: string }>({
    open: false, sellerId: '', businessName: '',
  });
  const [suspendReason, setSuspendReason] = useState('');
  const [suspending, setSuspending] = useState(false);

  // Reactivate state
  const [reactivating, setReactivating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchSellers();
  }, [user, filter]);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      setError(null);
      const statusParam = filter === 'all' ? '' : `&status=${filter}`;
      const response = await fetch(`/api/sellers?userId=${user?.id}${statusParam}`);
      const data = await response.json();

      if (response.ok) {
        setSellers(data.sellers || []);
      } else {
        setError(data.error || 'Failed to fetch sellers');
      }
    } catch {
      setError('An error occurred while fetching sellers');
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
        body: JSON.stringify({ userId: user?.id, action: 'approve' }),
      });
      const data = await response.json();
      if (response.ok) {
        fetchSellers();
      } else {
        alert(data.error || 'Failed to approve seller');
      }
    } catch {
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
        body: JSON.stringify({ userId: user?.id, action: 'reject', rejectionReason: reason }),
      });
      const data = await response.json();
      if (response.ok) {
        fetchSellers();
      } else {
        alert(data.error || 'Failed to reject seller');
      }
    } catch {
      alert('Error rejecting seller');
    }
  };

  const openSuspendModal = (seller: Seller) => {
    setSuspendReason('');
    setSuspendModal({ open: true, sellerId: seller.id, businessName: seller.businessName });
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      alert('Please enter a reason for suspension.');
      return;
    }
    setSuspending(true);
    try {
      const response = await fetch(`/api/sellers/${suspendModal.sellerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, action: 'suspend', suspensionReason: suspendReason.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuspendModal({ open: false, sellerId: '', businessName: '' });
        setSuspendReason('');
        setSellers(prev =>
          prev.map(s =>
            s.id === suspendModal.sellerId
              ? { ...s, status: 'suspended', isActive: false, suspensionReason: suspendReason.trim() }
              : s
          )
        );
        fetchSellers();
      } else {
        alert(data.error || 'Failed to suspend seller');
      }
    } catch {
      alert('Error suspending seller');
    } finally {
      setSuspending(false);
    }
  };

  const handleReactivate = async (sellerId: string, businessName: string) => {
    if (!confirm(`Reactivate "${businessName}"? They will be able to access their seller dashboard again.`)) return;
    setReactivating(sellerId);
    try {
      const response = await fetch(`/api/sellers/${sellerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, action: 'reactivate' }),
      });
      const data = await response.json();
      if (response.ok) {
        setSellers(prev =>
          prev.map(s =>
            s.id === sellerId ? { ...s, status: 'approved', isActive: true, suspensionReason: undefined } : s
          )
        );
        fetchSellers();
      } else {
        alert(data.error || 'Failed to reactivate seller');
      }
    } catch {
      alert('Error reactivating seller');
    } finally {
      setReactivating(null);
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
    reactivationPending: sellers.filter(s => s.status === 'suspended' && !!s.reactivationRequest).length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'approved': return 'bg-green-100 text-green-700 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-300';
      case 'suspended': return 'bg-orange-100 text-orange-700 border-orange-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Seller Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage vendor registrations and approvals</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`bg-white rounded-xl p-4 border text-left transition-all hover:shadow-md ${filter === 'all' ? 'border-emerald-500 ring-2 ring-emerald-500' : 'border-gray-200'}`}
        >
          <p className="text-xs text-gray-500 mb-1">Total Sellers</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`bg-yellow-50 rounded-xl p-4 border text-left transition-all hover:shadow-md ${filter === 'pending' ? 'border-yellow-500 ring-2 ring-yellow-400' : 'border-yellow-200'}`}
        >
          <p className="text-xs text-yellow-700 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`bg-green-50 rounded-xl p-4 border text-left transition-all hover:shadow-md ${filter === 'approved' ? 'border-green-500 ring-2 ring-green-400' : 'border-green-200'}`}
        >
          <p className="text-xs text-green-700 mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-800">{stats.approved}</p>
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`bg-red-50 rounded-xl p-4 border text-left transition-all hover:shadow-md ${filter === 'rejected' ? 'border-red-500 ring-2 ring-red-400' : 'border-red-200'}`}
        >
          <p className="text-xs text-red-700 mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-800">{stats.rejected}</p>
        </button>
        <button
          onClick={() => setFilter('suspended')}
          className={`bg-orange-50 rounded-xl p-4 border text-left transition-all hover:shadow-md ${filter === 'suspended' ? 'border-orange-500 ring-2 ring-orange-400' : 'border-orange-200'}`}
        >
          <p className="text-xs text-orange-700 mb-1">Suspended</p>
          <p className="text-2xl font-bold text-orange-800">{stats.suspended}</p>
          {stats.reactivationPending > 0 && (
            <p className="text-xs text-blue-700 font-semibold mt-1">
              {stats.reactivationPending} reactivation request{stats.reactivationPending > 1 ? 's' : ''} pending
            </p>
          )}
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by business name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'approved', 'rejected', 'suspended'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === status
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status === 'suspended' && stats.reactivationPending > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {stats.reactivationPending}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-red-800 font-semibold text-sm">Error Loading Sellers</p>
          <p className="text-red-600 text-xs mt-1">{error}</p>
        </div>
      )}

      {/* Sellers Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading sellers...</div>
        ) : filteredSellers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {error ? 'Unable to load sellers.' : 'No sellers found matching your criteria.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Business Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact Person</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">GSTIN</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-gray-800">{seller.businessName}</div>
                      <div className="text-xs text-gray-400">
                        Registered: {new Date(seller.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{seller.user.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{seller.businessEmail}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{seller.businessPhone}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {seller.city && seller.state ? `${seller.city}, ${seller.state}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                      {seller.gstin || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(seller.status)}`}>
                          {seller.status.toUpperCase()}
                        </span>
                        {seller.status === 'suspended' && seller.suspensionReason && (
                          <span className="text-xs text-orange-600 max-w-[140px] truncate" title={seller.suspensionReason}>
                            {seller.suspensionReason}
                          </span>
                        )}
                        {seller.status === 'suspended' && seller.reactivationRequest && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-300">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            Reactivation Requested
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {seller.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(seller.id)}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(seller.id)}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {seller.status === 'approved' && (
                          <button
                            onClick={() => openSuspendModal(seller)}
                            className="px-3 py-1 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700"
                          >
                            Suspend
                          </button>
                        )}
                        {seller.status === 'suspended' && (
                          <button
                            onClick={() => handleReactivate(seller.id, seller.businessName)}
                            disabled={reactivating === seller.id}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {reactivating === seller.id ? 'Reactivating...' : 'Reactivate'}
                          </button>
                        )}
                        <Link
                          href={`/admin/sellers/${seller.id}`}
                          className="px-3 py-1 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700"
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

      {/* Suspend Modal */}
      {suspendModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Suspend Seller</h2>
            <p className="text-sm text-gray-500 mb-4">
              Suspending <strong>{suspendModal.businessName}</strong>. They will lose access to their seller dashboard immediately.
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Suspension <span className="text-red-500">*</span>
            </label>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={4}
              placeholder="Explain why this seller is being suspended. This reason will be visible to the seller."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm resize-none"
            />

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setSuspendModal({ open: false, sellerId: '', businessName: '' })}
                className="flex-1 py-2.5 border border-gray-200 text-gray-500 rounded-xl font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={suspending || !suspendReason.trim()}
                className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 disabled:opacity-50"
              >
                {suspending ? 'Suspending...' : 'Confirm Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
