import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Men's Clothing | Shirts, Jeans, T-Shirts & Shorts | Insta Fashion Points",
  description: "Shop men's fashion at Insta Fashion Points, Amas, Gaya, Bihar. Latest collection of shirts, jeans, t-shirts and shorts for men. Trendy styles at affordable prices.",
  keywords: "men's clothing, shirts, jeans, t-shirts, shorts, men's fashion Gaya, mens wear Bihar, Insta Fashion Points",
  openGraph: {
    title: "Men's Clothing Collection | Insta Fashion Points",
    description: "Latest men's fashion — shirts, jeans, t-shirts & shorts. Shop online or visit us in Amas, Gaya.",
    url: 'https://fashionpoints.co.in/mens',
    siteName: 'Insta Fashion Points',
    type: 'website',
  },
  alternates: {
    canonical: 'https://fashionpoints.co.in/mens',
  },
};

export default function MensLayout({ children }: { children: React.ReactNode }) {
  return children;
}
