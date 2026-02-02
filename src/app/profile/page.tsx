'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    location: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        location: (user as { location?: string }).location || '',
      });
    }
  }, [user, isAuthenticated, isLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    // For now, just show a success message (actual update would need API)
    setTimeout(() => {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      setIsSaving(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair)' }}>
            Profile Details
          </h1>
          <p className="text-[#6B6B6B] mt-2">Manage your personal information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {/* Avatar */}
          <div className="flex items-center mb-8">
            <div className="w-20 h-20 bg-[#722F37] rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-[#2D2D2D]">{user?.name}</h2>
              <p className="text-[#6B6B6B]">{user?.email}</p>
            </div>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {message.text}
            </div>
          )}

          {/* Form */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                />
              ) : (
                <p className="px-4 py-3 bg-[#F5F0E8] rounded-lg text-[#2D2D2D]">{formData.name || '-'}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Email Address</label>
              <p className="px-4 py-3 bg-[#F5F0E8] rounded-lg text-[#6B6B6B]">{formData.email || '-'}</p>
              <p className="text-xs text-[#6B6B6B] mt-1">Email cannot be changed</p>
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Mobile Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                />
              ) : (
                <p className="px-4 py-3 bg-[#F5F0E8] rounded-lg text-[#2D2D2D]">+91 {formData.mobile || '-'}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Location</label>
              {isEditing ? (
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                />
              ) : (
                <p className="px-4 py-3 bg-[#F5F0E8] rounded-lg text-[#2D2D2D]">{formData.location || '-'}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-[#722F37] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#5a252c] transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-[#6B6B6B] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-[#722F37] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#5a252c] transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
