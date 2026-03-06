import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-[#722F37] mb-4">404</div>
        <h1 className="text-2xl font-bold text-[#2D2D2D] mb-3">
          Page Not Found
        </h1>
        <p className="text-[#6B6B6B] mb-8">
          The page you are looking for doesn&apos;t exist or may have been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Link
            href="/"
            className="px-6 py-3 bg-[#722F37] text-white font-semibold rounded-full hover:bg-[#5a252c] transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/search"
            className="px-6 py-3 border-2 border-[#722F37] text-[#722F37] font-semibold rounded-full hover:bg-[#722F37] hover:text-white transition-colors"
          >
            Search Products
          </Link>
        </div>

        <div className="border-t border-[#E8E2D9] pt-6">
          <p className="text-sm text-[#6B6B6B] mb-3">Browse our collections</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { href: '/sarees', label: 'Sarees' },
              { href: '/mens', label: "Men's" },
              { href: '/womens', label: "Women's" },
              { href: '/kids', label: 'Kids' },
            ].map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="px-4 py-1.5 bg-[#F0EDE8] text-[#2D2D2D] text-sm rounded-full hover:bg-[#E8E2D9] transition-colors"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
