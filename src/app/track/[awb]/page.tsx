'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface TrackingEvent {
  id: string;
  status: string;
  location: string | null;
  description: string | null;
  created_at: string;
}

interface StepTimestamps {
  label_generated:  string | null;
  pickup_scheduled: string | null;
  in_transit:       string | null;
  out_for_delivery: string | null;
  delivered:        string | null;
}

interface ShipmentInfo {
  awb_number:         string;
  courier_name:       string | null;
  status:             string;
  estimated_delivery: string | null;
  picked_up_at:       string | null;
  shipped_at:         string | null;
  delivered_at:       string | null;
  is_rto:             boolean;
  label_url:          string | null;
  tracking:           TrackingEvent[];
  stepTimestamps:     StepTimestamps | null;
  order: {
    id:     string;
    status: string;
  } | null;
}

const STATUS_STEPS: { key: keyof StepTimestamps; label: string }[] = [
  { key: 'label_generated',  label: 'Order Placed' },
  { key: 'pickup_scheduled', label: 'Pickup Scheduled' },
  { key: 'in_transit',       label: 'In Transit' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered',        label: 'Delivered' },
];

const STATUS_ORDER: Record<string, number> = {
  label_generated:  0,
  pickup_scheduled: 1,
  picked_up:        1,
  in_transit:       2,
  out_for_delivery: 3,
  delivered:        4,
  cancelled:        -1,
  returned:         -1,
  delivery_failed:  -1,
};

function fmtDate(iso: string | null, compact = false) {
  if (!iso) return null;
  const d = new Date(iso);
  if (compact) {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
      ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function TrackingPage() {
  const params  = useParams();
  const awb     = Array.isArray(params?.awb) ? params.awb[0] : params?.awb ?? '';

  const [shipment, setShipment] = useState<ShipmentInfo | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!awb) return;
    fetch(`/api/tracking/${awb}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.shipment) setShipment(data.shipment);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [awb]);

  const currentStep = shipment ? (STATUS_ORDER[shipment.status] ?? 0) : 0;
  const isDelivered = shipment?.status === 'delivered';
  const isCancelled = shipment?.status === 'cancelled';
  const isRTO       = shipment?.is_rto;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #5B1A3A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#5B1A3A', fontFamily: 'Lato, sans-serif', fontSize: 16 }}>Fetching tracking details…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Not found ──────────────────────────────────────────────────────────────
  if (notFound || !shipment) return (
    <div style={{ minHeight: '100vh', background: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#5B1A3A', fontSize: 24, marginBottom: 8 }}>Shipment Not Found</h2>
        <p style={{ color: '#666', fontFamily: 'Lato, sans-serif', marginBottom: 24 }}>
          We couldn&apos;t find a shipment with AWB <strong>{awb}</strong>. Please check the number and try again.
        </p>
        <Link href="/" style={{ background: '#5B1A3A', color: '#fff', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontFamily: 'Lato, sans-serif', fontWeight: 600 }}>
          Go Home
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F5', fontFamily: 'Lato, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#5B1A3A', padding: '20px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <Link href="/" style={{ color: '#C49A3C', textDecoration: 'none', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
            ← Back to Home
          </Link>
          <h1 style={{ fontFamily: 'Playfair Display, serif', color: '#FAF8F5', fontSize: 26, margin: 0 }}>Track Your Order</h1>
          <p style={{ color: '#C49A3C', margin: '4px 0 0', fontSize: 14 }}>AWB: {shipment.awb_number}</p>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>

        {/* ── Status Card ─────────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e0d5', padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(91,26,58,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{
                  padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                  background: isDelivered ? '#e6f4ea' : isCancelled || isRTO ? '#fdecea' : '#fff3e0',
                  color:      isDelivered ? '#2e7d32' : isCancelled || isRTO ? '#c62828' : '#e65100',
                }}>
                  {isRTO ? 'Return to Origin' : shipment.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
                {shipment.courier_name && (
                  <span style={{ color: '#888', fontSize: 13 }}>via {shipment.courier_name}</span>
                )}
              </div>
              {shipment.estimated_delivery && !isDelivered && !isCancelled && (
                <p style={{ color: '#555', fontSize: 14, margin: '6px 0 0' }}>
                  Expected delivery: <strong style={{ color: '#5B1A3A' }}>{fmtDate(shipment.estimated_delivery)}</strong>
                </p>
              )}
              {isDelivered && shipment.delivered_at && (
                <p style={{ color: '#2e7d32', fontSize: 14, margin: '6px 0 0', fontWeight: 600 }}>
                  ✓ Delivered on {fmtDate(shipment.delivered_at)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Shipment Progress with timestamps ───────────────────────────── */}
        {!isCancelled && !isRTO && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e0d5', padding: '24px 20px', marginBottom: 20, boxShadow: '0 2px 8px rgba(91,26,58,0.06)' }}>
            <h3 style={{ margin: '0 0 24px', color: '#5B1A3A', fontFamily: 'Playfair Display, serif', fontSize: 18 }}>Shipment Progress</h3>

            {/* Mobile: vertical layout */}
            <div className="block md:hidden">
              {STATUS_STEPS.map((step, idx) => {
                const done   = idx <= currentStep;
                const active = idx === currentStep;
                const ts     = shipment.stepTimestamps?.[step.key] ?? null;
                return (
                  <div key={step.key} style={{ display: 'flex', gap: 16, marginBottom: idx < STATUS_STEPS.length - 1 ? 0 : 0 }}>
                    {/* Left: circle + connector */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 36, flexShrink: 0 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: done ? '#5B1A3A' : '#f0ece8',
                        border: active ? '3px solid #C49A3C' : done ? '3px solid #5B1A3A' : '3px solid #e8e0d5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, flexShrink: 0,
                      }}>
                        {done ? <span style={{ color: '#fff' }}>✓</span> : <span style={{ opacity: 0.3, fontSize: 10 }}>●</span>}
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div style={{ width: 2, flex: 1, minHeight: 24, background: idx < currentStep ? '#5B1A3A' : '#e8e0d5', margin: '3px 0' }} />
                      )}
                    </div>
                    {/* Right: label + timestamp */}
                    <div style={{ paddingBottom: idx < STATUS_STEPS.length - 1 ? 20 : 0, paddingTop: 4 }}>
                      <p style={{
                        margin: 0, fontSize: 14, fontWeight: active ? 700 : done ? 600 : 400,
                        color: done ? '#5B1A3A' : '#aaa',
                      }}>{step.label}</p>
                      {done && ts && (
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>
                          {fmtDate(ts, true)}
                        </p>
                      )}
                      {active && !ts && (
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#C49A3C' }}>In progress</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: horizontal layout */}
            <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto' }} className="hidden md:flex">
              {STATUS_STEPS.map((step, idx) => {
                const done   = idx <= currentStep;
                const active = idx === currentStep;
                const ts     = shipment.stepTimestamps?.[step.key] ?? null;
                return (
                  <div key={step.key} style={{ flex: '1 0 100px', textAlign: 'center', position: 'relative', minWidth: 90 }}>
                    {/* Connector line */}
                    {idx < STATUS_STEPS.length - 1 && (
                      <div style={{
                        position: 'absolute', top: 17, left: '50%', width: '100%', height: 3,
                        background: idx < currentStep ? '#5B1A3A' : '#e8e0d5', zIndex: 0,
                      }} />
                    )}
                    {/* Circle */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: done ? '#5B1A3A' : '#f0ece8',
                      border: active ? '3px solid #C49A3C' : done ? '3px solid #5B1A3A' : '3px solid #e8e0d5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto', position: 'relative', zIndex: 1, fontSize: 15,
                    }}>
                      {done ? <span style={{ color: '#fff' }}>✓</span> : <span style={{ opacity: 0.3, fontSize: 10 }}>●</span>}
                    </div>
                    {/* Label */}
                    <p style={{
                      fontSize: 11, marginTop: 6, lineHeight: 1.3,
                      color: done ? '#5B1A3A' : '#aaa',
                      fontWeight: active ? 700 : done ? 600 : 400,
                    }}>{step.label}</p>
                    {/* Timestamp */}
                    {done && ts && (
                      <p style={{ fontSize: 10, margin: '2px 0 0', color: '#888', lineHeight: 1.3 }}>
                        {fmtDate(ts, true)}
                      </p>
                    )}
                    {active && !ts && (
                      <p style={{ fontSize: 10, margin: '2px 0 0', color: '#C49A3C' }}>In progress</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RTO / Cancelled Banner ───────────────────────────────────────── */}
        {(isCancelled || isRTO) && (
          <div style={{ background: '#fdecea', border: '1px solid #f5c6cb', borderRadius: 12, padding: 20, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#c62828', fontSize: 15 }}>
                {isRTO ? 'Shipment is being returned to sender' : 'Shipment Cancelled'}
              </p>
              <p style={{ margin: '4px 0 0', color: '#555', fontSize: 13 }}>
                {isRTO
                  ? 'The package could not be delivered and is on its way back. Refund will be processed automatically.'
                  : 'This shipment has been cancelled. If you have any questions, please contact support.'}
              </p>
            </div>
          </div>
        )}

        {/* ── Tracking History ─────────────────────────────────────────────── */}
        {shipment.tracking && shipment.tracking.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e0d5', padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(91,26,58,0.06)' }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 4px', color: '#5B1A3A', fontFamily: 'Playfair Display, serif', fontSize: 18 }}>Tracking History</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#999' }}>
                Detailed courier scan events — updated automatically as your package moves.
              </p>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 17, top: 0, bottom: 0, width: 2, background: '#e8e0d5' }} />
              {[...shipment.tracking]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((event, idx, arr) => (
                  <div key={event.id} style={{ display: 'flex', gap: 16, marginBottom: idx < arr.length - 1 ? 24 : 0, position: 'relative' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: idx === 0 ? '#5B1A3A' : '#f0ece8',
                      border: idx === 0 ? '2px solid #C49A3C' : '2px solid #ddd',
                      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
                    }}>
                      <span style={{ fontSize: idx === 0 ? 15 : 10, color: idx === 0 ? '#fff' : '#999' }}>
                        {idx === 0 ? '📍' : '●'}
                      </span>
                    </div>
                    <div style={{ paddingTop: 4 }}>
                      <p style={{ margin: 0, fontWeight: 600, color: idx === 0 ? '#5B1A3A' : '#333', fontSize: 14 }}>
                        {event.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </p>
                      {event.description && (
                        <p style={{ margin: '2px 0 0', color: '#555', fontSize: 13 }}>{event.description}</p>
                      )}
                      <div style={{ display: 'flex', gap: 12, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                        {event.location && (
                          <span style={{ color: '#666', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}>
                            📍 {event.location}
                          </span>
                        )}
                        <span style={{ color: '#aaa', fontSize: 12 }}>🕐 {fmtDate(event.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e0d5', padding: 20, display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(91,26,58,0.06)' }}>
          <span style={{ color: '#5B1A3A', fontWeight: 700, fontFamily: 'Playfair Display, serif', fontSize: 16 }}>Insta Fashion Points</span>
          <span style={{ color: '#aaa' }}>•</span>
          <span style={{ color: '#666', fontSize: 13 }}>
            Need help?{' '}
            <a href="mailto:support@instafashionpoints.com" style={{ color: '#5B1A3A', fontWeight: 600 }}>Contact Support</a>
          </span>
        </div>
      </div>
    </div>
  );
}
