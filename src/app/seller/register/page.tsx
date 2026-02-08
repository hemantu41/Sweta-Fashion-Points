'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SellerRegisterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    businessName: '',
    businessNameHi: '',
    gstin: '',
    pan: '',
    businessEmail: '',
    businessPhone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankName: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!user) {
      setMessage('Please login first to register as a seller');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/sellers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Registration submitted successfully! You will be notified once your account is approved by admin.');
        setTimeout(() => router.push('/'), 3000);
      } else {
        setMessage(data.error || 'Registration failed');
      }
    } catch (error) {
      setMessage('Error submitting registration');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-white to-[#F5F0E8] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-xl p-8 border border-[#E8E2D9] text-center">
          <h2 className="text-2xl font-bold text-[#722F37] mb-4">Login Required</h2>
          <p className="text-[#6B6B6B] mb-6">Please login first to register as a seller.</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white rounded-full font-semibold hover:shadow-lg transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-white to-[#F5F0E8] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
            Become a Seller
          </h1>
          <p className="text-[#6B6B6B] mt-2">Register your business to start selling on our platform</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            message.includes('success')
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 border border-[#E8E2D9]">
          {/* Business Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#722F37] mb-4">Business Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="Your Business Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  Business Name (Hindi)
                </label>
                <input
                  type="text"
                  name="businessNameHi"
                  value={formData.businessNameHi}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="आपका व्यापार नाम"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  GSTIN
                </label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  maxLength={15}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  PAN
                </label>
                <input
                  type="text"
                  name="pan"
                  value={formData.pan}
                  onChange={handleChange}
                  maxLength={10}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="ABCDE1234F"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#722F37] mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  Business Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="businessEmail"
                  value={formData.businessEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="business@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  Business Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="businessPhone"
                  value={formData.businessPhone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="1234567890"
                />
              </div>
            </div>
          </div>

          {/* Business Address */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#722F37] mb-4">Business Address</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  Address Line 1
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="Building, Street"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="Locality, Landmark"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    maxLength={6}
                    className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                    placeholder="123456"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#722F37] mb-4">Bank Details</h2>
            <p className="text-sm text-[#6B6B6B] mb-4">For receiving payments from sales</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  name="bankAccountName"
                  value={formData.bankAccountName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="As per bank records"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  name="bankAccountNumber"
                  value={formData.bankAccountNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="Bank account number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  IFSC Code
                </label>
                <input
                  type="text"
                  name="bankIfsc"
                  value={formData.bankIfsc}
                  onChange={handleChange}
                  maxLength={11}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="ABCD0123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  placeholder="Bank name"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-8 py-3 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
            <Link
              href="/"
              className="px-8 py-3 bg-white border-2 border-[#722F37] text-[#722F37] rounded-full font-semibold hover:bg-[#722F37] hover:text-white transition-all text-center"
            >
              Cancel
            </Link>
          </div>

          {/* Info */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your registration will be reviewed by our admin team. You will receive a notification once your account is approved and you can start selling.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
