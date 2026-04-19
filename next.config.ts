import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // ⚠️ Temporarily ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  images: {
    // Serve WebP / AVIF instead of JPEG/PNG — typically 30-50 % smaller
    formats: ['image/avif', 'image/webp'],
    // Cache optimised images in Next.js image server for 30 days
    // (browser re-validates via ETag, so stale images are never shown)
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/**',
      },
      {
        // Banner carousel background images
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
