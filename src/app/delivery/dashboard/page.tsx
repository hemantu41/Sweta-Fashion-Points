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

export default function DeliveryDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partnerId = searchParams.get('partnerId'); // In real app, get from auth session

  const [partner, setPartner] = useState<Partner | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [error, setError] = useState('');

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
      console.error('[Dashboard] Status update error:', error);
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
    </div>
  );
}
