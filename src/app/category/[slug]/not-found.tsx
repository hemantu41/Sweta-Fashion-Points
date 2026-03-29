import Link from 'next/link';

export default function CategoryNotFound() {
  return (
    <div style={{
      fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
      background: '#FAF7F8',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🔍</div>
        <h1 style={{
          fontFamily: 'var(--font-playfair, Playfair Display, serif)',
          fontSize: 48, fontWeight: 800, color: '#5B1A3A', margin: '0 0 8px',
        }}>
          404
        </h1>
        <h2 style={{
          fontFamily: 'var(--font-playfair, Playfair Display, serif)',
          fontSize: 22, color: '#5B1A3A', margin: '0 0 8px',
        }}>
          Category Not Found
        </h2>
        <p style={{ color: '#999', fontSize: 14, margin: '0 0 4px' }}>
          The category you're looking for doesn't exist or may have been removed.
        </p>
        <p style={{ color: '#C49A3C', fontSize: 13, fontStyle: 'italic', margin: '0 0 28px' }}>
          आप जो कैटेगरी ढूंढ रहे हैं वह मौजूद नहीं है।
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{
            display: 'inline-block', padding: '13px 28px', borderRadius: 10,
            background: 'linear-gradient(135deg,#5B1A3A,#7A2350)',
            color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none',
            boxShadow: '0 4px 15px rgba(91,26,58,0.2)',
          }}>
            Back to Home
          </Link>
          <Link href="/search" style={{
            display: 'inline-block', padding: '13px 28px', borderRadius: 10,
            border: '1.5px solid #5B1A3A', background: '#fff',
            color: '#5B1A3A', fontWeight: 700, fontSize: 14, textDecoration: 'none',
          }}>
            Search Products
          </Link>
        </div>

        <div style={{ marginTop: 36 }}>
          <p style={{ color: '#bbb', fontSize: 12, marginBottom: 12 }}>Browse popular categories</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['women', 'men', 'kids', 'accessories', 'occasion'].map((s) => (
              <Link key={s} href={`/category/${s}`} style={{
                padding: '7px 16px', borderRadius: 20,
                border: '1px solid #E8E0E4', background: '#fff',
                color: '#5B1A3A', fontSize: 12, fontWeight: 500,
                textDecoration: 'none', textTransform: 'capitalize',
              }}>
                {s}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
