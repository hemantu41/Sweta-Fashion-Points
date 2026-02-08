'use client';

import { useState } from 'react';
import Image from 'next/image';

interface MultiImageUploadProps {
  onImagesChange: (imageIds: string[]) => void;
  currentImageIds?: string[];
  label?: string;
  maxImages?: number;
}

export default function MultiImageUpload({
  onImagesChange,
  currentImageIds = [],
  label = 'Upload Images',
  maxImages = 5
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<string[]>(currentImageIds);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Check if adding these files would exceed max
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setError('');
    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          throw new Error('Please select valid image files (JPEG, PNG, or WebP)');
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new Error('File size must be less than 5MB');
        }

        // Upload to server
        const formData = new FormData();
        formData.append('file', file);

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
    } catch (error: any) {
      setError(error.message || 'Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
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
                  src={`https://res.cloudinary.com/duoxrodmv/image/upload/c_fill,w_300,h_300/${imageId}`}
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
              disabled={uploading}
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
