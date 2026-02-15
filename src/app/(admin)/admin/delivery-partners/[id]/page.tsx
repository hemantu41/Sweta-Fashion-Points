'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface DeliveryPartner {
  id: string;
  name: string;
  email: string | null;
  mobile: string;
  vehicle_type: string;
  vehicle_number: string;
  license_number: string;
  aadhar_number: string;
  pan_number: string;
  address_line1: string;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string;
  service_pincodes: string[];
  status: 'pending_approval' | 'active' | 'inactive' | 'suspended' | 'rejected';
  availability_status: 'online' | 'offline' | 'busy';
  total_deliveries: number;
  successful_deliveries: number;
  average_rating: number;
  total_ratings: number;
  created_at: string;
  rejection_reason?: string | null;
}

export default function DeliveryPartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [partner, setPartner] = useState<DeliveryPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchPartner();
  }, [user, params.id]);

  const fetchPartner = async () => {
    try {
      const response = await fetch(`/api/delivery-partners/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setPartner(data.partner);
      } else {
        setError(data.error || 'Failed to fetch delivery partner');
      }
    } catch (err) {
      setError('An error occurred while fetching delivery partner details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!partner) return;

    setIsProcessing(true);
    setModalError('');

    try {
      const response = await fetch(`/api/delivery-partners/${partner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'active',
          updatedBy: user?.id,
        }),
      });

      if (response.ok) {
        setShowApproveModal(false);
        fetchPartner();
      } else {
        const data = await response.json();
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
        setModalError(errorMsg || 'Failed to approve delivery partner');
      }
    } catch (error) {
      setModalError('Error approving delivery partner');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!partner || !rejectionReason.trim()) {
      setModalError('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    setModalError('');

    try {
      const response = await fetch(`/api/delivery-partners/${partner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          rejectionReason: rejectionReason,
          updatedBy: user?.id,
        }),
      });

      if (response.ok) {
        setShowRejectModal(false);
        setRejectionReason('');
        fetchPartner();
      } else {
        const data = await response.json();
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
        setModalError(errorMsg || 'Failed to reject delivery partner');
      }
    } catch (error) {
      setModalError('Error rejecting delivery partner');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!partner) return;
    if (!confirm(`Are you sure you want to change the status to ${newStatus}?`)) return;

    try {
      const response = await fetch(`/api/delivery-partners/${partner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          updatedBy: user?.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Status updated successfully!');
        fetchPartner();
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      alert('Error updating status');
    }
  };

  const handleReactivate = async () => {
    if (!partner) return;
    if (!confirm('Are you sure you want to reactivate this delivery partner?')) return;

    try {
      const response = await fetch(`/api/delivery-partners/${partner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'active',
          availabilityStatus: 'offline',
          updatedBy: user?.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Delivery partner reactivated successfully!');
        fetchPartner();
      } else {
        alert(data.error || 'Failed to reactivate delivery partner');
      }
    } catch (error) {
      alert('Error reactivating delivery partner');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      active: 'bg-green-100 text-green-700 border-green-200',
      inactive: 'bg-gray-100 text-gray-700 border-gray-200',
      suspended: 'bg-red-100 text-red-700 border-red-200',
      pending_approval: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getAvailabilityBadge = (availability: string) => {
    const colors: { [key: string]: string } = {
      online: 'bg-green-100 text-green-700 border-green-200',
      offline: 'bg-gray-100 text-gray-700 border-gray-200',
      busy: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    };
    return colors[availability] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6B6B6B]">Loading delivery partner details...</p>
        </div>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/admin/delivery-partners"
            className="inline-flex items-center text-[#722F37] hover:underline mb-6"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Delivery Partners
          </Link>
          <div className="bg-red-50 border-2 border-red-200 rounded-xl shadow-md p-8 text-center">
            <svg className="w-16 h-16 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-[#722F37] mb-2">Error</h2>
            <p className="text-red-700">{error || 'Delivery partner not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/delivery-partners"
            className="inline-flex items-center text-[#722F37] hover:underline mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Delivery Partners
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>
                {partner.name}
              </h1>
              <div className="flex gap-2">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(partner.status)}`}>
                  {partner.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getAvailabilityBadge(partner.availability_status)}`}>
                  {partner.availability_status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {partner.status === 'pending_approval' && (
                <>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    ✗ Reject
                  </button>
                </>
              )}
              {partner.status === 'active' && (
                <>
                  <button
                    onClick={() => handleStatusChange('suspended')}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                  >
                    Suspend
                  </button>
                  <button
                    onClick={() => handleStatusChange('inactive')}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    Deactivate
                  </button>
                </>
              )}
              {(partner.status === 'inactive' || partner.status === 'suspended') && (
                <button
                  onClick={handleReactivate}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  ↻ Reactivate
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8E2D9]">
              <h2 className="text-xl font-bold text-[#2D2D2D] mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">Full Name</p>
                  <p className="text-[#2D2D2D] font-medium">{partner.name}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">Mobile</p>
                  <p className="text-[#2D2D2D] font-medium">{partner.mobile}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-[#6B6B6B] mb-1">Email</p>
                  <p className="text-[#2D2D2D] font-medium">{partner.email || 'Not provided'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-[#6B6B6B] mb-1">Member Since</p>
                  <p className="text-[#2D2D2D] font-medium">
                    {new Date(partner.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8E2D9]">
              <h2 className="text-xl font-bold text-[#2D2D2D] mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
                Vehicle Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">Vehicle Type</p>
                  <p className="text-[#2D2D2D] font-medium capitalize">{partner.vehicle_type}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">Vehicle Number</p>
                  <p className="text-[#2D2D2D] font-medium">{partner.vehicle_number}</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8E2D9]">
              <h2 className="text-xl font-bold text-[#2D2D2D] mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Documents
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">Driving License Number</p>
                  <p className="text-[#2D2D2D] font-medium">{partner.license_number}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">Aadhar Number</p>
                  <p className="text-[#2D2D2D] font-medium">{partner.aadhar_number}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">PAN Number</p>
                  <p className="text-[#2D2D2D] font-medium">{partner.pan_number}</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8E2D9]">
              <h2 className="text-xl font-bold text-[#2D2D2D] mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Address
              </h2>
              <div className="space-y-2">
                <p className="text-[#2D2D2D]">{partner.address_line1}</p>
                {partner.address_line2 && <p className="text-[#2D2D2D]">{partner.address_line2}</p>}
                <p className="text-[#2D2D2D]">
                  {partner.city && `${partner.city}, `}
                  {partner.state && `${partner.state} - `}
                  {partner.pincode}
                </p>
              </div>
            </div>

            {/* Service Areas */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8E2D9]">
              <h2 className="text-xl font-bold text-[#2D2D2D] mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Service Areas
              </h2>
              {partner.service_pincodes && partner.service_pincodes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {partner.service_pincodes.map((pincode, index) => (
                    <span
                      key={index}
                      className="bg-[#F5F0E8] text-[#722F37] px-3 py-1 rounded-full text-sm font-medium border border-[#E8E2D9]"
                    >
                      {pincode}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[#6B6B6B]">No service areas specified</p>
              )}
            </div>

            {/* Rejection Reason (if rejected) */}
            {partner.status === 'rejected' && partner.rejection_reason && (
              <div className="bg-red-50 rounded-xl shadow-md p-6 border-2 border-red-200">
                <h2 className="text-xl font-bold text-red-700 mb-2 flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Rejection Reason
                </h2>
                <p className="text-red-800">{partner.rejection_reason}</p>
              </div>
            )}
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Delivery Statistics */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-[#E8E2D9]">
              <h2 className="text-xl font-bold text-[#2D2D2D] mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Statistics
              </h2>
              <div className="space-y-4">
                <div className="bg-[#F5F0E8] rounded-lg p-4">
                  <p className="text-sm text-[#6B6B6B] mb-1">Total Deliveries</p>
                  <p className="text-3xl font-bold text-[#722F37]">{partner.total_deliveries}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-[#6B6B6B] mb-1">Successful Deliveries</p>
                  <p className="text-3xl font-bold text-green-600">{partner.successful_deliveries}</p>
                </div>
                {partner.total_deliveries > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-[#6B6B6B] mb-1">Success Rate</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {((partner.successful_deliveries / partner.total_deliveries) * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
                {partner.average_rating > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm text-[#6B6B6B] mb-1">Average Rating</p>
                    <p className="text-3xl font-bold text-yellow-600 flex items-center">
                      ⭐ {partner.average_rating.toFixed(1)}
                    </p>
                    {partner.total_ratings > 0 && (
                      <p className="text-sm text-[#6B6B6B] mt-1">
                        Based on {partner.total_ratings} rating{partner.total_ratings !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}
                {partner.total_ratings > 0 && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-[#6B6B6B] mb-1">Total Ratings</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {partner.total_ratings}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-[#722F37] mb-2">Approve Delivery Partner?</h3>
              <p className="text-[#6B6B6B]">
                Are you sure you want to approve <strong>{partner.name}</strong>?
              </p>
              <p className="text-sm text-[#6B6B6B] mt-2">
                They will be able to access the delivery dashboard and receive delivery assignments.
              </p>
            </div>
            {modalError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-700 text-sm">{modalError}</p>
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setModalError('');
                }}
                disabled={isProcessing}
                className="flex-1 bg-gray-200 text-[#2D2D2D] py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="mb-4">
              <p className="text-[#6B6B6B] text-center mb-4">
                Rejecting <strong>{partner.name}</strong>&apos;s application
              </p>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  setModalError('');
                }}
                rows={4}
                disabled={isProcessing}
                className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Please provide a reason for rejection..."
              />
              {modalError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                  <p className="text-red-700 text-sm">{modalError}</p>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setModalError('');
                }}
                disabled={isProcessing}
                className="flex-1 bg-gray-200 text-[#2D2D2D] py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isProcessing}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
