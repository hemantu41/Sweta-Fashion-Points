/**
 * GET /api/cron/sla-check
 * ─────────────────────────────────────────────────────────────────────────────
 * Vercel Cron job — runs every 15 minutes (see vercel.json).
 * Can also be triggered manually or from AWS EventBridge.
 *
 * Security: CRON_SECRET header required (set in Vercel env vars).
 * Vercel automatically sends Authorization: Bearer <CRON_SECRET> for cron jobs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAllActiveSLAs } from '@/lib/sla/slaMonitor';

export const dynamic = 'force-dynamic'; // never cache cron responses
export const maxDuration = 60;          // Vercel Pro: up to 300 s; Hobby: 10 s

export async function GET(request: NextRequest) {
  // ── Auth: verify CRON_SECRET ──────────────────────────────────────────────
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization') ?? '';
    const provided = auth.startsWith('Bearer ') ? auth.slice(7) : auth;

    if (provided !== secret) {
      console.warn('[cron/sla-check] Unauthorized — wrong or missing CRON_SECRET');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else {
    // No secret configured — warn but allow (useful for local dev)
    console.warn('[cron/sla-check] CRON_SECRET not set — running without auth guard');
  }

  // ── Run SLA check ─────────────────────────────────────────────────────────
  const startedAt = Date.now();

  let result: Awaited<ReturnType<typeof checkAllActiveSLAs>>;
  try {
    result = await checkAllActiveSLAs();
  } catch (err: any) {
    console.error('[cron/sla-check] checkAllActiveSLAs threw:', err?.message);
    return NextResponse.json(
      { error: 'SLA check failed', detail: err?.message },
      { status: 500 },
    );
  }

  const durationMs = Date.now() - startedAt;

  console.log(
    `[cron/sla-check] done in ${durationMs}ms —`,
    `checked=${result.checked} warned=${result.warned} breached=${result.breached}`,
  );

  return NextResponse.json({
    ok:        true,
    checked:   result.checked,
    warned:    result.warned,
    breached:  result.breached,
    durationMs,
    timestamp: new Date().toISOString(),
  });
}
