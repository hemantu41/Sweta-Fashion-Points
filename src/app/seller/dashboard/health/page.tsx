'use client';

// Health score data — in production, fetch from /api/sellers/[id]/analytics
const METRICS = [
  { key: 'fulfillment', label: 'Order Fulfillment Rate', value: 87, target: 90, unit: '%', desc: 'Orders delivered successfully', good: (v: number) => v >= 90, invert: false },
  { key: 'dispatch', label: 'On-time Dispatch Rate', value: 82, target: 85, unit: '%', desc: 'Orders dispatched within SLA', good: (v: number) => v >= 85, invert: false },
  { key: 'return', label: 'Return Rate', value: 4.2, target: 5, unit: '%', desc: 'Orders returned by customers', good: (v: number) => v <= 5, invert: true },
  { key: 'cancel', label: 'Cancellation Rate', value: 1.8, target: 3, unit: '%', desc: 'Orders cancelled before dispatch', good: (v: number) => v <= 3, invert: true },
  { key: 'rating', label: 'Avg Customer Rating', value: 4.3, target: 4.5, unit: '/5', desc: 'Based on customer reviews', good: (v: number) => v >= 4.5, max: 5, invert: false },
  { key: 'listing', label: 'Listing Quality Score', value: 68, target: 80, unit: '%', desc: 'Products with 4+ images & description', good: (v: number) => v >= 80, invert: false },
];

const HEALTH_SCORE = 72;
const TIER = HEALTH_SCORE >= 86 ? 'Gold' : HEALTH_SCORE >= 61 ? 'Silver' : 'Bronze';
const TIER_COLOR = HEALTH_SCORE >= 86 ? '#C49A3C' : HEALTH_SCORE >= 61 ? '#6B7280' : '#7A2350';
const NEXT_TIER = HEALTH_SCORE < 61 ? 'Silver' : HEALTH_SCORE < 86 ? 'Gold' : null;
const POINTS_TO_NEXT = HEALTH_SCORE < 61 ? 61 - HEALTH_SCORE : HEALTH_SCORE < 86 ? 86 - HEALTH_SCORE : 0;
const WORST_METRIC = METRICS.filter(m => !m.good(m.value)).sort((a, b) => (a.value / a.target) - (b.value / b.target))[0];

export default function HealthPage() {
  return (
    <div className="space-y-5" style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>

      {/* Score header */}
      <div className="bg-white rounded-xl border border-[#E8E0E4] shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Big score */}
          <div className="text-center flex-shrink-0">
            <div className="w-28 h-28 rounded-full border-4 flex items-center justify-center mx-auto" style={{ borderColor: TIER_COLOR }}>
              <div className="text-center">
                <p className="text-4xl font-bold leading-none" style={{ color: TIER_COLOR, fontFamily: 'var(--font-playfair)' }}>{HEALTH_SCORE}</p>
                <p className="text-xs text-gray-400 mt-0.5">/ 100</p>
              </div>
            </div>
            <span className="inline-block mt-2 text-sm font-bold px-3 py-1 rounded-full" style={{ background: `${TIER_COLOR}15`, color: TIER_COLOR }}>
              {TIER} Tier
            </span>
          </div>

          {/* Tier progress */}
          <div className="flex-1 w-full">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Seller Health Score</h2>
            <p className="text-sm text-gray-500 mb-4">Your score determines your tier and affects your product visibility in search results.</p>

            <div className="relative h-4 rounded-full bg-gray-100 overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                style={{ width: `${HEALTH_SCORE}%`, background: `linear-gradient(90deg, #3D0E2A 0%, #5B1A3A 40%, #C49A3C 100%)` }} />
              {[61, 86].map(t => (
                <div key={t} className="absolute top-0 bottom-0 w-0.5 bg-white" style={{ left: `${t}%` }} />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1.5">
              <span>Bronze<br /><span className="text-[10px]">0–60</span></span>
              <span className="text-center">Silver<br /><span className="text-[10px]">61–85</span></span>
              <span className="text-right">Gold<br /><span className="text-[10px]">86–100</span></span>
            </div>

            {/* Tier benefits */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { tier: 'Bronze', color: '#7A2350', perks: ['Basic listing', 'Standard support', 'Weekly payout'] },
                { tier: 'Silver', color: '#6B7280', perks: ['Boosted search rank', 'Priority support', 'Faster payout'] },
                { tier: 'Gold', color: '#C49A3C', perks: ['Top search position', 'Dedicated manager', 'Daily payout'] },
              ].map(t => (
                <div key={t.tier} className={`rounded-xl p-3 border ${TIER === t.tier ? 'border-2' : 'border border-[#E8E0E4] opacity-60'}`}
                  style={TIER === t.tier ? { borderColor: t.color, background: `${t.color}08` } : {}}>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: t.color }}>{t.tier}</p>
                  <ul className="space-y-1">
                    {t.perks.map(p => <li key={p} className="text-[10px] text-gray-500 flex items-center gap-1"><span className="text-[8px]">•</span>{p}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {METRICS.map(m => {
          const isGood = m.good(m.value);
          const color = isGood ? '#2E7D32' : '#C62828';
          const bg = isGood ? '#EBF7EF' : '#FDF3F3';
          const borderColor = isGood ? '#BBF7D0' : '#FECACA';
          const barPct = m.max
            ? (m.value / m.max) * 100
            : m.invert
            ? Math.max(0, 100 - (m.value / m.target) * 50)
            : Math.min((m.value / (m.target * 1.2)) * 100, 100);

          return (
            <div key={m.key} className="rounded-xl p-5 border" style={{ background: bg, borderColor }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{m.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{m.desc}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: `${color}15`, color }}>
                  {isGood ? ' On Track' : '↑ Improve'}
                </span>
              </div>
              <p className="text-3xl font-bold mb-3" style={{ color, fontFamily: 'var(--font-playfair)' }}>{m.value}{m.unit}</p>
              <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, background: color }} />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px]" style={{ color }}>
                <span>Current</span>
                <span>Target: {m.target}{m.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actionable tip */}
      {NEXT_TIER && WORST_METRIC && (
        <div className="flex items-start gap-4 p-5 rounded-xl border border-amber-200 bg-amber-50">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xl"></span>
          </div>
          <div>
            <p className="font-semibold text-amber-900 text-sm">
              You need {POINTS_TO_NEXT} more points to reach {NEXT_TIER} Tier
            </p>
            <p className="text-sm text-amber-800 mt-1">
              Your biggest opportunity: improve your <strong>{WORST_METRIC.label}</strong> from{' '}
              {WORST_METRIC.value}{WORST_METRIC.unit} to {WORST_METRIC.target}{WORST_METRIC.unit}.
              {WORST_METRIC.key === 'dispatch' && ' Pack and dispatch orders within 24 hours of placement.'}
              {WORST_METRIC.key === 'listing' && ' Add at least 4 product images and a detailed description to each listing.'}
              {WORST_METRIC.key === 'rating' && ' Respond to customer queries quickly and ensure product quality matches listing.'}
              {WORST_METRIC.key === 'return' && ' Ensure products match the listing description to reduce returns.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
