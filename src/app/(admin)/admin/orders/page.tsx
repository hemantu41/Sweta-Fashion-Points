'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { COURIER_PROVIDERS } from '@/lib/courier-providers';

interface Order {
  id: string;
  order_number: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  amount: number;
  status: string;
  delivery_status?: string;
  tracking_number?: string;
  delivery_type?: 'partner' | 'courier';
  courier_company?: string;
  courier_tracking_number?: string;
  courier_tracking_url?: string;
  user_id: string;
  delivery_address: any;
  items: any[];
  created_at: string;
  payment_completed_at?: string;
}

interface DeliveryPartner {
  id: string;
  name: string;
  mobile: string;
  vehicle_type: string | null;
  status: string;
  availability_status: string;
  service_pincodes: string[];
}

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'partner' | 'courier'>('partner');
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
  const [courierCompany, setCourierCompany] = useState('');
  const [courierTrackingNumber, setCourierTrackingNumber] = useState('');
  const [courierExpectedDeliveryDate, setCourierExpectedDeliveryDate] = useState('');
  const [courierNotes, setCourierNotes] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Shiprocket states
  const [showShiprocketModal, setShowShiprocketModal] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const [availableCouriers, setAvailableCouriers] = useState<any[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<number | null>(null);
  const [creatingShipment, setCreatingShipment] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchOrders();
    fetchPartners();
  }, [user, statusFilter, deliveryStatusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/orders');
      const data = await response.json();

      if (response.ok) {
        let filteredOrders = data.orders || [];

        // Apply filters
        if (statusFilter) {
          filteredOrders = filteredOrders.filter((o: Order) => o.status === statusFilter);
        }
        if (deliveryStatusFilter) {
          filteredOrders = filteredOrders.filter(
            (o: Order) => (o.delivery_status || 'pending_assignment') === deliveryStatusFilter
          );
        }

        setOrders(filteredOrders);
      } else {
        setError(data.error || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
      setError('An error occurred while fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/delivery-partners?status=active');
      const data = await response.json();

      if (response.ok) {
        setPartners(data.partners || []);
      }
    } catch (error) {
      console.error('Fetch partners error:', error);
    }
  };

  const openAssignModal = (order: Order) => {
    setSelectedOrder(order);
    setShowAssignModal(true);
    setDeliveryType('partner');
    setSelectedPartner('');
    setEstimatedDeliveryDate('');
    setCourierCompany('');
    setCourierTrackingNumber('');
    setCourierExpectedDeliveryDate('');
    setCourierNotes('');
  };

  const handleAssignPartner = async () => {
    if (!selectedOrder || !selectedPartner) {
      alert('Please select a delivery partner');
      return;
    }

    try {
      setAssigning(true);

      const response = await fetch(`/api/orders/${selectedOrder.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryPartnerId: selectedPartner,
          estimatedDeliveryDate: estimatedDeliveryDate || null,
          assignedBy: user?.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Order assigned successfully!');
        setShowAssignModal(false);
        fetchOrders();
      } else {
        alert(data.error || 'Failed to assign order');
      }
    } catch (error) {
      alert('Error assigning order');
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignCourier = async () => {
    if (!selectedOrder || !courierCompany || !courierTrackingNumber) {
      alert('Please fill in courier company and tracking number');
      return;
    }

    try {
      setAssigning(true);

      const response = await fetch(`/api/orders/${selectedOrder.id}/assign-courier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courierCompany,
          courierTrackingNumber,
          courierExpectedDeliveryDate: courierExpectedDeliveryDate || null,
          courierNotes: courierNotes || null,
          assignedBy: user?.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Order assigned to courier successfully!');
        setShowAssignModal(false);
        fetchOrders();
      } else {
        alert(data.error || 'Failed to assign order to courier');
      }
    } catch (error) {
      alert('Error assigning order to courier');
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignDelivery = () => {
    if (deliveryType === 'partner') {
      handleAssignPartner();
    } else {
      handleAssignCourier();
    }
  };

  const handleAutoAssign = async (orderId: string) => {
    if (!confirm('Auto-assign this order to the best available partner?')) return;

    try {
      const response = await fetch('/api/orders/auto-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          assignedBy: user?.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Order auto-assigned to ${data.partner.name}!`);
        fetchOrders();
      } else {
        alert(data.error || 'Failed to auto-assign order');
      }
    } catch (error) {
      alert('Error auto-assigning order');
    }
  };

  // Shiprocket functions
  const handleUseShiprocket = async () => {
    if (!selectedOrder) return;

    setLoadingRates(true);
    setShowShiprocketModal(true);

    try {
      // Fetch available couriers and rates
      const response = await fetch(
        `/api/shiprocket/serviceability?` +
          new URLSearchParams({
            pickupPincode: '302001', // You can make this configurable
            deliveryPincode: selectedOrder.delivery_address.pincode,
            weight: '0.5', // Default 500g, can be made dynamic
            cod: 'false',
            declaredValue: (selectedOrder.amount / 100).toString(),
          })
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setAvailableCouriers(data.couriers || []);
        // Auto-select cheapest courier
        if (data.recommendedCourier) {
          setSelectedCourierId(data.recommendedCourier.courier_company_id);
        }
      } else {
        alert(data.error || 'Failed to fetch courier rates');
        setShowShiprocketModal(false);
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      alert('Error fetching courier rates');
      setShowShiprocketModal(false);
    } finally {
      setLoadingRates(false);
    }
  };

  const handleCreateShiprocketShipment = async () => {
    if (!selectedOrder || !selectedCourierId) {
      alert('Please select a courier');
      return;
    }

    try {
      setCreatingShipment(true);

      const response = await fetch('/api/shiprocket/create-shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          courierCompanyId: selectedCourierId,
          weight: 0.5, // Default 500g, can be made dynamic
          dimensions: {
            // Default dimensions, can be made dynamic
            length: 30,
            breadth: 20,
            height: 10,
          },
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(
          `Shipment created successfully!\n\n` +
            `Courier: ${data.courierName}\n` +
            `AWB: ${data.awbCode}\n\n` +
            `Order has been updated with tracking details.`
        );
        setShowShiprocketModal(false);
        setShowAssignModal(false);
        fetchOrders();
      } else {
        alert(data.error || 'Failed to create shipment');
      }
    } catch (error) {
      console.error('Error creating shipment:', error);
      alert('Error creating shipment');
    } finally {
      setCreatingShipment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      captured: 'bg-green-100 text-green-700 border-green-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      created: 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getDeliveryStatusBadge = (status?: string) => {
    const colors: { [key: string]: string } = {
      delivered: 'bg-green-100 text-green-700 border-green-200',
      out_for_delivery: 'bg-blue-100 text-blue-700 border-blue-200',
      in_transit: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      picked_up: 'bg-purple-100 text-purple-700 border-purple-200',
      accepted: 'bg-teal-100 text-teal-700 border-teal-200',
      assigned: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      pending_assignment: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    };
    return colors[status || 'pending_assignment'] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getAvailablePartners = () => {
    if (!selectedOrder) return partners;

    const orderPincode = selectedOrder.delivery_address?.pincode;
    if (!orderPincode) return partners;

    // Filter partners who service this pincode
    return partners.filter((partner) => {
      if (!partner.service_pincodes || partner.service_pincodes.length === 0) {
        return true; // Include partners with no pincode restrictions
      }
      return partner.service_pincodes.includes(orderPincode);
    });
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (order.tracking_number && order.tracking_number.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
            Order Management
          </h1>
          <p className="text-[#6B6B6B] mt-2">View and assign orders to delivery partners</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4 border border-[#E8E2D9]">
            <p className="text-sm text-[#6B6B6B] mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-[#722F37]">{orders.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border border-[#E8E2D9]">
            <p className="text-sm text-[#6B6B6B] mb-1">Pending Assignment</p>
            <p className="text-2xl font-bold text-yellow-600">
              {orders.filter((o) => !o.delivery_status || o.delivery_status === 'pending_assignment').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border border-[#E8E2D9]">
            <p className="text-sm text-[#6B6B6B] mb-1">In Transit</p>
            <p className="text-2xl font-bold text-blue-600">
              {orders.filter((o) => o.delivery_status === 'in_transit' || o.delivery_status === 'out_for_delivery').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border border-[#E8E2D9]">
            <p className="text-sm text-[#6B6B6B] mb-1">Delivered</p>
            <p className="text-2xl font-bold text-green-600">
              {orders.filter((o) => o.delivery_status === 'delivered').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border border-[#E8E2D9]">
            <p className="text-sm text-[#6B6B6B] mb-1">Payment Success</p>
            <p className="text-2xl font-bold text-green-600">
              {orders.filter((o) => o.status === 'captured').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-[#E8E2D9]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by order number or tracking..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Payment Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
              >
                <option value="">All</option>
                <option value="captured">Captured</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Delivery Status</label>
              <select
                value={deliveryStatusFilter}
                onChange={(e) => setDeliveryStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
              >
                <option value="">All</option>
                <option value="pending_assignment">Pending Assignment</option>
                <option value="assigned">Assigned</option>
                <option value="accepted">Accepted</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Orders Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#6B6B6B]">Loading orders...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#E8E2D9]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#722F37]/5 to-[#E8E2D9]/30">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#2D2D2D] uppercase">Order</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#2D2D2D] uppercase">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#2D2D2D] uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#2D2D2D] uppercase">Payment</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#2D2D2D] uppercase">Delivery</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#2D2D2D] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9]">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-[#2D2D2D]">#{order.order_number}</p>
                          {order.delivery_type === 'courier' && order.courier_company && order.courier_tracking_number && (
                            <div className="mt-1">
                              <p className="text-xs text-[#6B6B6B]">
                                Courier: {COURIER_PROVIDERS.find(p => p.id === order.courier_company)?.name || order.courier_company}
                              </p>
                              {order.courier_tracking_url ? (
                                <a
                                  href={order.courier_tracking_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                                >
                                  Track: {order.courier_tracking_number}
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              ) : (
                                <p className="text-xs text-[#6B6B6B]">AWB: {order.courier_tracking_number}</p>
                              )}
                            </div>
                          )}
                          {order.tracking_number && !order.delivery_type && (
                            <p className="text-xs text-[#6B6B6B]">{order.tracking_number}</p>
                          )}
                          <p className="text-xs text-[#6B6B6B] mt-1">{formatDate(order.created_at)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-[#2D2D2D]">{order.delivery_address?.name}</p>
                          <p className="text-xs text-[#6B6B6B]">{order.delivery_address?.phone}</p>
                          <p className="text-xs text-[#6B6B6B]">{order.delivery_address?.city}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#722F37]">₹{(order.amount / 100).toLocaleString('en-IN')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getDeliveryStatusBadge(order.delivery_status)}`}>
                            {order.delivery_status?.replace('_', ' ') || 'Pending'}
                          </span>
                          {order.delivery_type && (
                            <p className="text-xs text-[#6B6B6B] flex items-center gap-1">
                              {order.delivery_type === 'courier' ? (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                  </svg>
                                  Courier
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  Local Partner
                                </>
                              )}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          {order.status === 'captured' && (!order.delivery_status || order.delivery_status === 'pending_assignment') && (
                            <>
                              <button
                                onClick={() => openAssignModal(order)}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium text-left"
                              >
                                Assign Partner
                              </button>
                              <button
                                onClick={() => handleAutoAssign(order.id)}
                                className="text-sm text-green-600 hover:text-green-800 font-medium text-left"
                              >
                                Auto-Assign
                              </button>
                            </>
                          )}
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-sm text-[#722F37] hover:text-[#8B3D47] font-medium"
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
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-[#E8E2D9]">
            <p className="text-[#6B6B6B]">No orders found</p>
          </div>
        )}
      </div>

      {/* Assign Delivery Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-[#722F37]">Assign Delivery</h3>
                <p className="text-sm text-[#6B6B6B] mt-1">Order #{selectedOrder.order_number}</p>
                <p className="text-sm text-[#6B6B6B]">
                  Delivery to: {selectedOrder.delivery_address?.city} - {selectedOrder.delivery_address?.pincode}
                </p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-[#6B6B6B] hover:text-[#2D2D2D]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Delivery Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#2D2D2D] mb-3">Delivery Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeliveryType('partner')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    deliveryType === 'partner'
                      ? 'border-[#722F37] bg-[#722F37]/5'
                      : 'border-[#E8E2D9] hover:border-[#722F37]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      deliveryType === 'partner' ? 'border-[#722F37]' : 'border-[#E8E2D9]'
                    }`}>
                      {deliveryType === 'partner' && (
                        <div className="w-3 h-3 rounded-full bg-[#722F37]"></div>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[#2D2D2D]">Local Partner</p>
                      <p className="text-xs text-[#6B6B6B]">Within 15km radius</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setDeliveryType('courier')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    deliveryType === 'courier'
                      ? 'border-[#722F37] bg-[#722F37]/5'
                      : 'border-[#E8E2D9] hover:border-[#722F37]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      deliveryType === 'courier' ? 'border-[#722F37]' : 'border-[#E8E2D9]'
                    }`}>
                      {deliveryType === 'courier' && (
                        <div className="w-3 h-3 rounded-full bg-[#722F37]"></div>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[#2D2D2D]">Courier Service</p>
                      <p className="text-xs text-[#6B6B6B]">Long distance orders</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Local Partner Form */}
            {deliveryType === 'partner' && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Select Delivery Partner
                    {getAvailablePartners().length < partners.length && (
                      <span className="text-xs text-[#6B6B6B] ml-2">
                        (Filtered by service area)
                      </span>
                    )}
                  </label>
                  <select
                    value={selectedPartner}
                    onChange={(e) => setSelectedPartner(e.target.value)}
                    className="w-full px-4 py-3 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  >
                    <option value="">Choose a partner...</option>
                    {getAvailablePartners().map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name} - {partner.mobile} ({partner.vehicle_type || 'N/A'}) - {partner.availability_status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Estimated Delivery Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={estimatedDeliveryDate}
                    onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  />
                </div>

                {getAvailablePartners().length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-yellow-800">
                      No partners available for pincode {selectedOrder.delivery_address?.pincode}.
                      You can still assign manually or add partners for this area.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Courier Service Form */}
            {deliveryType === 'courier' && (
              <>
                {/* Shiprocket Auto-Booking */}
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-1">Shiprocket Auto-Booking</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        Automatically generate AWB number, compare rates across 17+ couriers, and select the cheapest option
                      </p>
                      <button
                        onClick={handleUseShiprocket}
                        className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Use Shiprocket Auto-Booking
                      </button>
                    </div>
                  </div>
                </div>

                {/* Manual Courier Entry */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 border-t border-[#E8E2D9]"></div>
                    <span className="text-xs text-[#6B6B6B] font-medium">OR ENTER MANUALLY</span>
                    <div className="flex-1 border-t border-[#E8E2D9]"></div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Courier Company <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={courierCompany}
                    onChange={(e) => setCourierCompany(e.target.value)}
                    className="w-full px-4 py-3 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  >
                    <option value="">Choose a courier service...</option>
                    {COURIER_PROVIDERS.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name} - {provider.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Tracking Number / AWB Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={courierTrackingNumber}
                    onChange={(e) => setCourierTrackingNumber(e.target.value)}
                    placeholder="Enter tracking or AWB number"
                    className="w-full px-4 py-3 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Expected Delivery Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={courierExpectedDeliveryDate}
                    onChange={(e) => setCourierExpectedDeliveryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={courierNotes}
                    onChange={(e) => setCourierNotes(e.target.value)}
                    placeholder="Add any special instructions or notes"
                    rows={3}
                    className="w-full px-4 py-3 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  />
                </div>
              </>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 bg-gray-200 text-[#2D2D2D] py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignDelivery}
                disabled={
                  (deliveryType === 'partner' && !selectedPartner) ||
                  (deliveryType === 'courier' && (!courierCompany || !courierTrackingNumber)) ||
                  assigning
                }
                className="flex-1 bg-[#722F37] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#8B3D47] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {assigning ? 'Assigning...' : deliveryType === 'partner' ? 'Assign Partner' : 'Assign Courier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shiprocket Rate Comparison Modal */}
      {showShiprocketModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-[#722F37] flex items-center gap-2">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Shiprocket - Compare Couriers
                </h3>
                <p className="text-sm text-[#6B6B6B] mt-1">Order #{selectedOrder.order_number}</p>
                <p className="text-sm text-[#6B6B6B]">
                  Delivery to: {selectedOrder.delivery_address?.city} - {selectedOrder.delivery_address?.pincode}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowShiprocketModal(false);
                  setAvailableCouriers([]);
                  setSelectedCourierId(null);
                }}
                className="text-[#6B6B6B] hover:text-[#2D2D2D]"
                disabled={creatingShipment}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingRates ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#6B6B6B]">Fetching courier rates from Shiprocket...</p>
              </div>
            ) : (
              <>
                {availableCouriers.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-[#6B6B6B] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-[#6B6B6B]">No couriers available for this route</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>{availableCouriers.length} couriers available</strong> - Select a courier or use the recommended option (cheapest)
                      </p>
                    </div>

                    <div className="space-y-3 mb-6">
                      {availableCouriers.map((courier, index) => (
                        <button
                          key={courier.courier_company_id}
                          onClick={() => setSelectedCourierId(courier.courier_company_id)}
                          className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                            selectedCourierId === courier.courier_company_id
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-[#E8E2D9] hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedCourierId === courier.courier_company_id ? 'border-blue-600' : 'border-[#E8E2D9]'
                              }`}>
                                {selectedCourierId === courier.courier_company_id && (
                                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-[#2D2D2D]">{courier.courier_name}</p>
                                  {index === 0 && (
                                    <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                      Recommended
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-[#6B6B6B] mt-1">
                                  Delivery: {courier.estimated_delivery_days} days
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-[#722F37]">₹{courier.rate.toFixed(2)}</p>
                              <p className="text-xs text-[#6B6B6B]">Freight: ₹{courier.freight_charge.toFixed(2)}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <div className="flex gap-2">
                        <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium mb-1">What will happen?</p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Shipment will be created in Shiprocket</li>
                            <li>AWB number will be auto-generated</li>
                            <li>Pickup will be scheduled automatically</li>
                            <li>Order will be updated with tracking details</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setShowShiprocketModal(false);
                          setAvailableCouriers([]);
                          setSelectedCourierId(null);
                        }}
                        className="flex-1 bg-gray-200 text-[#2D2D2D] py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                        disabled={creatingShipment}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateShiprocketShipment}
                        disabled={!selectedCourierId || creatingShipment}
                        className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {creatingShipment ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Creating Shipment...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Create Shipment
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
