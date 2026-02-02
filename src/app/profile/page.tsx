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
    gender: '',
    date_of_birth: '',
    citizenship: 'Indian',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.id) {
      fetchProfile();
    }
  }, [user, isAuthenticated, isLoading, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/user/profile?userId=${user?.id}`);
      const data = await response.json();

      if (response.ok && data.profile) {
        setFormData({
          name: data.profile.name || user?.name || '',
          email: data.profile.email || user?.email || '',
          mobile: data.profile.mobile || user?.mobile || '',
          location: data.profile.location || '',
          gender: data.profile.gender || '',
          date_of_birth: data.profile.date_of_birth || '',
          citizenship: data.profile.citizenship || 'Indian',
        });
      } else {
        // Use data from auth context if profile doesn't exist
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          mobile: user?.mobile || '',
          location: '',
          gender: '',
          date_of_birth: '',
          citizenship: 'Indian',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save profile' });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isFetching) {
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
              {formData.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-[#2D2D2D]">{formData.name}</h2>
              <p className="text-[#6B6B6B]">{formData.email}</p>
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
            {/* Basic Info Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Personal Details Section */}
            <div>
              <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Personal Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Gender</label>
                  {isEditing ? (
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  ) : (
                    <p className="px-4 py-3 bg-[#F5F0E8] rounded-lg text-[#2D2D2D]">{formData.gender || '-'}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-[#F5F0E8] rounded-lg text-[#2D2D2D]">
                      {formData.date_of_birth ? new Date(formData.date_of_birth).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : '-'}
                    </p>
                  )}
                </div>

                {/* Citizenship */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Citizenship</label>
                  {isEditing ? (
                    <select
                      name="citizenship"
                      value={formData.citizenship}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                    >
                      <option value="Indian">Indian</option>
                      <option value="NRI">NRI (Non-Resident Indian)</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="px-4 py-3 bg-[#F5F0E8] rounded-lg text-[#2D2D2D]">{formData.citizenship || 'Indian'}</p>
                  )}
                </div>
              </div>
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
                  onClick={() => {
                    setIsEditing(false);
                    fetchProfile(); // Reset to saved data
                  }}
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
