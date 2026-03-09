'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface DeliveryOrder {
  id: string;
  order_id: string;
  status: string;
  assigned_at: string;
  estimated_delivery_date: string | null;
  delivery_notes: string | null;
  order: {
    order_number: string;
    amount: number;
    items: any[];
    delivery_address: any;
    created_at: string;
  };
}

interface Partner {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  vehicle_type: string | null;
  status: string;
  availability_status: string;
  total_deliveries: number;
  successful_deliveries: number;
  average_rating: number;
}

interface SellerInfo {
  businessName: string;
  businessPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  user: { name: string; mobile: string } | null;
}

export default function DeliveryDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partnerId = searchParams.get('partnerId'); // In real app, get from auth session

  const [partner, setPartner] = useState<Partner | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [error, setError] = useState('');

  // Seller Info modal state
  const [showSellerInfo, setShowSellerInfo] = useState(false);
  const [sellerInfoData, setSellerInfoData] = useState<SellerInfo | null>(null);
  const [loadingSellerInfo, setLoadingSellerInfo] = useState(false);

  // Not-Accepted modal state
  const [showNotAcceptedModal, setShowNotAcceptedModal] = useState(false);
  const [notAcceptedDelivery, setNotAcceptedDelivery] = useState<{ deliveryId: string; orderId: string } | null>(null);
  const [notAcceptedReason, setNotAcceptedReason] = useState('');
  const [submittingNotAccepted, setSubmittingNotAccepted] = useState(false);

  useEffect(() => {
    if (!partnerId) {
      setError('Partner ID is required. Please login.');
      setLoading(false);
      return;
    }

    fetchPartnerInfo();
    fetchOrders();
  }, [partnerId, statusFilter]);

  const fetchPartnerInfo = async () => {
    try {
      const response = await fetch(`/api/delivery/me?partnerId=${partnerId}`);
      const data = await response.json();

      if (response.ok) {
        setPartner(data.partner);
      } else {
        setError(data.error || 'Failed to load partner info');
      }
    } catch (err) {
      console.error('Fetch partner error:', err);
      setError('Failed to load partner info');
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({ partnerId: partnerId! });
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/delivery/orders?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setDeliveries(data.deliveries || []);
      } else {
        setError(data.error || 'Failed to load orders');
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityChange = async (newStatus: string) => {
    try {
      const response = await fetch('/api/delivery/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          availabilityStatus: newStatus,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPartner(data.partner);
        alert('Availability updated successfully!');
      } else {
        alert(data.error || 'Failed to update availability');
      }
    } catch (error) {
      alert('Error updating availability');
    }
  };

  const handleViewSellerInfo = async (items: any[]) => {
    const sellerId = Array.isArray(items) && items.length > 0 ? items[0]?.seller_id : null;
    if (!sellerId) {
      alert('Seller information not available for this order.');
      return;
    }
    setSellerInfoData(null);
    setShowSellerInfo(true);
    setLoadingSellerInfo(true);
    try {
      const res = await fetch(`/api/sellers/me?sellerId=${sellerId}`);
      const data = await res.json();
      if (res.ok && data.seller) {
        setSellerInfoData(data.seller);
      } else {
        setSellerInfoData(null);
        alert(data.error || 'Could not load seller info.');
        setShowSellerInfo(false);
      }
    } catch {
      alert('Error loading seller info.');
      setShowSellerInfo(false);
    } finally {
      setLoadingSellerInfo(false);
    }
  };

  const openNotAcceptedModal = (deliveryId: string, orderId: string) => {
    setNotAcceptedDelivery({ deliveryId, orderId });
    setNotAcceptedReason('');
    setShowNotAcceptedModal(true);
  };

  const handleNotAccepted = async () => {
    if (!notAcceptedDelivery) return;
    if (!notAcceptedReason.trim()) {
      alert('Please provide a reason for not accepting this order.');
      return;
    }

    try {
      setSubmittingNotAccepted(true);
      const response = await fetch(`/api/orders/${notAcceptedDelivery.orderId}/delivery-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'not_accepted',
          deliveryNotes: notAcceptedReason.trim(),
          changedByPartner: partnerId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowNotAcceptedModal(false);
        setNotAcceptedDelivery(null);
        setNotAcceptedReason('');
        fetchOrders();
      } else {
        alert(data.error || 'Failed to submit. Please try again.');
      }
    } catch {
      alert('Error submitting. Please try again.');
    } finally {
      setSubmittingNotAccepted(false);
    }
  };

  const handleUpdateStatus = async (deliveryId: string, orderId: string, newStatus: string) => {
    if (!confirm(`Update status to ${newStatus.replace('_', ' ')}?`)) return;

    try {
      const response = await fetch(`/api/orders/${orderId}/delivery-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          changedByPartner: partnerId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Status updated successfully!');
        fetchOrders();
      } else {
        console.error('[Dashboard] Status update failed:', data);
        alert(`${data.error || 'Failed to update status'}${data.details ? ': ' + data.details : ''}`);
      }
    } catch (error) {
      alert('Error updating status');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      assigned: 'bg-cyan-100 text-cyan-700',
      accepted: 'bg-teal-100 text-teal-700',
      picked_up: 'bg-purple-100 text-purple-700',
      in_transit: 'bg-indigo-100 text-indigo-700',
      out_for_delivery: 'bg-blue-100 text-blue-700',
      delivered: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getNextStatus = (currentStatus: string) => {
    const flow: { [key: string]: string[] } = {
      assigned: ['accepted'],
      accepted: ['picked_up'],
      picked_up: ['in_transit'],
      in_transit: ['out_for_delivery'],
      out_for_delivery: ['delivered', 'failed'],
    };
    return flow[currentStatus] || [];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading && !partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6B6B6B]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md">
          <p className="text-red-700 mb-4">{error}</p>
          <p className="text-sm text-[#6B6B6B]">
            Please contact admin or use the correct link to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  const pendingCount = deliveries.filter((d) =>
    ['assigned', 'accepted', 'picked_up', 'in_transit', 'out_for_delivery'].includes(d.status)
  ).length;

  const deliveredToday = deliveries.filter((d) => {
    if (d.status !== 'delivered') return false;
    const deliveredDate = new Date(d.assigned_at).toDateString();
    const today = new Date().toDateString();
    return deliveredDate === today;
  }).length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-[#E8E2D9]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
                Welcome, {partner?.name}!
              </h1>
              <p className="text-[#6B6B6B] mt-1">{partner?.mobile}</p>
              <p className="text-sm text-[#6B6B6B]">
                Vehicle: {partner?.vehicle_type || 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#6B6B6B] mb-2">Your Availability</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAvailabilityChange('available')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    partner?.availability_status === 'available'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-[#2D2D2D] hover:bg-gray-300'
                  }`}
                >
                  Available
                </button>
                <button
                  onClick={() => handleAvailabilityChange('busy')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    partner?.availability_status === 'busy'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-200 text-[#2D2D2D] hover:bg-gray-300'
                  }`}
                >
                  Busy
                </button>
                <button
                  onClick={() => handleAvailabilityChange('offline')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    partner?.availability_status === 'offline'
                      ? 'bg-gray-500 text-white'
                      : 'bg-gray-200 text-[#2D2D2D] hover:bg-gray-300'
                  }`}
                >
                  Offline
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4 border border-[#E8E2D9]">
            <p className="text-sm text-[#6B6B6B] mb-1">Pending Deliveries</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border border-[#E8E2D9]">
            <p className="text-sm text-[#6B6B6B] mb-1">Delivered Today</p>
            <p className="text-2xl font-bold text-green-600">{deliveredToday}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border border-[#E8E2D9]">
            <p className="text-sm text-[#6B6B6B] mb-1">Total Deliveries</p>
            <p className="text-2xl font-bold text-[#722F37]">{partner?.total_deliveries || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border border-[#E8E2D9]">
            <p className="text-sm text-[#6B6B6B] mb-1">Success Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {partner?.total_deliveries
                ? ((partner.successful_deliveries / partner.total_deliveries) * 100).toFixed(0)
                : 0}%
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-[#E8E2D9]">
          <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
          >
            <option value="">All Orders</option>
            <option value="assigned">Assigned</option>
            <option value="accepted">Accepted</option>
            <option value="picked_up">Picked Up</option>
            <option value="in_transit">In Transit</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#6B6B6B]">Loading orders...</p>
          </div>
        ) : deliveries.length > 0 ? (
          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-[#E8E2D9]"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-bold text-[#2D2D2D] text-lg">
                        Order #{delivery.order.order_number}
                      </h3>
                      <p className="text-sm text-[#6B6B6B]">
                        Assigned: {formatDate(delivery.assigned_at)}
                      </p>
                      <p className="text-sm font-medium text-[#722F37]">
                        ₹{(delivery.order.amount / 100).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge(delivery.status)}`}>
                      {delivery.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="bg-[#F5F0E8] rounded-lg p-4 mb-4">
                    <p className="font-medium text-[#2D2D2D] mb-1">Delivery Address:</p>
                    <p className="text-sm text-[#6B6B6B]">{delivery.order.delivery_address.name}</p>
                    <p className="text-sm text-[#6B6B6B]">{delivery.order.delivery_address.phone}</p>
                    <p className="text-sm text-[#6B6B6B]">
                      {delivery.order.delivery_address.address_line1}
                      {delivery.order.delivery_address.address_line2 && `, ${delivery.order.delivery_address.address_line2}`}
                    </p>
                    <p className="text-sm text-[#6B6B6B]">
                      {delivery.order.delivery_address.city}, {delivery.order.delivery_address.state} - {delivery.order.delivery_address.pincode}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {getNextStatus(delivery.status).map((nextStatus) => (
                      <button
                        key={nextStatus}
                        onClick={() => handleUpdateStatus(delivery.id, delivery.order_id, nextStatus)}
                        className="bg-[#722F37] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#8B3D47] transition-colors text-sm"
                      >
                        Mark as {nextStatus.replace('_', ' ')}
                      </button>
                    ))}
                    {/* Seller Info — visible once accepted until picked up */}
                    {['accepted', 'picked_up'].includes(delivery.status) && (
                      <button
                        onClick={() => handleViewSellerInfo(delivery.order.items)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Seller Info
                      </button>
                    )}
                    {/* Not Accepted — only visible on assigned orders */}
                    {delivery.status === 'assigned' && (
                      <button
                        onClick={() => openNotAcceptedModal(delivery.id, delivery.order_id)}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors text-sm"
                      >
                        Not Accepted
                      </button>
                    )}
                    <a
                      href={`tel:${delivery.order.delivery_address.phone}`}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors text-sm"
                    >
                      📞 Call Customer
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-[#E8E2D9]">
            <p className="text-[#6B6B6B]">
              {statusFilter ? 'No orders with this status' : 'No orders assigned yet'}
            </p>
          </div>
        )}
      </div>

      {/* Seller Info Modal */}
      {showSellerInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[#2D2D2D]">Seller / Pickup Info</h3>
              <button
                onClick={() => { setShowSellerInfo(false); setSellerInfoData(null); }}
                className="text-[#6B6B6B] hover:text-[#2D2D2D]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingSellerInfo ? (
              <div className="py-10 text-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-[#6B6B6B] text-sm">Loading seller info…</p>
              </div>
            ) : sellerInfoData ? (
              <div className="space-y-4">
                {/* Name */}
                <div className="flex items-start gap-3 p-3 bg-[#FAF7F2] rounded-lg">
                  <svg className="w-5 h-5 text-[#722F37] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div>
                    <p className="text-xs text-[#6B6B6B] mb-0.5">Business / Seller Name</p>
                    <p className="font-semibold text-[#2D2D2D]">{sellerInfoData.businessName}</p>
                    {sellerInfoData.user?.name && sellerInfoData.user.name !== sellerInfoData.businessName && (
                      <p className="text-sm text-[#6B6B6B]">{sellerInfoData.user.name}</p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                {(sellerInfoData.businessPhone || sellerInfoData.user?.mobile) && (
                  <div className="flex items-center gap-3 p-3 bg-[#FAF7F2] rounded-lg">
                    <svg className="w-5 h-5 text-[#722F37] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs text-[#6B6B6B] mb-0.5">Phone</p>
                      <p className="font-semibold text-[#2D2D2D]">
                        {sellerInfoData.businessPhone || sellerInfoData.user?.mobile}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`tel:${sellerInfoData.businessPhone || sellerInfoData.user?.mobile}`}
                        className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
                      >
                        Call
                      </a>
                      <a
                        href={`https://wa.me/91${(sellerInfoData.businessPhone || sellerInfoData.user?.mobile || '').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#25D366] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#1DA851] transition-colors"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                )}

                {/* Address */}
                {(sellerInfoData.addressLine1 || sellerInfoData.city) && (
                  <div className="flex items-start gap-3 p-3 bg-[#FAF7F2] rounded-lg">
                    <svg className="w-5 h-5 text-[#722F37] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <div>
                      <p className="text-xs text-[#6B6B6B] mb-0.5">Pickup Address</p>
                      {sellerInfoData.addressLine1 && (
                        <p className="text-sm text-[#2D2D2D]">{sellerInfoData.addressLine1}</p>
                      )}
                      {sellerInfoData.addressLine2 && (
                        <p className="text-sm text-[#2D2D2D]">{sellerInfoData.addressLine2}</p>
                      )}
                      {(sellerInfoData.city || sellerInfoData.state || sellerInfoData.pincode) && (
                        <p className="text-sm text-[#2D2D2D]">
                          {[sellerInfoData.city, sellerInfoData.state, sellerInfoData.pincode]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Map Link */}
                {sellerInfoData.latitude != null && sellerInfoData.longitude != null ? (
                  <a
                    href={`https://maps.google.com/?q=${sellerInfoData.latitude},${sellerInfoData.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Open in Google Maps
                  </a>
                ) : (sellerInfoData.addressLine1 || sellerInfoData.city) ? (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      [sellerInfoData.addressLine1, sellerInfoData.city, sellerInfoData.state, sellerInfoData.pincode]
                        .filter(Boolean).join(', ')
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Search on Google Maps
                  </a>
                ) : (
                  <p className="text-center text-sm text-[#6B6B6B] py-2">
                    No map location set by the seller yet.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Not Accepted Modal */}
      {showNotAcceptedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#2D2D2D]">Not Accepting this Order</h3>
                <p className="text-sm text-[#6B6B6B]">The order will go back to admin for reassignment.</p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                Reason for not accepting <span className="text-red-500">*</span>
              </label>
              <textarea
                value={notAcceptedReason}
                onChange={(e) => setNotAcceptedReason(e.target.value)}
                placeholder="e.g. Out of range, vehicle issue, already at capacity..."
                rows={4}
                className="w-full px-4 py-3 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none text-sm"
              />
              <p className="text-xs text-[#6B6B6B] mt-1">{notAcceptedReason.trim().length}/300 characters</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNotAcceptedModal(false);
                  setNotAcceptedDelivery(null);
                  setNotAcceptedReason('');
                }}
                disabled={submittingNotAccepted}
                className="flex-1 bg-gray-100 text-[#2D2D2D] py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleNotAccepted}
                disabled={submittingNotAccepted || !notAcceptedReason.trim()}
                className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingNotAccepted ? 'Submitting…' : 'Confirm Not Accepted'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
