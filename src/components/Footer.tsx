'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { language } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0E0E0E] text-white">

      {/* Newsletter Strip */}
      <div className="border-b border-[#1E1E1E]">
        <div className="max-w-[1300px] mx-auto px-6 sm:px-8 lg:px-14 py-12 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-sm">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#C9A962] font-semibold mb-2">
                {language === 'hi' ? 'न्यूज़लेटर' : 'Newsletter'}
              </p>
              <h3
                className="text-[1.5rem] sm:text-[1.75rem] font-semibold text-white leading-snug tracking-[-0.02em]"
                style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}
              >
                {language === 'hi' ? 'नवीनतम कलेक्शन पाएं' : 'Stay Ahead of the Season'}
              </h3>
              <p className="mt-2 text-[12.5px] text-[#5A5A5A] font-light leading-relaxed">
                {language === 'hi'
                  ? 'नए आगमन और विशेष ऑफर सीधे आपके इनबॉक्स में।'
                  : 'New arrivals and exclusive offers, straight to your inbox.'
                }
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:min-w-[420px]">
              <input
                type="email"
                placeholder={language === 'hi' ? 'आपका ईमेल पता' : 'Your email address'}
                className="flex-1 bg-[#161616] border border-[#2A2A2A] text-white text-[13px] px-5 py-3.5 placeholder-[#3A3A3A] focus:outline-none focus:border-[#C9A962] transition-colors duration-200"
              />
              <button className="px-8 py-3.5 bg-[#C9A962] text-[#0E0E0E] text-[10px] font-bold tracking-[0.22em] uppercase hover:bg-[#B8943F] transition-colors duration-250 whitespace-nowrap">
                {language === 'hi' ? 'सदस्यता लें' : 'Subscribe'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Columns */}
      <div className="max-w-[1300px] mx-auto px-6 sm:px-8 lg:px-14 py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10">

          {/* Col 1 — Brand */}
          <div>
            <h2
              className="text-[1.6rem] font-semibold text-[#C9A962] tracking-[-0.01em] mb-3"
              style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}
            >
              Fashion Points
            </h2>
            <p className="text-[12.5px] text-[#4A4A4A] font-light leading-relaxed mb-8 max-w-[220px]">
              {language === 'hi'
                ? 'आपके लिए प्रीमियम फैशन — अमास, गया, बिहार से।'
                : 'Premium fashion for the whole family, from Amas, Gaya, Bihar.'
              }
            </p>

            {/* Social Icons */}
            <div className="flex gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-[#252525] flex items-center justify-center text-[#4A4A4A] hover:bg-[#C9A962] hover:text-[#0E0E0E] hover:border-[#C9A962] hover:scale-110 transition-all duration-250"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-[#252525] flex items-center justify-center text-[#4A4A4A] hover:bg-[#C9A962] hover:text-[#0E0E0E] hover:border-[#C9A962] hover:scale-110 transition-all duration-250"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://wa.me/918294153256"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-[#252525] flex items-center justify-center text-[#4A4A4A] hover:bg-[#C9A962] hover:text-[#0E0E0E] hover:border-[#C9A962] hover:scale-110 transition-all duration-250"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Col 2 — Quick Links */}
          <div>
            <p className="text-[9.5px] tracking-[0.3em] uppercase text-[#C9A962] font-semibold mb-6">
              {language === 'hi' ? 'त्वरित लिंक' : 'Quick Links'}
            </p>
            <ul className="space-y-4">
              {[
                { href: '/', label: language === 'hi' ? 'होम' : 'Home' },
                { href: '/terms-and-conditions', label: language === 'hi' ? 'नियम व शर्तें' : 'Terms & Conditions' },
                { href: '/return-policy', label: language === 'hi' ? 'वापसी नीति' : 'Return Policy' },
                { href: '/seller/register', label: language === 'hi' ? 'विक्रेता बनें' : 'Become a Seller', gold: true },
                { href: '/delivery-partner/register', label: language === 'hi' ? 'डिलीवरी पार्टनर बनें' : 'Become a Delivery Partner', gold: true },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`text-[12.5px] font-light tracking-wide transition-colors duration-200 ${
                      item.gold
                        ? 'text-[#C9A962] hover:text-white'
                        : 'text-[#4A4A4A] hover:text-[#C9A962]'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Collections */}
          <div>
            <p className="text-[9.5px] tracking-[0.3em] uppercase text-[#C9A962] font-semibold mb-6">
              {language === 'hi' ? 'कलेक्शन' : 'Collections'}
            </p>
            <ul className="space-y-4">
              {[
                { href: '/mens', label: language === 'hi' ? 'पुरुष' : "Men's" },
                { href: '/womens', label: language === 'hi' ? 'महिलाएं' : "Women's" },
                { href: '/sarees', label: language === 'hi' ? 'साड़ियां' : 'Sarees' },
                { href: '/kids', label: language === 'hi' ? 'बच्चे' : 'Kids' },
                { href: '/makeup', label: language === 'hi' ? 'ब्यूटी और मेकअप' : 'Beauty & Makeup' },
                { href: '/footwear', label: language === 'hi' ? 'फुटवियर' : 'Footwear' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[12.5px] text-[#4A4A4A] font-light tracking-wide hover:text-[#C9A962] transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Contact */}
          <div>
            <p className="text-[9.5px] tracking-[0.3em] uppercase text-[#C9A962] font-semibold mb-6">
              {language === 'hi' ? 'संपर्क' : 'Contact'}
            </p>
            <ul className="space-y-5">
              {/* Address */}
              <li className="flex items-start gap-3">
                <svg className="w-4 h-4 text-[#C9A962] mt-0.5 flex-shrink-0" style={{ width: '15px', height: '15px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span className="text-[12.5px] text-[#4A4A4A] font-light leading-snug">
                  Amas, Gaya, Bihar – 824219
                </span>
              </li>
              {/* Phone */}
              <li className="flex items-center gap-3">
                <svg className="flex-shrink-0" style={{ width: '15px', height: '15px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" stroke="#C9A962" />
                </svg>
                <a
                  href="tel:+918294153256"
                  className="text-[12.5px] text-[#4A4A4A] font-light hover:text-[#C9A962] transition-colors duration-200"
                >
                  +91 82941 53256
                </a>
              </li>
              {/* Hours */}
              <li className="flex items-start gap-3">
                <svg className="flex-shrink-0 mt-0.5" style={{ width: '15px', height: '15px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#C9A962" />
                </svg>
                <div>
                  <p className="text-[12.5px] text-[#4A4A4A] font-light leading-snug">9:00 AM – 5:30 PM IST</p>
                  <p className="text-[11px] text-[#3A3A3A] font-light mt-0.5 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                    {language === 'hi' ? 'हर दिन खुला' : 'Open Every Day'}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#181818]">
        <div className="max-w-[1300px] mx-auto px-6 sm:px-8 lg:px-14 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-[#333333] tracking-wide font-light">
              © {new Date().getFullYear()} Fashion Points.{' '}
              {language === 'hi' ? 'सर्वाधिकार सुरक्षित।' : 'All rights reserved.'}
            </p>
            <p className="text-[11px] text-[#C9A962] tracking-[0.18em] font-light">
              fashionpoints.co.in
            </p>
            {/* Back to Top */}
            <button
              onClick={scrollToTop}
              aria-label="Back to top"
              className="group flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[#333333] hover:text-[#C9A962] transition-colors duration-200 font-semibold"
            >
              {language === 'hi' ? 'ऊपर जाएं' : 'Back to Top'}
              <span className="flex items-center justify-center w-6 h-6 border border-[#252525] group-hover:border-[#C9A962] transition-colors duration-200">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>

    </footer>
  );
}
