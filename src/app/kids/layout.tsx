import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Kids Clothing | Age 0–12 Years | Fashion Points",
  description: "Shop adorable kids clothing at Fashion Points, Amas, Gaya, Bihar. Comfortable and stylish clothes for children aged 0–12 years. Affordable kids fashion for every occasion.",
  keywords: "kids clothing, children's wear, baby clothes, boys clothing, girls clothing, kids fashion Gaya, children wear Bihar, Fashion Points",
  openGraph: {
    title: "Kids Clothing Collection | Fashion Points",
    description: "Stylish and comfortable kids clothing for ages 0–12. Shop online or visit us in Amas, Gaya, Bihar.",
    url: 'https://fashionpoints.co.in/kids',
    siteName: 'Fashion Points',
    type: 'website',
  },
  alternates: {
    canonical: 'https://fashionpoints.co.in/kids',
  },
};

export default function KidsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
