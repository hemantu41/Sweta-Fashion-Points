'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';

const authPaths = ['/login', '/signup'];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  const isAuthPage = authPaths.includes(pathname);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-wine border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-charcoal font-lato">Loading...</p>
        </div>
      </div>
    );
  }

  // For auth pages (login/signup), show minimal layout
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-white to-cream/50">
        {children}
      </div>
    );
  }

  // For other pages, show full layout with navbar and footer
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
