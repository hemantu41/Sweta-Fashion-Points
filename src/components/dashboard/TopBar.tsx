'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, MessageCircle, Globe, User } from 'lucide-react';
import { useAdminLang } from './LanguageContext';

interface TopBarProps {
  sidebarWidth: number;
}

export default function TopBar({ sidebarWidth }: TopBarProps) {
  const { lang, setLang, t } = useAdminLang();
  const [weather, setWeather] = useState<{ temp: number; desc: string } | null>(null);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=24.7955&longitude=84.9994&current_weather=true')
      .then(r => r.json())
      .then(d => {
        if (d.current_weather) {
          setWeather({ temp: Math.round(d.current_weather.temperature), desc: '' });
        }
      })
      .catch(() => {});
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    const prefix = t('topbar.greeting');
    if (h < 12) return `${prefix} ${t('topbar.morning')}`;
    if (h < 17) return `${prefix} ${t('topbar.afternoon')}`;
    return `${prefix} ${t('topbar.evening')}`;
  };

  return (
    <header
      className="fixed top-0 right-0 h-16 bg-white border-b border-[#E8E0E4] z-30 flex items-center justify-between px-4 md:px-6 transition-all"
      style={{ left: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : sidebarWidth }}
    >
      {/* Left: Greeting + Search */}
      <div className="flex items-center gap-3">
        {/* Mobile logo */}
        <div className="md:hidden w-8 h-8 rounded-lg bg-gradient-to-br from-[#5B1A3A] to-[#7A2350] flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xs">SF</span>
        </div>
        <span className="text-sm font-medium text-gray-700 hidden lg:block">
          {getGreeting()} 
        </span>
        <div className="relative hidden sm:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('topbar.search')}
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-40 md:w-56 lg:w-64
              focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/20 focus:border-[#C49A3C]/40"
          />
        </div>
      </div>

      {/* Right: Weather, WA, Notif, Lang, Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Weather pill */}
        {weather && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full text-xs font-medium text-blue-700">
             {weather.temp}°C Gaya
          </div>
        )}

        {/* WhatsApp toggle */}
        <button
          className="relative p-2 rounded-lg hover:bg-[#F5F0F3] text-[#5B1A3A] transition-colors"
          title={t('topbar.whatsapp')}
        >
          <MessageCircle size={20} />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#C49A3C] rounded-full border-2 border-white" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2 rounded-lg hover:bg-[#F5F0F3] text-[#5B1A3A] transition-colors"
            title={t('topbar.notifications')}
          >
            <Bell size={20} />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#C49A3C] rounded-full border-2 border-white" />
          </button>
          {showNotif && (
            <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50">
              <p className="text-sm font-semibold text-gray-800 mb-2">{t('topbar.notifications')}</p>
              <div className="space-y-2">
                <div className="p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                  New order #IFP-1042 from Bodhgaya
                </div>
                <div className="p-2 bg-yellow-50 rounded-lg text-xs text-yellow-700">
                  3 products pending QC review
                </div>
                <div className="p-2 bg-[#F5F0F3] rounded-lg text-xs text-[#5B1A3A]">
                  Payment of ₹2,450 settled
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F5F0F3] rounded-lg text-xs font-medium text-[#5B1A3A] hover:bg-[#E8E0E4] transition-colors"
        >
          <Globe size={14} />
          <span className="hidden sm:inline">{lang === 'en' ? 'EN' : 'हिं'}</span>
          <span className="text-gray-400">|</span>
          <span className="hidden sm:inline">{t('topbar.language')}</span>
        </button>

        {/* Profile avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5B1A3A] to-[#7A2350] flex items-center justify-center">
          <User size={16} className="text-white" />
        </div>
      </div>
    </header>
  );
}
