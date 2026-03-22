'use client';

import { Eye } from 'lucide-react';
import { useAdminLang } from './LanguageContext';
import { ORDER_STATUS_COLORS, formatINR, getDistanceBadge } from '@/lib/admin/constants';
import type { Order } from '@/types/admin';

interface OrdersTableProps {
  orders: Order[];
  compact?: boolean;
  onView?: (order: Order) => void;
}

export default function OrdersTable({ orders, compact = false, onView }: OrdersTableProps) {
  const { t } = useAdminLang();

  const displayOrders = compact ? orders.slice(0, 5) : orders;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('orders.orderId')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('orders.customer')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('orders.amount')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('orders.status')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('orders.distance')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('orders.date')}</th>
              {!compact && (
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('orders.action')}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {displayOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                  {t('orders.noOrders')}
                </td>
              </tr>
            ) : (
              displayOrders.map((order) => {
                const badge = order.distance_km !== undefined ? getDistanceBadge(order.distance_km) : null;
                const statusColor = ORDER_STATUS_COLORS[order.status] || '#6b7280';
                return (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{order.order_id}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-800">{order.customer_name}</div>
                      <div className="text-xs text-gray-400">{order.pincode}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{formatINR(order.total)}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: statusColor + '18', color: statusColor }}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {badge ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: badge.bg, color: badge.color }}
                        >
                          {order.distance_km} km · {badge.label}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    {!compact && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onView?.(order)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#722F37] transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
