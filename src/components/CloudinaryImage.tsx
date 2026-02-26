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

export default function CloudinaryImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
}: CloudinaryImageProps) {
  // Check if it's a Cloudinary image (starts with cloudinary public ID) or local image
  const isCloudinaryImage = !src.startsWith('/') && !src.startsWith('http');

  if (isCloudinaryImage) {
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

  // Fallback to Next.js Image for local images
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
