'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function WhyChooseUs() {
  const { t, language } = useLanguage();

  const features = [
    {
      title: t('why.quality'),
      titleHi: 'प्रीमियम गुणवत्ता',
      description: t('why.qualityDesc'),
      descriptionHi: 'हम केवल उच्च गुणवत्ता वाले कपड़े और सामग्री का चयन करते हैं',
      bgImage: 'https://images.unsplash.com/photo-1558769132-cb1aea1c04a1?w=1600&h=1200&q=90&auto=format&fit=crop',
      gradient: 'from-blue-400/80 via-indigo-300/70 to-purple-400/80',
    },
    {
      title: t('why.price'),
      titleHi: 'सस्ती कीमतें',
      description: t('why.priceDesc'),
      descriptionHi: 'प्रीमियम फैशन सभी के लिए सुलभ बनाना',
      bgImage: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&h=1200&q=90&auto=format&fit=crop',
      gradient: 'from-emerald-400/80 via-teal-300/70 to-cyan-400/80',
    },
    {
      title: t('why.variety'),
      titleHi: 'विशाल विविधता',
      description: t('why.varietyDesc'),
      descriptionHi: 'पुरुषों, महिलाओं, बच्चों और साड़ियों के लिए व्यापक संग्रह',
      bgImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&h=1200&q=90&auto=format&fit=crop',
      gradient: 'from-pink-400/80 via-rose-300/70 to-red-400/80',
    },
    {
      title: t('why.trust'),
      titleHi: 'विश्वसनीय सेवा',
      description: t('why.trustDesc'),
      descriptionHi: 'बिहार में 10+ वर्षों से आपके फैशन पार्टनर',
      bgImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&h=1200&q=90&auto=format&fit=crop',
      gradient: 'from-amber-400/80 via-orange-300/70 to-yellow-400/80',
    },
  ];

  return (
    <section className="relative py-24 bg-gradient-to-b from-white via-[#FAF7F2] to-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #722F37 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-6 border border-[#E8E2D9]">
            <div className="w-2 h-2 rounded-full bg-[#722F37] animate-pulse"></div>
            <span className="text-sm font-medium text-[#722F37] tracking-wide">
              {language === 'hi' ? 'हमारे बारे में' : 'WHY CHOOSE US'}
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-[#2D2D2D] mb-4 tracking-tight" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
            {t('why.title')}
          </h2>

          <p className="text-lg text-[#6B6B6B] max-w-2xl mx-auto">
            {language === 'hi'
              ? 'हम गुणवत्ता, मूल्य और शैली को एक साथ लाते हैं'
              : 'Bringing quality, value, and style together'}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative h-80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${feature.bgImage})` }}
              ></div>

              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} transition-opacity duration-300`}></div>

              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white">
                {/* Icon Circle */}
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  <div className="text-2xl">
                    {index === 0 && '✨'}
                    {index === 1 && '💰'}
                    {index === 2 && '🎁'}
                    {index === 3 && '💖'}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-bold mb-3 text-center tracking-wide" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                  {language === 'hi' ? feature.titleHi : feature.title}
                </h3>

                {/* Divider */}
                <div className="w-12 h-0.5 bg-white/60 mb-3"></div>

                {/* Description */}
                <p className="text-sm text-white/90 text-center font-light leading-relaxed">
                  {language === 'hi' ? feature.descriptionHi : feature.description}
                </p>
              </div>

              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-8 px-8 py-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#E8E2D9]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#722F37]/10 flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>5000+</p>
                <p className="text-xs text-[#6B6B6B]">{language === 'hi' ? 'खुश ग्राहक' : 'Happy Customers'}</p>
              </div>
            </div>

            <div className="h-12 w-px bg-[#E8E2D9]"></div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#722F37]/10 flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>10+</p>
                <p className="text-xs text-[#6B6B6B]">{language === 'hi' ? 'वर्ष का अनुभव' : 'Years Experience'}</p>
              </div>
            </div>

            <div className="h-12 w-px bg-[#E8E2D9]"></div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#722F37]/10 flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>100%</p>
                <p className="text-xs text-[#6B6B6B]">{language === 'hi' ? 'गुणवत्ता की गारंटी' : 'Quality Assured'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
