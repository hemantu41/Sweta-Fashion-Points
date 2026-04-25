'use client';

import { MapPin } from 'lucide-react';
import { useAdminLang } from './LanguageContext';
import { DELIVERY_ZONES, getDistanceBadge, formatNumber } from '@/lib/admin/constants';

export default function DeliveryHeatmap() {
  const { t } = useAdminLang();

  const serviceable = DELIVERY_ZONES.filter(z => z.is_serviceable);
  const notServiceable = DELIVERY_ZONES.filter(z => !z.is_serviceable);

  return (
    <div className="bg-white rounded-[14px] border border-[rgba(196,154,60,0.08)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">{t('delivery.title')}</h3>
        <span className="text-xs text-gray-400">{t('delivery.radius')}: ~100 km</span>
      </div>

      {/* Distance legend */}
      <div className="flex gap-3 mb-4">
        {[
          { label: '≤20 km', color: '#5B1A3A', bg: '#FAF7F8' },
          { label: '20-50 km', color: '#d97706', bg: '#fffbeb' },
          { label: '50-100 km', color: '#dc2626', bg: '#fef2f2' },
          { label: '>100 km', color: '#6b7280', bg: '#f3f4f6' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Pincode pills */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('delivery.serviceable')}</p>
        <div className="flex flex-wrap gap-2">
          {serviceable.map(zone => {
            const badge = getDistanceBadge(zone.distance_km);
            return (
              <div
                key={zone.pincode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover:shadow-sm"
                style={{ borderColor: badge.color + '40', backgroundColor: badge.bg }}
              >
                <MapPin size={12} style={{ color: badge.color }} />
                <span className="text-gray-700">{zone.pincode}</span>
                <span className="text-gray-400">·</span>
                <span style={{ color: badge.color }}>{zone.district}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">{zone.distance_km} km</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-600">{formatNumber(zone.total_orders)} orders</span>
              </div>
            );
          })}
        </div>

        {notServiceable.length > 0 && (
          <>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mt-3">
              {t('delivery.notServiceable')}
            </p>
            <div className="flex flex-wrap gap-2">
              {notServiceable.map(zone => (
                <div
                  key={zone.pincode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E0E4] bg-gray-50 text-xs text-gray-400"
                >
                  <MapPin size={12} />
                  {zone.pincode} · {zone.district} · {zone.distance_km} km
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
