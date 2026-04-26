'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface StatusHistoryEntry {
  id: string;
  from_status: string | null;
  to_status: string;
  reason: string | null;
  created_at: string;
  changed_by: string | null;
}

interface Seller {
  id: string;
  userId: string;
  businessName: string;
  businessNameHi?: string;
  gstin?: string;
  pan?: string;
  businessEmail: string;
  businessPhone: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  suspensionReason?: string;
  reactivationRequest?: string;
  reactivationRequestedAt?: string;
  commissionPercentage: number;
  isActive: boolean;
  documents: any[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusHistoryEntry[];
  user: {
    name: string;
    email: string;
    phone_number: string;
  };
}

export default function SellerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellerId, setSellerId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [commission, setCommission] = useState('10.00');
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    params.then(p => {
      setSellerId(p.id);
      fetchSeller(p.id);
    });
  }, [user]);

  const fetchSeller = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sellers/${id}?userId=${user?.id}`);
      const data = await response.json();

      if (response.ok) {
        setSeller(data.seller);
        setNotes(data.seller.notes || '');
        setCommission(data.seller.commissionPercentage?.toString() || '10.00');
      } else {
        alert(data.error || 'Failed to fetch seller details');
        router.push('/admin/sellers');
      }
    } catch (error) {
      alert('Error loading seller details');
      router.push('/admin/sellers');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      const response = await fetch(`/api/sellers/${sellerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          notes,
          commissionPercentage: parseFloat(commission),
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Settings saved successfully!');
        fetchSeller(sellerId);
      } else {
        alert(data.error || 'Failed to save settings');
      }
    } catch {
      alert('Error saving settings');
    }
  };

  const handleReactivate = async () => {
    if (!confirm('Reactivate this seller? They will regain full access to their seller dashboard.')) return;
    setActioning(true);
    try {
      const response = await fetch(`/api/sellers/${sellerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, action: 'reactivate' }),
      });
      const data = await response.json();
      if (response.ok) {
        fetchSeller(sellerId);
      } else {
        alert(data.error || 'Failed to reactivate seller');
      }
    } catch {
      alert('Error reactivating seller');
    } finally {
      setActioning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-white to-[#F5F0E8] p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-[#6B6B6B]">Loading seller details...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-white to-[#F5F0E8] p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-red-600">Seller not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'approved': return 'bg-green-100 text-green-700 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-300';
      case 'suspended': return 'bg-orange-100 text-orange-700 border-orange-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadgeColor = (status: string | null) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'suspended': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-white to-[#F5F0E8] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
              Seller Details
            </h1>
            <p className="text-[#6B6B6B] mt-2">{seller.businessName}</p>
          </div>
          <Link
            href="/admin/sellers"
            className="px-6 py-3 bg-white border-2 border-[#722F37] text-[#722F37] rounded-full font-semibold hover:bg-[#722F37] hover:text-white transition-all"
          >
            ← Back to Sellers
          </Link>
        </div>

        {/* Status Badge + Reactivate */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(seller.status)}`}>
            Status: {seller.status.toUpperCase()}
          </span>
          {seller.status === 'suspended' && (
            <button
              onClick={handleReactivate}
              disabled={actioning}
              className="px-5 py-2 bg-green-600 text-white text-sm rounded-full font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {actioning ? 'Reactivating...' : ' Reactivate Seller'}
            </button>
          )}
        </div>

        {/* Suspension Notice */}
        {seller.status === 'suspended' && (
          <div className="bg-orange-50 rounded-xl p-5 mb-4 border border-orange-200">
            <h2 className="text-base font-bold text-orange-800 mb-1">Account Suspended</h2>
            <p className="text-sm text-orange-700">
              <span className="font-semibold">Reason: </span>
              {seller.suspensionReason || 'No reason provided'}
            </p>
          </div>
        )}

        {/* Reactivation Request (highlighted when pending) */}
        {seller.status === 'suspended' && seller.reactivationRequest && (
          <div className="bg-blue-50 rounded-xl p-5 mb-6 border-2 border-blue-300">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <h2 className="text-base font-bold text-blue-800">Reactivation Request from Seller</h2>
                </div>
                <p className="text-sm text-blue-900 mb-1">{seller.reactivationRequest}</p>
                {seller.reactivationRequestedAt && (
                  <p className="text-xs text-blue-600">
                    Submitted: {new Date(seller.reactivationRequestedAt).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
              <button
                onClick={handleReactivate}
                disabled={actioning}
                className="shrink-0 px-5 py-2 bg-green-600 text-white text-sm rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {actioning ? 'Reactivating...' : ' Reactivate Now'}
              </button>
            </div>
          </div>
        )}

        {/* Business Information */}
        <div className="bg-white rounded-xl p-6 mb-6 border border-[#E8E2D9]">
          <h2 className="text-xl font-bold text-[#722F37] mb-4">Business Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#6B6B6B]">Business Name</label>
              <p className="text-[#2D2D2D] font-semibold">{seller.businessName}</p>
            </div>
            {seller.businessNameHi && (
              <div>
                <label className="text-sm text-[#6B6B6B]">Business Name (Hindi)</label>
                <p className="text-[#2D2D2D] font-semibold">{seller.businessNameHi}</p>
              </div>
            )}
            <div>
              <label className="text-sm text-[#6B6B6B]">GSTIN</label>
              <p className="text-[#2D2D2D] font-mono">{seller.gstin || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm text-[#6B6B6B]">PAN</label>
              <p className="text-[#2D2D2D] font-mono">{seller.pan || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm text-[#6B6B6B]">Business Email</label>
              <p className="text-[#2D2D2D]">{seller.businessEmail}</p>
            </div>
            <div>
              <label className="text-sm text-[#6B6B6B]">Business Phone</label>
              <p className="text-[#2D2D2D]">{seller.businessPhone}</p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl p-6 mb-6 border border-[#E8E2D9]">
          <h2 className="text-xl font-bold text-[#722F37] mb-4">Address</h2>
          <p className="text-[#2D2D2D]">
            {seller.addressLine1 && <>{seller.addressLine1}<br /></>}
            {seller.addressLine2 && <>{seller.addressLine2}<br /></>}
            {seller.city && seller.state && <>{seller.city}, {seller.state} - {seller.pincode || ''}</>}
            {!seller.addressLine1 && !seller.city && <span className="text-[#6B6B6B]">No address provided</span>}
          </p>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-xl p-6 mb-6 border border-[#E8E2D9]">
          <h2 className="text-xl font-bold text-[#722F37] mb-4">Bank Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#6B6B6B]">Account Name</label>
              <p className="text-[#2D2D2D]">{seller.bankAccountName || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm text-[#6B6B6B]">Account Number</label>
              <p className="text-[#2D2D2D] font-mono">{seller.bankAccountNumber || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm text-[#6B6B6B]">IFSC Code</label>
              <p className="text-[#2D2D2D] font-mono">{seller.bankIfsc || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm text-[#6B6B6B]">Bank Name</label>
              <p className="text-[#2D2D2D]">{seller.bankName || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Contact Person */}
        <div className="bg-white rounded-xl p-6 mb-6 border border-[#E8E2D9]">
          <h2 className="text-xl font-bold text-[#722F37] mb-4">Contact Person (User Account)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#6B6B6B]">Name</label>
              <p className="text-[#2D2D2D]">{seller.user.name}</p>
            </div>
            <div>
              <label className="text-sm text-[#6B6B6B]">Email</label>
              <p className="text-[#2D2D2D]">{seller.user.email}</p>
            </div>
            <div>
              <label className="text-sm text-[#6B6B6B]">Phone</label>
              <p className="text-[#2D2D2D]">{seller.user.phone_number}</p>
            </div>
          </div>
        </div>

        {/* Admin Settings */}
        <div className="bg-white rounded-xl p-6 mb-6 border border-[#E8E2D9]">
          <h2 className="text-xl font-bold text-[#722F37] mb-4">Admin Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#6B6B6B] mb-2">Commission Percentage</label>
              <input
                type="number"
                step="0.01"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
              />
              <p className="text-xs text-[#6B6B6B] mt-1">Platform commission on sales (e.g., 10 = 10%)</p>
            </div>
            <div>
              <label className="block text-sm text-[#6B6B6B] mb-2">Admin Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                placeholder="Internal notes about this seller..."
              />
            </div>
            <button
              onClick={handleSaveNotes}
              className="px-6 py-3 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white rounded-full font-semibold hover:shadow-lg transition-all"
            >
              Save Settings
            </button>
          </div>
        </div>

        {/* Approval Info */}
        {seller.status === 'approved' && seller.approvedAt && (
          <div className="bg-green-50 rounded-xl p-6 mb-6 border border-green-200">
            <h2 className="text-base font-bold text-green-800 mb-1">Approved</h2>
            <p className="text-green-700 text-sm">
              Approved on: {new Date(seller.approvedAt).toLocaleString()}
            </p>
          </div>
        )}

        {seller.status === 'rejected' && seller.rejectionReason && (
          <div className="bg-red-50 rounded-xl p-6 mb-6 border border-red-200">
            <h2 className="text-base font-bold text-red-800 mb-1">Rejected</h2>
            <p className="text-red-700 text-sm">Reason: {seller.rejectionReason}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="bg-white rounded-xl p-6 mb-6 border border-[#E8E2D9]">
          <h2 className="text-xl font-bold text-[#722F37] mb-4">Timeline</h2>
          <div className="space-y-2 text-sm">
            <p className="text-[#6B6B6B]">
              <span className="font-semibold">Registered:</span> {new Date(seller.createdAt).toLocaleString()}
            </p>
            <p className="text-[#6B6B6B]">
              <span className="font-semibold">Last Updated:</span> {new Date(seller.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Status History */}
        {seller.statusHistory && seller.statusHistory.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-[#E8E2D9]">
            <h2 className="text-xl font-bold text-[#722F37] mb-4">Status Change History</h2>
            <div className="space-y-3">
              {seller.statusHistory.map((entry) => (
                <div key={entry.id} className="flex items-start gap-4 p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9]">
                  <div className="flex items-center gap-2 shrink-0">
                    {entry.from_status && (
                      <>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(entry.from_status)}`}>
                          {entry.from_status}
                        </span>
                        <span className="text-[#6B6B6B] text-xs">→</span>
                      </>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(entry.to_status)}`}>
                      {entry.to_status}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {entry.reason && (
                      <p className="text-sm text-[#2D2D2D]">{entry.reason}</p>
                    )}
                    <p className="text-xs text-[#6B6B6B] mt-0.5">
                      {new Date(entry.created_at).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
