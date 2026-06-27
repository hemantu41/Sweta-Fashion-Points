import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const revalidate = 3600;

const BASE_URL = 'https://fashionpoints.co.in';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                           lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/sarees`,               lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 },
    { url: `${BASE_URL}/mens`,                 lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 },
    { url: `${BASE_URL}/womens`,               lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 },
    { url: `${BASE_URL}/kids`,                 lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 },
    { url: `${BASE_URL}/new-arrivals`,         lastModified: new Date(), changeFrequency: 'daily',  priority: 0.8 },
    { url: `${BASE_URL}/search`,               lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${BASE_URL}/contact`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/return-policy`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/terms-and-conditions`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Category pages — highest SEO value after homepage
  const { data: categories } = await supabase
    .from('spf_categories')
    .select('slug, level, updated_at')
    .eq('is_active', true);

  const categoryPages: MetadataRoute.Sitemap = (categories || []).map((cat) => ({
    url: `${BASE_URL}/category/${cat.slug}`,
    lastModified: cat.updated_at ? new Date(cat.updated_at) : new Date(),
    changeFrequency: 'daily',
    // L1 categories get higher priority than L2/L3
    priority: cat.level === 1 ? 0.9 : cat.level === 2 ? 0.8 : 0.7,
  }));

  // Product pages
  const { data: products } = await supabase
    .from('spf_productdetails')
    .select('id, updated_at')
    .eq('approval_status', 'approved')
    .eq('is_active', true)
    .is('deleted_at', null);

  const productPages: MetadataRoute.Sitemap = (products || []).map((product) => ({
    url: `${BASE_URL}/product/${product.id}`,
    lastModified: new Date(product.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
