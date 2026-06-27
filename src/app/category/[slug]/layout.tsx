import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';

const BASE_URL = 'https://fashionpoints.co.in';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;

  const { data: category } = await supabaseAdmin
    .from('spf_categories')
    .select('name, name_hindi, level')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!category) {
    return {
      title: 'Shop Fashion | Insta Fashion Points',
      description: 'Browse our fashion collection at Insta Fashion Points. Premium clothing at affordable prices.',
    };
  }

  const name = category.name;
  const title = `${name} | Buy ${name} Online | Insta Fashion Points`;
  const description = `Shop ${name} online at Insta Fashion Points, Amas, Gaya, Bihar. Premium quality ${name.toLowerCase()} at affordable prices. Fast delivery across India. Easy 7-day returns.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/category/${slug}`,
      siteName: 'Insta Fashion Points',
      type: 'website',
      images: [{ url: `${BASE_URL}/logo.jpg`, width: 400, height: 400, alt: 'Insta Fashion Points' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${BASE_URL}/category/${slug}`,
    },
  };
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
