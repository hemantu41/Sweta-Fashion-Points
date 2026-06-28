import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { AuthGuard, MainLayout } from "@/components";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import GoogleAnalyticsPageTracker from "@/components/GoogleAnalyticsPageTracker";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Insta Fashion Points | Premium Fashion at Affordable Prices",
    template: "%s | Insta Fashion Points",
  },
  description: "Shop affordable and premium fashion products from local boutiques. Fast delivery in Hyderabad and pan-India shipping.",
  keywords: "clothing store Amas, fashion store Gaya, saree shop Bihar, men's fashion, women's fashion, kids clothing, ethnic wear, wedding sarees, party wear, Insta Fashion Points",
  openGraph: {
    title: "Insta Fashion Points | Premium Clothing Store in Amas, Gaya",
    description: "Trendy fashion for the whole family. Premium quality at affordable prices. Shop online or visit our store.",
    url: "https://fashionpoints.co.in",
    siteName: "Insta Fashion Points",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://fashionpoints.co.in/logo.jpg", width: 400, height: 400, alt: "Insta Fashion Points" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Insta Fashion Points | Clothing Store in Gaya, Bihar",
    description: "Trendy fashion for Men, Women, Kids & exclusive Sarees. Shop online or visit us in Amas, Gaya.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://fashionpoints.co.in",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#722F37" />
        <meta name="geo.region" content="IN-BR" />
        <meta name="geo.placename" content="Amas, Gaya, Bihar" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "ClothingStore",
                "@id": "https://fashionpoints.co.in/#store",
                name: "Insta Fashion Points",
                image: "https://fashionpoints.co.in/logo.jpg",
                url: "https://fashionpoints.co.in",
                telephone: "+91-8294153256",
                address: {
                  "@type": "PostalAddress",
                  streetAddress: "Amas",
                  addressLocality: "Gaya",
                  addressRegion: "Bihar",
                  postalCode: "824219",
                  addressCountry: "IN",
                },
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: 24.79,
                  longitude: 85.0,
                },
                openingHoursSpecification: {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
                  opens: "09:00",
                  closes: "17:30",
                },
                priceRange: "₹₹",
                currenciesAccepted: "INR",
                paymentAccepted: "Cash, UPI, Credit Card, Debit Card",
                areaServed: {
                  "@type": "GeoCircle",
                  geoMidpoint: {
                    "@type": "GeoCoordinates",
                    latitude: 24.79,
                    longitude: 85.0,
                  },
                  geoRadius: "100000",
                },
                hasOfferCatalog: {
                  "@type": "OfferCatalog",
                  name: "Fashion Collection",
                  itemListElement: [
                    { "@type": "Offer", itemOffered: { "@type": "Product", name: "Sarees" } },
                    { "@type": "Offer", itemOffered: { "@type": "Product", name: "Kurtis" } },
                    { "@type": "Offer", itemOffered: { "@type": "Product", name: "Men's Clothing" } },
                    { "@type": "Offer", itemOffered: { "@type": "Product", name: "Kids Clothing" } },
                  ],
                },
                sameAs: ["https://fashionpoints.co.in"],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": "https://fashionpoints.co.in/#website",
                name: "Insta Fashion Points",
                url: "https://fashionpoints.co.in",
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: "https://fashionpoints.co.in/search?q={search_term_string}",
                  },
                  "query-input": "required name=search_term_string",
                },
              },
            ]),
          }}
        />
      </head>
      <body className={`${playfair.variable} ${lato.variable} antialiased`}>
        <AuthProvider>
          <LanguageProvider>
            <CartProvider>
              <AuthGuard>
                <MainLayout>{children}</MainLayout>
              </AuthGuard>
            </CartProvider>
          </LanguageProvider>
        </AuthProvider>
        <GoogleAnalytics />
        <Suspense fallback={null}>
          <GoogleAnalyticsPageTracker />
        </Suspense>
      </body>
    </html>
  );
}
