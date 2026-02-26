'use client';

import { CldImage } from 'next-cloudinary';
import Image from 'next/image';

interface CloudinaryImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}

/**
 * Smart Image Component
 * Automatically handles:
 * - Legacy Cloudinary images (public_id format)
 * - New S3/CloudFront images (full URLs or keys)
 * - Local images (paths starting with /)
 */
export default function CloudinaryImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
}: CloudinaryImageProps) {
  // Determine image source type
  const isFullUrl = src.startsWith('http');
  const isLocalPath = src.startsWith('/');
  const isS3Key = src.includes('/') && !isFullUrl && !isLocalPath;
  const isCloudinaryId = !isFullUrl && !isLocalPath && !isS3Key;

  // S3/CloudFront URL (full URL or S3 key)
  if (isFullUrl || isS3Key) {
    const imageUrl = isFullUrl
      ? src
      : `${process.env.NEXT_PUBLIC_CDN_URL || 'https://d3p9b9yka11dgj.cloudfront.net'}/${src}`;

    return (
      <Image
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        // Use unoptimized for CloudFront images as they're already optimized
        unoptimized={true}
      />
    );
  }

  // Legacy Cloudinary image (public_id)
  if (isCloudinaryId) {
    return (
      <CldImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        crop="fill"
        gravity="auto"
      />
    );
  }

  // Local image
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );
}
