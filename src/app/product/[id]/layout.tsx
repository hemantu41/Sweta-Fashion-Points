import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';

const BASE_URL = 'https://fashionpoints.co.in';
const CLOUDINARY_CLOUD = 'duoxrodmv';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;

  const { data: product } = await supabase
    .from('spf_productdetails')
    .select('name, description, main_image, approval_status, is_active')
    .eq('id', id)
    .eq('approval_status', 'approved')
    .eq('is_active', true)
    .single();

  if (!product) {
    return {
      title: 'Product | Insta Fashion Points',
      description: 'Shop premium clothing at Insta Fashion Points, Amas, Gaya, Bihar.',
    };
  }

  const description = product.description
    ? product.description.slice(0, 160)
    : `Buy ${product.name} at Insta Fashion Points. Quality fashion at affordable prices in Amas, Gaya, Bihar.`;

  const imageUrl = product.main_image
    ? `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/w_800,q_auto,f_auto/${product.main_image}`
    : undefined;

  return {
    title: `${product.name} | Insta Fashion Points`,
    description,
    openGraph: {
      title: product.name,
      description,
      url: `${BASE_URL}/product/${id}`,
      siteName: 'Insta Fashion Points',
      type: 'website',
      ...(imageUrl && {
        images: [{ url: imageUrl, alt: product.name, width: 800, height: 1067 }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
    alternates: {
      canonical: `${BASE_URL}/product/${id}`,
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
