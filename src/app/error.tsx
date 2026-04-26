'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-4"></div>
        <h1 className="text-2xl font-bold text-[#2D2D2D] mb-3">
          Something Went Wrong
        </h1>
        <p className="text-[#6B6B6B] mb-8">
          We encountered an unexpected error. Please try again or return to the home page.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#722F37] text-white font-semibold rounded-full hover:bg-[#5a252c] transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 border-2 border-[#722F37] text-[#722F37] font-semibold rounded-full hover:bg-[#722F37] hover:text-white transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
