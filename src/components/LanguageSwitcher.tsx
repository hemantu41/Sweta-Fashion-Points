'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center bg-[#F5F0E8] rounded-full p-1 border border-[#E8E2D9]">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
          language === 'en'
            ? 'bg-white text-[#722F37] shadow-sm'
            : 'text-[#6B6B6B] hover:text-[#722F37]'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('hi')}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
          language === 'hi'
            ? 'bg-white text-[#722F37] shadow-sm'
            : 'text-[#6B6B6B] hover:text-[#722F37]'
        }`}
      >
        हिं
      </button>
    </div>
  );
}
