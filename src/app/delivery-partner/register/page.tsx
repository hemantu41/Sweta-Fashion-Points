'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DeliveryPartnerRegisterPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    mobile: '',

    // Documents
    vehicleType: 'bike',
    vehicleNumber: '',
    licenseNumber: '',
    aadharNumber: '',
    panNumber: '',

    // Address
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',

    // Service Areas (comma-separated pincodes)
    servicePincodes: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/delivery-partner/register');
    } else if (user) {
      // Pre-fill from user data
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
      }));
    }
  }, [isAuthenticated, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.name || !formData.mobile || !formData.vehicleType || !formData.vehicleNumber) {
        setError('Please fill all required fields');
        setLoading(false);
        return;
      }

      // Parse service pincodes
      const pincodes = formData.servicePincodes
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const response = await fetch('/api/delivery-partner/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          ...formData,
          servicePincodes: pincodes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Redirect to status page after 3 seconds
        setTimeout(() => {
          router.push('/delivery-partner/status');
        }, 3000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="text-center">
          <p className="text-[#6B6B6B]">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] py-8 px-4">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-md p-8 text-center border border-[#E8E2D9]">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#722F37] mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
            Registration Successful!
          </h2>
          <p className="text-[#6B6B6B] mb-4">
            Your delivery partner registration has been submitted successfully.
          </p>
          <div className="bg-[#F5F0E8] rounded-lg p-4 mb-6">
            <p className="text-sm text-[#2D2D2D]">
              <strong>What's Next?</strong><br />
              Our team will review your application and activate your account within 24-48 hours.
              You'll receive an email notification once approved.
            </p>
          </div>
          <p className="text-sm text-[#6B6B6B]">Redirecting to your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-[#722F37] hover:underline mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
            Become a Delivery Partner
          </h1>
          <p className="text-[#6B6B6B] mt-2">
            Join our delivery network and start earning by delivering fashion products to customers
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 border border-[#E8E2D9]">
          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#2D2D2D] mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10}"
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  placeholder="10-digit mobile number"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent bg-gray-50"
                  placeholder="your@email.com"
                  readOnly
                />
                <p className="text-xs text-[#6B6B6B] mt-1">Email from your account</p>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#2D2D2D] mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
              Vehicle Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                >
                  <option value="bike">Bike</option>
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                  <option value="truck">Truck</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Vehicle Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  placeholder="e.g., BR01AB1234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Driving License Number
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  placeholder="License number"
                />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#2D2D2D] mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Documents (Optional)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Aadhar Number
                </label>
                <input
                  type="text"
                  name="aadharNumber"
                  value={formData.aadharNumber}
                  onChange={handleChange}
                  pattern="[0-9]{12}"
                  maxLength={12}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  placeholder="12-digit Aadhar"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  PAN Number
                </label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                  maxLength={10}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  placeholder="e.g., ABCDE1234F"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#2D2D2D] mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Address
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Address Line 1
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  placeholder="Street address"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  placeholder="Apartment, suite, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Pincode
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                  placeholder="6-digit pincode"
                />
              </div>
            </div>
          </div>

          {/* Service Areas */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#2D2D2D] mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Service Areas
            </h2>
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                Service Pincodes (comma-separated)
              </label>
              <textarea
                name="servicePincodes"
                value={formData.servicePincodes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                placeholder="e.g., 824219, 823001, 824101 (Leave empty to serve all areas)"
              />
              <p className="text-xs text-[#6B6B6B] mt-1">
                Enter the pincodes where you want to deliver. Leave empty if you can deliver to all areas.
              </p>
            </div>
          </div>

          {/* Terms */}
          <div className="bg-[#F5F0E8] rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-[#2D2D2D] mb-2">What happens next?</h3>
            <ul className="text-sm text-[#6B6B6B] space-y-1">
              <li>• Your application will be reviewed by our team</li>
              <li>• You'll be notified via email within 24-48 hours</li>
              <li>• Once approved, you can access the Delivery Partner Dashboard</li>
              <li>• Start receiving delivery assignments and earning!</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#722F37] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#8B3D47] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
