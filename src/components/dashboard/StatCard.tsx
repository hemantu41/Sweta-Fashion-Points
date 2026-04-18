'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  active?: boolean;
}

export default function StatCard({ title, value, change, icon, color, onClick, active }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-[14px] border shadow-[0_2px_16px_rgba(91,26,58,0.04)] p-5 transition-all duration-300
        ${onClick ? 'cursor-pointer select-none' : ''}
        ${active
          ? 'border-[#5B1A3A] ring-2 ring-[#5B1A3A]/10 shadow-lg -translate-y-0.5'
          : 'border-[rgba(196,154,60,0.08)] hover:shadow-lg hover:-translate-y-0.5'
        }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium
              ${change >= 0 ? 'text-[#C49A3C]' : 'text-red-500'}`}
            >
              {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {change >= 0 ? '+' : ''}{change}%
              <span className="text-gray-400 ml-1">vs last week</span>
            </div>
          )}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color + '15', color }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
