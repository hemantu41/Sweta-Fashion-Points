import { NextResponse } from 'next/server';

// GET /api/seller/health
// Returns mock account health metrics for the admin dashboard widget.

export async function GET() {
  const health = {
    overallScore: 72,
    metrics: {
      cancellationRate: { value: 3.2, target: 2, unit: '%' },
      returnRate:       { value: 5.8, target: 8, unit: '%' },
      lateDispatchRate: { value: 6.1, target: 5, unit: '%' },
      defectRate:       { value: 0.4, target: 1, unit: '%' },
    },
    warnings: [
      {
        metric: 'cancellationRate',
        message_en: 'Your cancellation rate is high. Fix before 2026-04-05 to avoid penalty.',
        message_hi: 'आपकी रद्दीकरण दर अधिक है। जुर्माने से बचने के लिए 2026-04-05 से पहले ठीक करें।',
      },
      {
        metric: 'lateDispatchRate',
        message_en: 'Your late dispatch rate exceeds target. Fix before 2026-04-05 to avoid penalty.',
        message_hi: 'आपकी देर से डिस्पैच दर लक्ष्य से अधिक है। जुर्माने से बचने के लिए 2026-04-05 से पहले ठीक करें।',
      },
    ],
  };

  return NextResponse.json(health);
}
