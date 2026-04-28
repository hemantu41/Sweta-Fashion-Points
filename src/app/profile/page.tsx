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
    latitude: null as number | null,
    longitude: null as number | null,
    gender: '',
    date_of_birth: '',
    citizenship: 'Indian',
    profile_photo: '',
  });
  const [addressData, setAddressData] = useState({
    addressId: '',
    addressName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Bihar',
    pincode: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // localStorage is empty but the iron-session cookie may still be valid.
      // Try to restore from the server before redirecting — avoids the redirect
      // loop where the middleware would bounce /login back to /profile (because
      // the cookie is valid) while localStorage is still empty.
      fetch('/api/auth/session')
        .then(r => r.json())
        .then(data => {
          if (data.isLoggedIn && data.user) {
            login(data.user); // restores localStorage; fetchProfile fires via [user] effect
          } else {
            // Truly unauthenticated — redirect to login with callbackUrl
            router.replace('/login?callbackUrl=/profile');
          }
        })
        .catch(() => {
          router.replace('/login?callbackUrl=/profile');
        });
      return;
    }

    if (user?.id) {
      fetchProfile();
    }
  }, [user, isAuthenticated, isLoading, router, login]);

  const fetchProfile = async () => {
    try {
      const [profileRes, addressRes] = await Promise.all([
        fetch(`/api/user/profile?userId=${user?.id}`),
        fetch(`/api/user/addresses?userId=${user?.id}`),
      ]);
      const profileData = await profileRes.json();
      const addressData = await addressRes.json();

      if (profileRes.ok && profileData.profile) {
        let formattedDate = '';
        if (profileData.profile.date_of_birth) {
          const date = new Date(profileData.profile.date_of_birth);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0];
          }
        }
        setFormData({
          name: profileData.profile.name || user?.name || '',
          email: profileData.profile.email || user?.email || '',
          mobile: profileData.profile.mobile || user?.mobile || '',
          location: profileData.profile.location || '',
          latitude: profileData.profile.latitude != null ? Number(profileData.profile.latitude) : null,
          longitude: profileData.profile.longitude != null ? Number(profileData.profile.longitude) : null,
          gender: profileData.profile.gender || '',
          date_of_birth: formattedDate,
          citizenship: profileData.profile.citizenship || 'Indian',
          profile_photo: profileData.profile.profile_photo || '',
        });
      } else {
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          mobile: user?.mobile || '',
          location: '',
          latitude: null,
          longitude: null,
          gender: '',
          date_of_birth: '',
          citizenship: 'Indian',
          profile_photo: '',
        });
      }

      // Load default address (first address ordered by is_default desc)
      if (addressRes.ok && addressData.addresses?.length > 0) {
        const def = addressData.addresses[0];
        setAddressData({
          addressId: def.id || '',
          addressName: def.name || '',
          phone: def.phone || '',
          addressLine1: def.address_line1 || '',
          addressLine2: def.address_line2 || '',
          city: def.city || '',
          state: def.state || 'Bihar',
          pincode: def.pincode || '',
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
      // Save profile and address concurrently
      const saves: Promise<Response>[] = [
        fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.id, ...formData }),
        }),
      ];

      // Only save address if at least address line 1 is filled
      const hasAddress = addressData.addressLine1.trim();
      if (hasAddress) {
        if (addressData.addressId) {
          // Update existing address
          saves.push(
            fetch('/api/user/addresses', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user?.id,
                addressId: addressData.addressId,
                name: addressData.addressName || formData.name,
                phone: addressData.phone || formData.mobile,
                addressLine1: addressData.addressLine1,
                addressLine2: addressData.addressLine2,
                city: addressData.city,
                state: addressData.state,
                pincode: addressData.pincode,
              }),
            })
          );
        } else {
          // Create new default address
          saves.push(
            fetch('/api/user/addresses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user?.id,
                name: addressData.addressName || formData.name,
                phone: addressData.phone || formData.mobile,
                addressLine1: addressData.addressLine1,
                addressLine2: addressData.addressLine2,
                city: addressData.city,
                state: addressData.state,
                pincode: addressData.pincode,
                isDefault: true,
              }),
            })
          );
        }
      }

      const [profileRes] = await Promise.all(saves);
      const profileData = await profileRes.json();

      if (profileRes.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        if (user && profileData.profile) {
          login({
            ...user,
            name: profileData.profile.name,
            mobile: profileData.profile.mobile,
            location: profileData.profile.location,
            latitude: profileData.profile.latitude != null ? Number(profileData.profile.latitude) : undefined,
            longitude: profileData.profile.longitude != null ? Number(profileData.profile.longitude) : undefined,
          });
        }
        await fetchProfile();
      } else {
        setMessage({ type: 'error', text: profileData.error || 'Failed to save profile' });
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

            {/* Address Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Address</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Name */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Contact Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={addressData.addressName}
                      onChange={e => setAddressData(p => ({ ...p, addressName: e.target.value }))}
                      placeholder="Name for delivery"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-[#F5F0E8] rounded-lg text-[#2D2D2D]">{addressData.addressName || '-'}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Contact Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={addressData.phone}
                      onChange={e => setAddressData(p => ({ ...p, phone: e.target.value }))}
                      placeholder="10-digit mobile number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-[#F5F0E8] rounded-lg text-[#2D2D2D]">{addressData.phone || '-'}</p>
                  )}
                </div>

                {/* Address Line 1 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Address Line 1</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={addressData.addressLine1}
                      onChange={e => setAddressData(p => ({ ...p, addressLine1: e.target.value }))}
                      placeholder="House no., Street, Area"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-[#F5F0E8] rounded-lg text-[#2D2D2D]">{addressData.addressLine1 || '-'}</p>
                  )}
                </div>

                {/* Address Line 2 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Address Line 2
                    <span className="ml-1 text-xs text-[#6B6B6B] font-normal">(optional)</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={addressData.addressLine2}
                      onChange={e => setAddressData(p => ({ ...p, addressLine2: e.target.value }))}
                      placeholder="Landmark, Colony, Near..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-[#F5F0E8] rounded-lg text-[#2D2D2D]">{addressData.addressLine2 || '-'}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">City / Town</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={addressData.city}
                      onChange={e => setAddressData(p => ({ ...p, city: e.target.value }))}
                      placeholder="e.g. Gaya"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-[#F5F0E8] rounded-lg text-[#2D2D2D]">{addressData.city || '-'}</p>
                  )}
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Pincode</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={addressData.pincode}
                      onChange={e => setAddressData(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      placeholder="6-digit pincode"
                      maxLength={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-[#F5F0E8] rounded-lg text-[#2D2D2D]">{addressData.pincode || '-'}</p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">State</label>
                  {isEditing ? (
                    <select
                      value={addressData.state}
                      onChange={e => setAddressData(p => ({ ...p, state: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                    >
                      {['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu & Kashmir','Jharkhand','Karnataka','Kerala','Ladakh','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="px-4 py-3 bg-[#F5F0E8] rounded-lg text-[#2D2D2D]">{addressData.state || '-'}</p>
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
