import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Footwear | Sandals, Shoes & Chappals | Fashion Points",
  description: "Shop footwear at Fashion Points, Amas, Gaya, Bihar. Browse sandals, shoes, chappals and more for men, women and kids at affordable prices.",
  keywords: "footwear, sandals, shoes, chappals, slippers, men's shoes, women's sandals, kids footwear, Fashion Points Gaya, footwear Bihar",
  openGraph: {
    title: "Footwear Collection | Fashion Points",
    description: "Sandals, shoes & chappals for men, women and kids. Shop online or visit us in Amas, Gaya, Bihar.",
    url: 'https://fashionpoints.co.in/footwear',
    siteName: 'Fashion Points',
    type: 'website',
  },
  alternates: {
    canonical: 'https://fashionpoints.co.in/footwear',
  },
};

export default function FootwearLayout({ children }: { children: React.ReactNode }) {
  return children;
}
