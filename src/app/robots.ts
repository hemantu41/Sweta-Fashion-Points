import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/seller/dashboard/',
          '/delivery-partner/',
          '/api/',
          '/_next/',
          '/test-upload',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/seller/dashboard/',
          '/delivery-partner/',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://fashionpoints.co.in/sitemap.xml',
  };
}
