'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DeliveryPartner {
  id: string;
  name: string;
  email: string | null;
  mobile: string;
  vehicle_type: string | null;
  vehicle_number: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  service_pincodes: string[];
  status: 'active' | 'inactive' | 'suspended' | 'pending_approval';
  availability_status: 'available' | 'busy' | 'offline';
  total_deliveries: number;
  successful_deliveries: number;
  average_rating: number;
  created_at: string;
}

export default function DeliveryPartnersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchPartners();
  }, [user, statusFilter, availabilityFilter]);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (availabilityFilter) params.append('availabilityStatus', availabilityFilter);

      const response = await fetch(`/api/delivery-partners?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setPartners(data.partners || []);
      } else {
        console.error('Failed to fetch delivery partners:', data.error);
        setError(data.error || 'Failed to fetch delivery partners');
      }
    } catch (error) {
      console.error('Fetch partners error:', error);
      setError('An error occurred while fetching delivery partners');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (partnerId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to change the status to ${newStatus}?`)) return;

    try {
      const response = await fetch(`/api/delivery-partners/${partnerId}`, {
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
        fetchPartners();
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      alert('Error updating status');
    }
  };

  const handleDelete = async (partnerId: string) => {
    if (!confirm('Are you sure you want to deactivate this delivery partner?')) return;

    try {
      const response = await fetch(`/api/delivery-partners/${partnerId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        alert('Delivery partner deactivated successfully!');
        fetchPartners();
      } else {
        alert(data.error || 'Failed to deactivate delivery partner');
      }
    } catch (error) {
      alert('Error deactivating delivery partner');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      active: 'bg-green-100 text-green-700 border-green-200',
      inactive: 'bg-gray-100 text-gray-700 border-gray-200',
      suspended: 'bg-red-100 text-red-700 border-red-200',
      pending_approval: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getAvailabilityBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      available: 'bg-green-100 text-green-700',
      busy: 'bg-yellow-100 text-yellow-700',
      offline: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const filteredPartners = partners.filter(
    (partner) =>
      partner.name.toLowerCase().includes(search.toLowerCase()) ||
      partner.mobile.includes(search) ||
      (partner.email && partner.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
              Delivery Partners
            </h1>
            <p className="text-[#6B6B6B] mt-2">Manage delivery partners and their assignments</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 md:mt-0 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white py-3 px-6 rounded-full font-medium hover:shadow-lg transition-all duration-300"
          >
            + Add Delivery Partner
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4 border border-[#E8E2D9]">
            <p className="text-sm text-[#6B6B6B] mb-1">Total Partners</p>
            <p className="text-2xl font-bold text-[#722F37]">{partners.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border border-[#E8E2D9]">
            <p className="text-sm text-[#6B6B6B] mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {partners.filter((p) => p.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border border-[#E8E2D9]">
            <p className="text-sm text-[#6B6B6B] mb-1">Available Now</p>
            <p className="text-2xl font-bold text-blue-600">
              {partners.filter((p) => p.availability_status === 'available').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border border-[#E8E2D9]">
            <p className="text-sm text-[#6B6B6B] mb-1">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-600">
              {partners.filter((p) => p.status === 'pending_approval').length}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-[#E8E2D9]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="pending_approval">Pending Approval</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Availability</label>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
              >
                <option value="">All Availability</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Partners Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#6B6B6B]">Loading delivery partners...</p>
          </div>
        ) : filteredPartners.length > 0 ? (
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#E8E2D9]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#722F37]/5 to-[#E8E2D9]/30">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#2D2D2D] uppercase tracking-wider">
                      Partner Info
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#2D2D2D] uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#2D2D2D] uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#2D2D2D] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#2D2D2D] uppercase tracking-wider">
                      Deliveries
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#2D2D2D] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9]">
                  {filteredPartners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-[#2D2D2D]">{partner.name}</p>
                          <p className="text-sm text-[#6B6B6B]">{partner.city || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-[#2D2D2D]">{partner.mobile}</p>
                          {partner.email && (
                            <p className="text-sm text-[#6B6B6B]">{partner.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-[#2D2D2D] capitalize">
                            {partner.vehicle_type || 'N/A'}
                          </p>
                          {partner.vehicle_number && (
                            <p className="text-sm text-[#6B6B6B]">{partner.vehicle_number}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                              partner.status
                            )}`}
                          >
                            {partner.status.replace('_', ' ')}
                          </span>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ml-2 ${getAvailabilityBadge(
                              partner.availability_status
                            )}`}
                          >
                            {partner.availability_status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-[#2D2D2D]">
                            <span className="font-medium">{partner.total_deliveries}</span> total
                          </p>
                          <p className="text-sm text-green-600">
                            {partner.successful_deliveries} successful
                          </p>
                          {partner.average_rating > 0 && (
                            <p className="text-sm text-[#6B6B6B]">
                              ⭐ {partner.average_rating.toFixed(1)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/delivery-partners/${partner.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View
                          </Link>
                          {partner.status === 'pending_approval' && (
                            <button
                              onClick={() => handleStatusChange(partner.id, 'active')}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              Approve
                            </button>
                          )}
                          {partner.status === 'active' && (
                            <button
                              onClick={() => handleStatusChange(partner.id, 'suspended')}
                              className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                            >
                              Suspend
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(partner.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Deactivate
                          </button>
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
            <svg
              className="w-16 h-16 text-[#722F37] mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <h2 className="text-xl font-bold text-[#2D2D2D] mb-2">No Delivery Partners Found</h2>
            <p className="text-[#6B6B6B] mb-6">
              {search
                ? 'No partners match your search criteria.'
                : 'Get started by adding your first delivery partner.'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white py-2 px-6 rounded-full font-medium hover:shadow-lg transition-all duration-300"
            >
              Add First Partner
            </button>
          </div>
        )}
      </div>

      {/* Add Partner Modal (Placeholder) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-[#722F37] mb-4">Add Delivery Partner</h3>
            <p className="text-[#6B6B6B] mb-4">
              Create a dedicated page for adding delivery partners with a form.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-200 text-[#2D2D2D] py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <Link
                href="/admin/delivery-partners/new"
                className="flex-1 bg-[#722F37] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#8B3D47] transition-colors text-center"
              >
                Go to Form
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
