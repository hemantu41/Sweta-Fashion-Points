'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    location: '',
    gender: '',
    date_of_birth: '',
    citizenship: 'Indian',
    profile_photo: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
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
        // Format date_of_birth to YYYY-MM-DD for input type="date"
        let formattedDate = '';
        if (data.profile.date_of_birth) {
          const date = new Date(data.profile.date_of_birth);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0];
          }
        }

        setFormData({
          name: data.profile.name || user?.name || '',
          email: data.profile.email || user?.email || '',
          mobile: data.profile.mobile || user?.mobile || '',
          location: data.profile.location || '',
          gender: data.profile.gender || '',
          date_of_birth: formattedDate,
          citizenship: data.profile.citizenship || 'Indian',
          profile_photo: data.profile.profile_photo || '',
        });
      } else {
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          mobile: user?.mobile || '',
          location: '',
          gender: '',
          date_of_birth: '',
          citizenship: 'Indian',
          profile_photo: '',
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
      return;
    }

    setIsUploadingPhoto(true);
    setMessage({ type: '', text: '' });

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('upload_preset', 'spf_profile_photos');
      formDataUpload.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formDataUpload,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        setFormData({ ...formData, profile_photo: data.secure_url });

        // Auto-save photo to database
        const saveResponse = await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            profile_photo: data.secure_url,
          }),
        });

        if (saveResponse.ok) {
          setMessage({ type: 'success', text: 'Photo uploaded successfully!' });
          // Refresh profile data to ensure consistency
          await fetchProfile();
        } else {
          setMessage({ type: 'error', text: 'Photo uploaded but failed to save. Please try again.' });
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to upload photo. Please try again.' });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setMessage({ type: 'error', text: 'Failed to upload photo. Please try again.' });
    } finally {
      setIsUploadingPhoto(false);
    }
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

        // Update AuthContext with new user data
        if (user && data.profile) {
          login({
            ...user,
            name: data.profile.name,
            mobile: data.profile.mobile,
            location: data.profile.location,
          });
        }

        // Refresh profile data from database
        await fetchProfile();
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
          {/* Avatar with Photo Upload */}
          <div className="flex items-center mb-8">
            <div className="relative">
              {formData.profile_photo ? (
                <div className="w-24 h-24 rounded-full overflow-hidden relative">
                  <Image
                    src={formData.profile_photo}
                    alt="Profile Photo"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 bg-[#722F37] rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {formData.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}

              {/* Camera Icon Overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#722F37] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#5a252c] transition-colors disabled:opacity-50"
              >
                {isUploadingPhoto ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div className="ml-4">
              <h2 className="text-xl font-semibold text-[#2D2D2D]">{formData.name}</h2>
              <p className="text-[#6B6B6B]">{formData.email}</p>
              <p className="text-xs text-[#722F37] mt-1 cursor-pointer hover:underline" onClick={() => fileInputRef.current?.click()}>
                {formData.profile_photo ? 'Change photo' : 'Add photo'}
              </p>
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
                    fetchProfile();
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
