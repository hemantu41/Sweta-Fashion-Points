'use client';

import { useState } from 'react';
import Image from 'next/image';
import { compressImage } from '@/lib/image-compression';

interface MultiImageUploadProps {
  onImagesChange: (imageIds: string[]) => void;
  currentImageIds?: string[];
  label?: string;
  maxImages?: number;
  // Optional metadata for Cloudinary tagging and organization
  sellerId?: string;
  category?: string;
  productId?: string;
}

export default function MultiImageUpload({
  onImagesChange,
  currentImageIds = [],
  label = 'Upload Images',
  maxImages = 5,
  sellerId,
  category,
  productId
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<string[]>(currentImageIds);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressing, setCompressing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Check if adding these files would exceed max
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setError('');
    setCompressing(true);
    setUploadProgress(0);

    try {
      // Compress images first
      const compressedFiles = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          throw new Error('Please select valid image files (JPEG, PNG, or WebP)');
        }

        // Compress the image
        const compressed = await compressImage(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          quality: 0.85,
        });

        compressedFiles.push(compressed);
        setUploadProgress(Math.round(((i + 1) / files.length) * 50)); // First 50% for compression
      }

      setCompressing(false);
      setUploading(true);

      // Upload compressed images
      const uploadPromises = compressedFiles.map(async (file, index) => {
        // Upload to server
        const formData = new FormData();
        formData.append('file', file);

        // Add optional metadata for Cloudinary tagging
        if (sellerId) formData.append('sellerId', sellerId);
        if (category) formData.append('category', category);
        if (productId) formData.append('productId', productId);

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to upload image');
        }

        return data.imageId;
      });

      const uploadedImageIds = await Promise.all(uploadPromises);
      const newImages = [...images, ...uploadedImageIds];
      setImages(newImages);
      onImagesChange(newImages);
      setUploadProgress(100);

      // Reset progress after a short delay
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error: any) {
      setError(error.message || 'Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
      setCompressing(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const newImages = images.filter((_, index) => index !== indexToRemove);
    setImages(newImages);
    onImagesChange(newImages);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div>
      <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
        {label} {images.length > 0 && `(${images.length}/${maxImages})`}
      </label>

      {/* Display uploaded images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {images.map((imageId, index) => (
            <div key={index} className="relative group">
              <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-[#E8E2D9]">
                <Image
                  src={
                    imageId.startsWith('http')
                      ? imageId // Already a full URL
                      : imageId.includes('/')
                      ? `${process.env.NEXT_PUBLIC_CDN_URL || 'https://d3p9b9yka11dgj.cloudfront.net'}/${imageId}` // S3 key -> CloudFront URL
                      : `https://res.cloudinary.com/duoxrodmv/image/upload/c_fill,w_300,h_300/${imageId}` // Legacy Cloudinary ID
                  }
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                title="Remove image"
              >
                ×
              </button>
              {index === 0 && (
                <span className="absolute top-2 left-2 bg-[#722F37] text-white text-xs px-2 py-1 rounded">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {canAddMore && (
        <div>
          <label className="relative cursor-pointer">
            <div className="border-2 border-dashed border-[#E8E2D9] rounded-lg p-6 hover:border-[#722F37] transition-colors text-center">
              {(compressing || uploading) ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-[#2D2D2D] font-medium">
                    {compressing ? 'Compressing images...' : 'Uploading...'}
                  </p>
                  {uploadProgress > 0 && (
                    <>
                      <div className="w-full max-w-xs h-2 bg-[#E8E2D9] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#722F37] transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#6B6B6B]">{uploadProgress}%</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-12 h-12 text-[#6B6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-sm font-medium text-[#2D2D2D]">
                    {images.length === 0 ? 'Click to upload images' : 'Add more images'}
                  </p>
                  <p className="text-xs text-[#6B6B6B]">JPEG, PNG, or WebP (max 5MB each)</p>
                  <p className="text-xs text-[#6B6B6B]">You can select multiple files at once</p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={uploading || compressing}
              multiple
              className="hidden"
            />
          </label>

          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>
      )}

      {images.length === 0 && (
        <p className="text-xs text-[#6B6B6B] mt-2">
          The first image will be used as the main product image
        </p>
      )}
    </div>
  );
}
