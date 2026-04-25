import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sarees Collection | Daily Wear, Wedding & Party Sarees | Insta Fashion Points',
  description: 'Explore premium sarees at Insta Fashion Points, Amas, Gaya, Bihar. Shop daily wear, party wear, wedding and festival sarees in silk, cotton, georgette & more. Quality sarees at affordable prices.',
  keywords: 'sarees, wedding sarees, party sarees, daily wear sarees, silk sarees, cotton sarees, saree shop Gaya, saree Bihar, Insta Fashion Points',
  openGraph: {
    title: 'Sarees Collection | Insta Fashion Points',
    description: 'Premium sarees — daily, party, wedding & festival. Shop online or visit our store in Amas, Gaya, Bihar.',
    url: 'https://fashionpoints.co.in/sarees',
    siteName: 'Insta Fashion Points',
    type: 'website',
  },
  alternates: {
    canonical: 'https://fashionpoints.co.in/sarees',
  },
};

export default function SareesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
