import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sarees Collection | Daily Wear, Wedding & Party Sarees | Fashion Points',
  description: 'Explore premium sarees at Fashion Points, Amas, Gaya, Bihar. Shop daily wear, party wear, wedding and festival sarees in silk, cotton, georgette & more. Quality sarees at affordable prices.',
  keywords: 'sarees, wedding sarees, party sarees, daily wear sarees, silk sarees, cotton sarees, saree shop Gaya, saree Bihar, Fashion Points',
  openGraph: {
    title: 'Sarees Collection | Fashion Points',
    description: 'Premium sarees — daily, party, wedding & festival. Shop online or visit our store in Amas, Gaya, Bihar.',
    url: 'https://fashionpoints.co.in/sarees',
    siteName: 'Fashion Points',
    type: 'website',
  },
  alternates: {
    canonical: 'https://fashionpoints.co.in/sarees',
  },
};

export default function SareesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
