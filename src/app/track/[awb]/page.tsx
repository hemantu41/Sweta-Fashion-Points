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

interface ShipmentInfo {
  awb_number: string;
  courier_name: string | null;
  status: string;
  estimated_delivery: string | null;
  picked_up_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  is_rto: boolean;
  label_url: string | null;
  tracking: TrackingEvent[];
  order: {
    id: string;
    status: string;
  } | null;
}

const STATUS_STEPS = [
  { key: 'label_generated', label: 'Order Placed', icon: '' },
  { key: 'pickup_scheduled', label: 'Pickup Scheduled', icon: '' },
  { key: 'picked_up', label: 'Picked Up', icon: '' },
  { key: 'in_transit', label: 'In Transit', icon: '' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '' },
  { key: 'delivered', label: 'Delivered', icon: '' },
];

const STATUS_ORDER: Record<string, number> = {
  label_generated: 0,
  pickup_scheduled: 1,
  picked_up: 2,
  in_transit: 3,
  out_for_delivery: 4,
  delivered: 5,
  cancelled: -1,
  returned: -1,
  delivery_failed: -1,
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TrackingPage() {
  const params = useParams();
  const awb = Array.isArray(params?.awb) ? params.awb[0] : params?.awb ?? '';

  const [shipment, setShipment] = useState<ShipmentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!awb) return;
    fetch(`/api/tracking/${awb}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.shipment) {
          setShipment(data.shipment);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [awb]);

  const currentStep = shipment ? (STATUS_ORDER[shipment.status] ?? 0) : 0;
  const isTerminal = shipment?.status === 'delivered';
  const isCancelled = shipment?.status === 'cancelled';
  const isRTO = shipment?.is_rto;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid #5B1A3A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#5B1A3A', fontFamily: 'Lato, sans-serif', fontSize: 16 }}>Fetching tracking details…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound || !shipment) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}></div>
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
  }

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

        {/* Status Card */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e0d5', padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(91,26,58,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                  background: isTerminal ? '#e6f4ea' : isCancelled || isRTO ? '#fdecea' : '#fff3e0',
                  color: isTerminal ? '#2e7d32' : isCancelled || isRTO ? '#c62828' : '#e65100',
                }}>
                  {isRTO ? 'Return to Origin' : shipment.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
                {shipment.courier_name && (
                  <span style={{ color: '#888', fontSize: 13 }}>via {shipment.courier_name}</span>
                )}
              </div>
              {shipment.estimated_delivery && !isTerminal && !isCancelled && (
                <p style={{ color: '#555', fontSize: 14, margin: '6px 0 0' }}>
                  Expected delivery: <strong style={{ color: '#5B1A3A' }}>{formatDate(shipment.estimated_delivery)}</strong>
                </p>
              )}
              {isTerminal && shipment.delivered_at && (
                <p style={{ color: '#2e7d32', fontSize: 14, margin: '6px 0 0', fontWeight: 600 }}>
                  Delivered on {formatDate(shipment.delivered_at)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        {!isCancelled && !isRTO && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e0d5', padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(91,26,58,0.06)' }}>
            <h3 style={{ margin: '0 0 20px', color: '#5B1A3A', fontFamily: 'Playfair Display, serif', fontSize: 18 }}>Shipment Progress</h3>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, overflowX: 'auto' }}>
              {STATUS_STEPS.map((step, idx) => {
                const done = idx <= currentStep;
                const active = idx === currentStep;
                return (
                  <div key={step.key} style={{ flex: '1 0 80px', textAlign: 'center', position: 'relative', minWidth: 70 }}>
                    {/* Connector line */}
                    {idx < STATUS_STEPS.length - 1 && (
                      <div style={{
                        position: 'absolute',
                        top: 18,
                        left: '50%',
                        width: '100%',
                        height: 3,
                        background: idx < currentStep ? '#5B1A3A' : '#e8e0d5',
                        zIndex: 0,
                      }} />
                    )}
                    {/* Circle */}
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: done ? '#5B1A3A' : '#f0ece8',
                      border: active ? '3px solid #C49A3C' : done ? '3px solid #5B1A3A' : '3px solid #e8e0d5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      position: 'relative',
                      zIndex: 1,
                      fontSize: 16,
                      transition: 'all 0.3s',
                    }}>
                      {done ? <span style={{ color: '#fff' }}></span> : <span style={{ opacity: 0.4 }}>{step.icon}</span>}
                    </div>
                    <p style={{
                      fontSize: 11,
                      marginTop: 6,
                      color: done ? '#5B1A3A' : '#aaa',
                      fontWeight: active ? 700 : done ? 600 : 400,
                      lineHeight: 1.3,
                    }}>{step.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RTO / Cancelled Banner */}
        {(isCancelled || isRTO) && (
          <div style={{ background: '#fdecea', border: '1px solid #f5c6cb', borderRadius: 12, padding: 20, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 24 }}></span>
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

        {/* Tracking Timeline */}
        {shipment.tracking && shipment.tracking.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e0d5', padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(91,26,58,0.06)' }}>
            <h3 style={{ margin: '0 0 20px', color: '#5B1A3A', fontFamily: 'Playfair Display, serif', fontSize: 18 }}>Tracking History</h3>
            <div style={{ position: 'relative' }}>
              {/* Vertical line */}
              <div style={{ position: 'absolute', left: 17, top: 0, bottom: 0, width: 2, background: '#e8e0d5' }} />
              {[...shipment.tracking].reverse().map((event, idx) => (
                <div key={event.id} style={{ display: 'flex', gap: 16, marginBottom: idx < shipment.tracking.length - 1 ? 24 : 0, position: 'relative' }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: idx === 0 ? '#5B1A3A' : '#f0ece8',
                    border: idx === 0 ? '2px solid #C49A3C' : '2px solid #ddd',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                  }}>
                    <span style={{ fontSize: 14 }}>{idx === 0 ? '' : '•'}</span>
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <p style={{ margin: 0, fontWeight: 600, color: idx === 0 ? '#5B1A3A' : '#333', fontSize: 14 }}>
                      {event.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </p>
                    {event.description && (
                      <p style={{ margin: '2px 0 0', color: '#555', fontSize: 13 }}>{event.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                      {event.location && (
                        <span style={{ color: '#888', fontSize: 12 }}> {event.location}</span>
                      )}
                      <span style={{ color: '#aaa', fontSize: 12 }}>{formatDate(event.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e0d5', padding: 20, display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(91,26,58,0.06)' }}>
          <span style={{ color: '#5B1A3A', fontWeight: 700, fontFamily: 'Playfair Display, serif', fontSize: 16 }}>Insta Fashion Points</span>
          <span style={{ color: '#aaa' }}>•</span>
          <span style={{ color: '#666', fontSize: 13 }}>Need help? <a href="mailto:support@instafashionpoints.com" style={{ color: '#5B1A3A', fontWeight: 600 }}>Contact Support</a></span>
        </div>
      </div>
    </div>
  );
}
