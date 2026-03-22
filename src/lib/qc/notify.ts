import { supabaseAdmin } from '@/lib/supabase-admin';
import { REASON_MAP } from './constants';
import type { NotifyPayload, NotifyResult, RejectionReasonId } from '@/types/qc.types';

// ─── In-App Notification ──────────────────────────────────────────────────────

async function fireInAppNotification(payload: NotifyPayload): Promise<NotifyResult> {
  const event =
    payload.type === 'approved' ? 'notify.product.approved' : 'notify.product.rejected';

  try {
    const title =
      payload.type === 'approved'
        ? `✅ "${payload.product.name}" is now live!`
        : `❌ "${payload.product.name}" needs changes`;

    const message =
      payload.type === 'approved'
        ? `Your product has been approved by admin and is now visible to customers.${
            payload.adminNote ? ` Note: ${payload.adminNote}` : ''
          }`
        : `Your product was rejected. Please review the feedback and resubmit.`;

    const { error } = await supabaseAdmin.from('spf_notifications').insert({
      seller_id: payload.product.seller_id,
      type: payload.type === 'approved' ? 'qc' : 'qc',
      title,
      message,
      product_id: payload.product.id,
      product_name: payload.product.name,
      is_read: false,
    });

    if (error) throw error;
    return { event, status: 'sent' };
  } catch (err: any) {
    console.error('[notify] in-app notification failed:', err?.message);
    return { event, status: 'failed', error: err?.message };
  }
}

// ─── Email Notification ───────────────────────────────────────────────────────

async function fireEmailNotification(payload: NotifyPayload): Promise<NotifyResult> {
  const event = 'notify.email.seller';

  if (!payload.product.seller_email) {
    console.warn('[notify] No seller email — skipping email notification');
    return { event, status: 'failed', error: 'No seller email on record' };
  }

  if (!process.env.RESEND_API_KEY) {
    console.log(
      '[notify] RESEND_API_KEY not configured — email skipped (set in .env.local to enable)'
    );
    return { event, status: 'failed', error: 'RESEND_API_KEY not set' };
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const subject =
      payload.type === 'approved'
        ? `✅ Your product "${payload.product.name}" is now live on Insta Fashion Points`
        : `Action Required: "${payload.product.name}" needs changes`;

    const html = buildEmailHtml(payload);

    const { error } = await resend.emails.send({
      from: 'Insta Fashion Points <noreply@instafashionpoints.com>',
      to: payload.product.seller_email,
      subject,
      html,
    });

    if (error) throw error;
    return { event, status: 'sent' };
  } catch (err: any) {
    console.error('[notify] email failed:', err?.message);
    return { event, status: 'failed', error: err?.message };
  }
}

// ─── Cache Invalidation ───────────────────────────────────────────────────────

