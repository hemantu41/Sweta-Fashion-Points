import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Makeup & Beauty | Cosmetics & Skincare | Fashion Points",
  description: "Shop makeup and beauty products at Fashion Points, Amas, Gaya, Bihar. Explore cosmetics, skincare and beauty essentials at great prices.",
  keywords: "makeup, cosmetics, skincare, beauty products, lipstick, foundation, eye makeup, fashion points beauty, makeup Gaya, cosmetics Bihar",
  openGraph: {
    title: "Makeup & Beauty Collection | Fashion Points",
    description: "Cosmetics, skincare & beauty essentials. Shop online or visit us in Amas, Gaya, Bihar.",
    url: 'https://fashionpoints.co.in/makeup',
    siteName: 'Fashion Points',
    type: 'website',
  },
  alternates: {
    canonical: 'https://fashionpoints.co.in/makeup',
  },
};

export default function MakeupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
