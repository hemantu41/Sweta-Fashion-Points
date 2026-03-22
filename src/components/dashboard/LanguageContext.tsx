'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminT, type AdminLang } from '@/lib/admin/translations';

interface AdminLanguageContextType {
  lang: AdminLang;
  setLang: (l: AdminLang) => void;
  t: (key: string) => string;
}

const AdminLanguageContext = createContext<AdminLanguageContextType | undefined>(undefined);

export function AdminLanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AdminLang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('admin_lang') as AdminLang;
    if (saved === 'en' || saved === 'hi') setLangState(saved);
  }, []);

  const setLang = (l: AdminLang) => {
    setLangState(l);
    localStorage.setItem('admin_lang', l);
  };

  const t = (key: string) => adminT(lang, key);

  return (
    <AdminLanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </AdminLanguageContext.Provider>
  );
}

export function useAdminLang() {
  const ctx = useContext(AdminLanguageContext);
  if (!ctx) throw new Error('useAdminLang must be used within AdminLanguageProvider');
  return ctx;
}
