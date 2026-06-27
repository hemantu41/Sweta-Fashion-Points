import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Arrivals | Latest Fashion Collection | Insta Fashion Points',
  description: 'Discover the latest fashion arrivals at Insta Fashion Points, Amas, Gaya, Bihar. Fresh styles for men, women & kids — updated regularly. Shop new collections at affordable prices.',
  keywords: 'new arrivals, latest fashion, new collection, new clothing, new sarees, new kurtas, fashion 2025, Insta Fashion Points, Gaya Bihar',
  openGraph: {
    title: 'New Arrivals | Insta Fashion Points',
    description: 'Fresh fashion arrivals for men, women & kids. Shop the latest styles at Insta Fashion Points.',
    url: 'https://fashionpoints.co.in/new-arrivals',
    siteName: 'Insta Fashion Points',
    type: 'website',
  },
  alternates: {
    canonical: 'https://fashionpoints.co.in/new-arrivals',
  },
};

export default function NewArrivalsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