async function invalidateSellerCache(sellerId: string): Promise<NotifyResult> {
  const event = 'notify.cache.invalidated';
  const keys = [
    `seller:${sellerId}:products`,
    `seller:${sellerId}:inventory`,
    `seller:${sellerId}:pricing`,
  ];

  try {
    // Use existing sellerCache helpers — invalidates products, inventory, pricing keys
    const { invalidateSellerKeys } = await import('@/lib/sellerCache').catch(() => ({
      invalidateSellerKeys: null,
    }));

    if (invalidateSellerKeys) {
      await invalidateSellerKeys(sellerId, 'products', 'inventory', 'pricing');
      return { event, status: 'sent' };
    }

    // Fallback: use redis helpers directly from @/lib/redis (Option C — named exports)
    const redisModule = await import('@/lib/redis').catch(() => null);
    if (redisModule?.redisDel) {
      // @upstash/redis wrapper: redisDel accepts ...keys spread
      await redisModule.redisDel(...keys);
      return { event, status: 'sent' };
    }

    // Fallback: Upstash HTTP REST if env vars available
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      await Promise.all(
        keys.map((key) =>
          fetch(`${process.env.UPSTASH_REDIS_REST_URL}/del/${encodeURIComponent(key)}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
          })
        )
      );
      return { event, status: 'sent' };
    }

    // Redis not configured — cache miss is acceptable
    console.log('[notify] Redis not available — cache invalidation skipped');
    return { event, status: 'failed', error: 'Redis not configured' };
  } catch (err: any) {
    // Non-fatal — a stale cache is acceptable
    console.warn('[notify] cache invalidation failed (non-fatal):', err?.message);
    return { event, status: 'failed', error: err?.message };
  }
}

// ─── Event Log ────────────────────────────────────────────────────────────────

async function logNotifyEvents(
  payload: NotifyPayload,
  results: NotifyResult[]
): Promise<void> {
  try {
    const rows = results.map((r) => ({
      event: r.event,
      product_id: payload.product.id,
      product_name: payload.product.name,
      seller_id: payload.product.seller_id,
      detail:
        payload.type === 'approved'
          ? `Approved by admin`
          : `Rejected: ${(payload.reasons ?? []).length} reason(s)`,
      status: r.status,
      error: r.error ?? null,
    }));

    await supabaseAdmin.from('spf_notify_event_log').insert(rows);
  } catch (err) {
    // Non-fatal — log table may not exist yet
    console.warn('[notify] event log insert failed (run migration):', err);
  }
}

// ─── Main dispatcher ─────────────────────────────────────────────────────────

export async function dispatchQCNotification(
  payload: NotifyPayload
): Promise<NotifyResult[]> {
  const results = await Promise.all([
    fireInAppNotification(payload),
    fireEmailNotification(payload),
    invalidateSellerCache(payload.product.seller_id),
  ]);

  // Add also clear productCache (in-memory)
  try {
    const { productCache } = await import('@/lib/cache').catch(() => ({ productCache: null }));
    productCache?.clear?.();
  } catch {
    // Non-fatal
  }

  // Log all events to DB
  await logNotifyEvents(payload, results);

  return results;
}

// ─── Email HTML Builder ───────────────────────────────────────────────────────

function buildEmailHtml(payload: NotifyPayload): string {
  const isApproved = payload.type === 'approved';
  const headerBg = isApproved ? '#2D4A22' : '#8B2020';
  const headerText = isApproved ? '✅ Product Approved!' : '❌ Product Needs Changes';
  const accentColor = isApproved ? '#2D4A22' : '#8B2020';

  const reasonsHtml =
    !isApproved && payload.reasons?.length
      ? `
        <div style="margin:24px 0">
          <p style="font-weight:600;color:#1A1714;margin-bottom:12px">
            Please fix the following (Severity: <strong style="color:${accentColor}">${
              payload.severity ?? 'minor'
            }</strong>):
          </p>
          <ul style="margin:0;padding-left:20px;line-height:1.9">
            ${(payload.reasons as RejectionReasonId[])
              .map((id) => {
                const r = REASON_MAP[id];
                return r
                  ? `<li style="margin-bottom:6px">
                      <strong>${r.title}</strong>: ${r.fixInstruction}
                    </li>`
                  : '';
              })
              .join('')}
          </ul>
        </div>`
      : '';

  const noteHtml =
    payload.adminNote || payload.note
      ? `<div style="background:#F3F0EB;border-left:3px solid ${accentColor};padding:12px 16px;border-radius:4px;margin-top:16px">
           <strong>Admin Note:</strong> ${payload.adminNote ?? payload.note}
         </div>`
      : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');</style>
</head>
<body style="margin:0;padding:0;background:#FAF8F5;font-family:'DM Sans',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
          <!-- Header -->
          <tr>
            <td style="background:${headerBg};padding:28px 32px;color:#fff">
              <p style="margin:0 0 4px;font-size:12px;opacity:.8;letter-spacing:.08em;text-transform:uppercase">Insta Fashion Points</p>
              <h1 style="margin:0;font-size:22px;font-weight:700">${headerText}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px 32px">
              <p style="color:#4A3F35;margin:0 0 8px">Hello, <strong>${payload.product.seller_name}</strong></p>
              <p style="color:#1A1714;font-size:16px;font-weight:600;margin:0 0 4px">${payload.product.name}</p>
              <p style="color:#6B6560;font-size:13px;margin:0 0 20px">${payload.product.category}${
                payload.product.sub_category ? ' · ' + payload.product.sub_category : ''
              } · ₹${payload.product.price.toLocaleString('en-IN')}</p>

              ${
                isApproved
                  ? `<p style="color:#2D4A22;background:#EEF4EB;padding:14px 18px;border-radius:8px;margin:0">
                       🎉 Your product is now <strong>live and visible to customers</strong> on Insta Fashion Points.
                     </p>`
                  : `<p style="color:#8B2020;background:#FDF0F0;padding:14px 18px;border-radius:8px;margin:0">
                       Your product requires changes before it can go live. Please review and fix the issues below.
                     </p>`
              }

              ${reasonsHtml}
              ${noteHtml}

              ${
                !isApproved
                  ? `<div style="margin-top:24px;padding:16px;background:#FAF8F5;border-radius:8px;text-align:center">
                       <p style="margin:0;color:#6B6560;font-size:13px">Log in to your seller dashboard to fix and resubmit this product.</p>
                     </div>`
                  : ''
              }
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F3F0EB;padding:16px 32px;text-align:center">
              <p style="margin:0;color:#9E9892;font-size:12px">
                © ${new Date().getFullYear()} Insta Fashion Points · This is an automated message, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
