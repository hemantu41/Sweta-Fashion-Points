import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { AuthGuard, MainLayout } from "@/components";

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
  title: "Fashion Points | Premium Clothing Store in Amas, Gaya, Bihar",
  description: "Discover trendy fashion for Men, Women, Kids & exclusive Saree collections at Fashion Points. Your trusted clothing store in Amas, Gaya, Bihar. Shop quality fashion at affordable prices.",
  keywords: "clothing store Amas, fashion store Gaya, saree shop Bihar, men's fashion, women's fashion, kids clothing, ethnic wear, wedding sarees, party wear, Fashion Points",
  openGraph: {
    title: "Fashion Points | Premium Clothing Store in Amas, Gaya",
    description: "Trendy fashion for the whole family. Premium quality at affordable prices. Shop online or visit our store.",
    url: "https://fashionpoints.co.in",
    siteName: "Fashion Points",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fashion Points | Clothing Store in Gaya, Bihar",
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
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ClothingStore",
              name: "Fashion Points",
              image: "https://fashionpoints.co.in/logo.png",
              "@id": "https://fashionpoints.co.in",
              url: "https://fashionpoints.co.in",
              telephone: "+91-9608063673",
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
                dayOfWeek: [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ],
                opens: "09:00",
                closes: "17:30",
              },
              priceRange: "₹₹",
              servesCuisine: "Clothing",
              areaServed: {
                "@type": "GeoCircle",
                geoMidpoint: {
                  "@type": "GeoCoordinates",
                  latitude: 24.79,
                  longitude: 85.0,
                },
                geoRadius: "100000",
              },
            }),
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
      </body>
    </html>
  );
}
