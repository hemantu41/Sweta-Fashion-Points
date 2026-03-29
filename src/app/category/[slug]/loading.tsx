export default function CategoryLoading() {
  return (
    <div style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)', background: '#FAF7F8', minHeight: '100vh' }}>

      {/* Breadcrumb skeleton */}
      <div style={{ background: '#fff', padding: '12px 24px', borderBottom: '1px solid rgba(196,154,60,0.1)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {[60, 40, 90].map((w, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {i > 0 && <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f0eaed' }} />}
              <div style={{ width: w, height: 12, borderRadius: 5, background: '#f0eaed', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,#f0eaed 25%,#FAF7F8 50%,#f0eaed 75%)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Header skeleton */}
      <div style={{ background: 'linear-gradient(135deg,#5B1A3A,#7A2350)', padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ width: 40, height: 32, background: 'rgba(255,255,255,0.15)', borderRadius: 6, margin: '0 auto 8px' }} />
          <div style={{ width: 200, height: 28, background: 'rgba(255,255,255,0.15)', borderRadius: 8, margin: '0 auto 8px' }} />
          <div style={{ width: 100, height: 14, background: 'rgba(255,255,255,0.1)', borderRadius: 6, margin: '0 auto' }} />
        </div>
      </div>

      {/* Sort bar skeleton */}
      <div style={{ background: '#fff', padding: '10px 24px', borderBottom: '1px solid rgba(196,154,60,0.06)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: 120, height: 14, background: '#f0eaed', borderRadius: 5 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {[70, 110, 120, 100].map((w, i) => (
              <div key={i} style={{ width: w, height: 28, background: '#f0eaed', borderRadius: 18 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Product grid skeleton */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(196,154,60,0.08)' }}>
              <div style={{ width: '100%', aspectRatio: '3/4', backgroundImage: 'linear-gradient(90deg,#f0eaed 25%,#FAF7F8 50%,#f0eaed 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
              <div style={{ padding: '12px 14px' }}>
                <div style={{ width: '80%', height: 11, background: '#f0eaed', borderRadius: 5, marginBottom: 6 }} />
                <div style={{ width: '55%', height: 11, background: '#f0eaed', borderRadius: 5, marginBottom: 12 }} />
                <div style={{ width: '45%', height: 17, background: '#f0eaed', borderRadius: 5 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>
    </div>
  );
}
