interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
  icon?: React.ReactNode;
  accent?: string;
}

export default function KpiCard({ title, value, subtitle, trend, icon, accent = '#5B1A3A' }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E0E4] p-5 flex flex-col gap-3 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-[#666666] uppercase tracking-wide">{title}</p>
        {icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}12`, color: accent }}>
            {icon}
          </div>
        )}
      </div>
      <div>
        <p
          className="text-2xl font-semibold text-[#333333] leading-none"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {value}
        </p>
        {subtitle && <p className="text-xs text-[#999999] mt-1">{subtitle}</p>}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
          <span>{trend.positive ? '↑' : '↓'}</span>
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
}
