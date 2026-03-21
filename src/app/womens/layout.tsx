import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Women's Clothing | Daily, Party, Ethnic & Seasonal Wear | Insta Fashion Points",
  description: "Shop women's clothing at Insta Fashion Points, Amas, Gaya, Bihar. Beautiful collection of daily wear, party wear, ethnic wear and seasonal fashion for women at great prices.",
  keywords: "women's clothing, ethnic wear, party wear, daily wear, women's fashion Gaya, ladies wear Bihar, seasonal fashion, Insta Fashion Points",
  openGraph: {
    title: "Women's Clothing Collection | Insta Fashion Points",
    description: "Beautiful women's fashion — daily, party, ethnic & seasonal wear. Shop online or visit us in Amas, Gaya.",
    url: 'https://fashionpoints.co.in/womens',
    siteName: 'Insta Fashion Points',
    type: 'website',
  },
  alternates: {
    canonical: 'https://fashionpoints.co.in/womens',
  },
};

export default function WomensLayout({ children }: { children: React.ReactNode }) {
  return children;
}
