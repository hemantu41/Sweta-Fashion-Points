import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Footwear | Sandals, Shoes & Chappals | Insta Fashion Points",
  description: "Shop footwear at Insta Fashion Points, Amas, Gaya, Bihar. Browse sandals, shoes, chappals and more for men, women and kids at affordable prices.",
  keywords: "footwear, sandals, shoes, chappals, slippers, men's shoes, women's sandals, kids footwear, Insta Fashion Points Gaya, footwear Bihar",
  openGraph: {
    title: "Footwear Collection | Insta Fashion Points",
    description: "Sandals, shoes & chappals for men, women and kids. Shop online or visit us in Amas, Gaya, Bihar.",
    url: 'https://fashionpoints.co.in/footwear',
    siteName: 'Insta Fashion Points',
    type: 'website',
  },
  alternates: {
    canonical: 'https://fashionpoints.co.in/footwear',
  },
};

export default function FootwearLayout({ children }: { children: React.ReactNode }) {
  return children;
}
