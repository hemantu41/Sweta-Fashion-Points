'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { useAdminLang } from '@/components/dashboard/LanguageContext';

interface HealthMetric {
  value: number;
  target: number;
  unit: string;
}

interface HealthWarning {
  metric: string;
  message_en: string;
  message_hi: string;
}

interface HealthData {
  overallScore: number;
  metrics: {
    cancellationRate: HealthMetric;
    returnRate: HealthMetric;
    lateDispatchRate: HealthMetric;
    defectRate: HealthMetric;
  };
  warnings: HealthWarning[];
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function getMetricStatus(value: number, target: number, lowerIsBetter = true): 'good' | 'breach' {
  return lowerIsBetter ? (value <= target ? 'good' : 'breach') : (value >= target ? 'good' : 'breach');
}

export default function AccountHealthWidget() {
  const { t, lang } = useAdminLang();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/seller/health')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setHealth(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
        <div className="h-5 w-40 bg-gray-200 rounded mb-6" />
        <div className="flex items-center gap-8">
          <div className="w-44 h-44 bg-gray-100 rounded-full" />
          <div className="flex-1 space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!health) return null;

  const color = getScoreColor(health.overallScore);
  const chartData = [
    { name: 'score', value: health.overallScore, fill: color },
  ];

  const metricRows: { key: keyof HealthData['metrics']; labelKey: string; targetLabel: string }[] = [
    { key: 'cancellationRate', labelKey: 'health.cancellation', targetLabel: '<2%' },
    { key: 'returnRate',       labelKey: 'health.return',       targetLabel: '<8%' },
    { key: 'lateDispatchRate', labelKey: 'health.lateDispatch', targetLabel: '<5%' },
    { key: 'defectRate',       labelKey: 'health.defect',       targetLabel: '<1%' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-800 mb-5">{t('health.title')}</h3>

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Radial gauge */}
        <div className="relative w-44 h-44 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%" cy="50%"
              innerRadius="70%" outerRadius="90%"
              startAngle={210} endAngle={-30}
              barSize={14}
              data={chartData}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={8}
                background={{ fill: '#f3f4f6' }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          {/* Center score */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color }}>
              {health.overallScore}
            </span>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
              {t('health.score')}
            </span>
          </div>
        </div>

        {/* Metric rows */}
        <div className="flex-1 w-full space-y-3">
          {metricRows.map(({ key, labelKey, targetLabel }) => {
            const metric = health.metrics[key];
            const status = getMetricStatus(metric.value, metric.target);
            return (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2.5">
                  {status === 'good' ? (
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-red-500 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t(labelKey)}</p>
                    <p className="text-[10px] text-gray-400">{t('health.target')}: {targetLabel}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${status === 'good' ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.value}{metric.unit}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Warning alerts */}
      {health.warnings.length > 0 && (
        <div className="mt-5 space-y-2">
          {health.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                {lang === 'hi' ? w.message_hi : w.message_en}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
