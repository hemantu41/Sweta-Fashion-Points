/**
 * Custom hook for image upload with compression
 * Handles client-side compression before uploading to reduce bandwidth and time
 */

import { useState } from 'react';
import { compressImage, isValidImage } from '@/lib/image-compression';

interface UploadOptions {
  sellerId?: string;
  category?: string;
  productId?: string;
  compress?: boolean;
}

interface UploadResult {
  success: boolean;
  imageId?: string;
  url?: string;
  error?: string;
}

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      setUploading(true);
      setProgress(0);

      // Validate image
      if (!isValidImage(file)) {
        throw new Error('Invalid image file');
      }

      setProgress(10);

      // Compress image (unless disabled)
      let fileToUpload = file;
      if (options.compress !== false) {
        console.log('[Image Upload] Compressing image...');
        fileToUpload = await compressImage(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          quality: 0.85,
        });
        setProgress(30);
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', fileToUpload);
      if (options.sellerId) formData.append('sellerId', options.sellerId);
      if (options.category) formData.append('category', options.category);
      if (options.productId) formData.append('productId', options.productId);

      setProgress(40);

      // Upload to server
      console.log('[Image Upload] Uploading to server...');
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      setProgress(90);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setProgress(100);

      console.log('[Image Upload] Upload successful:', data.url);

      return {
        success: true,
        imageId: data.imageId,
        url: data.url,
      };
    } catch (error: any) {
      console.error('[Image Upload] Error:', error);
      return {
        success: false,
        error: error.message || 'Upload failed',
      };
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const uploadMultipleImages = async (
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> => {
    setUploading(true);
    setProgress(0);

    try {
      const results: UploadResult[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const result = await uploadImage(files[i], options);
        results.push(result);

        // Update progress
        const currentProgress = ((i + 1) / totalFiles) * 100;
        setProgress(currentProgress);
      }

      return results;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return {
    uploadImage,
    uploadMultipleImages,
    uploading,
    progress,
  };
}
