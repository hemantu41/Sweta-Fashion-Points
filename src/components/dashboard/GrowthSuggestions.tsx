'use client';

import { Lightbulb, AlertTriangle, Rocket } from 'lucide-react';
import { useAdminLang } from './LanguageContext';
import { GROWTH_SUGGESTIONS } from '@/lib/admin/constants';

const TYPE_CONFIG = {
  tip: { icon: Lightbulb, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  alert: { icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  boost: { icon: Rocket, color: '#5B1A3A', bg: '#fdf2f8', border: '#e8c4d0' },
};

export default function GrowthSuggestions() {
  const { lang, t } = useAdminLang();

  return (
    <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">{t('growth.smartTips')}</h3>
      <div className="space-y-3">
        {GROWTH_SUGGESTIONS.slice(0, 4).map(s => {
          const config = TYPE_CONFIG[s.type];
          const Icon = config.icon;
          const title = lang === 'hi' ? s.title_hi : s.title;
          const desc = lang === 'hi' ? s.description_hi : s.description;
          const action = lang === 'hi' ? s.action_label_hi : s.action_label;

          return (
            <div
              key={s.id}
              className="flex items-start gap-3 p-3 rounded-lg border transition-all hover:shadow-sm"
              style={{ backgroundColor: config.bg, borderColor: config.border }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: config.color + '20', color: config.color }}
              >
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                {action && (
                  <button
                    className="mt-2 text-xs font-medium px-3 py-1 rounded-md transition-colors"
                    style={{ color: config.color, backgroundColor: config.color + '15' }}
                  >
                    {action} →
                  </button>
                )}
              </div>
              {s.priority === 'high' && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase flex-shrink-0">
                  HIGH
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
