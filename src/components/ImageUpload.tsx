'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
  onImageUploaded: (imageId: string) => void;
  currentImageId?: string;
  label?: string;
}

export default function ImageUpload({ onImageUploaded, currentImageId, label = 'Upload Image' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        onImageUploaded(data.imageId);
      } else {
        setError(data.error || 'Failed to upload image');
        setPreview(null);
      }
    } catch (error) {
      setError('Failed to upload image. Please try again.');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  // Support both S3 keys (full paths) and legacy Cloudinary IDs
  const currentImageUrl = currentImageId
    ? currentImageId.startsWith('http')
      ? currentImageId // Already a full URL
      : currentImageId.includes('/')
      ? `${process.env.NEXT_PUBLIC_CDN_URL || 'https://d3p9b9yka11dgj.cloudfront.net'}/${currentImageId}` // S3 key -> CloudFront URL
      : `https://res.cloudinary.com/duoxrodmv/image/upload/c_fill,w_300,h_300/${currentImageId}` // Legacy Cloudinary ID
    : null;

  return (
    <div>
      <label className="block text-sm font-medium text-[#2D2D2D] mb-2">{label}</label>

      <div className="flex items-start gap-4">
        {/* Preview/Current Image */}
        {(preview || currentImageUrl) && (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-[#E8E2D9]">
            <Image
              src={preview || currentImageUrl || ''}
              alt="Product preview"
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Upload Button */}
        <div className="flex-1">
          <label className="relative cursor-pointer">
            <div className="border-2 border-dashed border-[#E8E2D9] rounded-lg p-6 hover:border-[#722F37] transition-colors text-center">
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-[#6B6B6B]">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-12 h-12 text-[#6B6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-sm font-medium text-[#2D2D2D]">
                    {currentImageId || preview ? 'Change Image' : 'Click to upload'}
                  </p>
                  <p className="text-xs text-[#6B6B6B]">JPEG, PNG, or WebP (max 5MB)</p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}

          {currentImageId && (
            <p className="mt-2 text-xs text-[#6B6B6B]">
              Image ID: <code className="bg-gray-100 px-2 py-1 rounded">{currentImageId}</code>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
