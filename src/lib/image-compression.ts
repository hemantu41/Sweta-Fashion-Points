/**
 * Client-side image compression utility
 * Compresses images before upload to reduce file size and upload time
 */

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
}

/**
 * Compress an image file
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 1, // Max 1MB
    maxWidthOrHeight = 1920, // Max 1920px
    quality = 0.8, // 80% quality
  } = options;

  // If file is already small, return as is
  if (file.size / 1024 / 1024 < 0.5) {
    // Less than 500KB
    console.log('[Image Compression] File already small, skipping compression');
    return file;
  }

  try {
    console.log('[Image Compression] Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');

    // Create a canvas element
    const img = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Calculate new dimensions while maintaining aspect ratio
    let { width, height } = img;

    if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
      if (width > height) {
        height = (height / width) * maxWidthOrHeight;
        width = maxWidthOrHeight;
      } else {
        width = (width / height) * maxWidthOrHeight;
        height = maxWidthOrHeight;
      }
    }

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Draw image on canvas
    ctx.drawImage(img, 0, 0, width, height);

    // Convert canvas to blob with compression
    const compressedBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        file.type || 'image/jpeg',
        quality
      );
    });

    console.log('[Image Compression] Compressed file size:', (compressedBlob.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('[Image Compression] Compression ratio:', ((1 - compressedBlob.size / file.size) * 100).toFixed(1), '%');

    // If compressed file is larger, return original
    if (compressedBlob.size >= file.size) {
      console.log('[Image Compression] Compressed file larger, using original');
      return file;
    }

    // Create new File from compressed blob
    const compressedFile = new File(
      [compressedBlob],
      file.name,
      {
        type: file.type || 'image/jpeg',
        lastModified: Date.now(),
      }
    );

    // If still too large, try again with lower quality
    if (compressedFile.size / 1024 / 1024 > maxSizeMB && quality > 0.5) {
      console.log('[Image Compression] Still too large, compressing again with lower quality');
      return compressImage(compressedFile, {
        ...options,
        quality: quality - 0.1,
      });
    }

    return compressedFile;
  } catch (error) {
    console.error('[Image Compression] Error:', error);
    // Return original file if compression fails
    return file;
  }
}

/**
 * Compress multiple images
 * @param files - Array of image files
 * @param options - Compression options
 * @returns Array of compressed files
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  console.log('[Image Compression] Compressing', files.length, 'images');

  const compressedFiles = await Promise.all(
    files.map((file) => compressImage(file, options))
  );

  const totalOriginalSize = files.reduce((sum, file) => sum + file.size, 0);
  const totalCompressedSize = compressedFiles.reduce((sum, file) => sum + file.size, 0);

  console.log('[Image Compression] Total original size:', (totalOriginalSize / 1024 / 1024).toFixed(2), 'MB');
  console.log('[Image Compression] Total compressed size:', (totalCompressedSize / 1024 / 1024).toFixed(2), 'MB');
  console.log('[Image Compression] Total saved:', ((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(1), '%');

  return compressedFiles;
}

/**
 * Validate image file
 * @param file - File to validate
 * @returns true if valid image
 */
export function isValidImage(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB max original size

  if (!validTypes.includes(file.type)) {
    console.error('[Image Validation] Invalid file type:', file.type);
    return false;
  }

  if (file.size > maxSize) {
    console.error('[Image Validation] File too large:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    return false;
  }

  return true;
}
