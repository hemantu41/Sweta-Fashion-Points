'use client';

import { useState } from 'react';

export default function TestTrackingPage() {
  const [orderId, setOrderId] = useState('');
  const [userId, setUserId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testTracking = async () => {
    if (!orderId) {
      alert('Please enter an order ID');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      console.log('[Test Page] Testing tracking for order:', orderId, 'user:', userId || 'none');

      const url = userId
        ? `/api/orders/${orderId}/tracking?userId=${userId}`
        : `/api/orders/${orderId}/tracking`;

      console.log('[Test Page] Fetching:', url);

      const response = await fetch(url);
      const data = await response.json();

      console.log('[Test Page] Response status:', response.status);
      console.log('[Test Page] Response data:', data);

      if (response.ok) {
        setResult({ status: 'success', data });
      } else {
        setError(data.error || 'Unknown error');
        setResult({ status: 'error', data });
      }
    } catch (err) {
      console.error('[Test Page] Error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            🧪 Tracking API Test Page
          </h1>
          <p className="text-gray-600 mb-6">
            This page helps test if the tracking API is working correctly after the Next.js 15+ fix.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order ID (UUID) *
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID (UUID) - Optional
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={testTracking}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? '🔄 Testing...' : '🚀 Test Tracking API'}
            </button>
          </div>
        </div>

        {/* Console Output */}
        <div className="bg-gray-900 rounded-xl p-6 mb-6 text-white font-mono text-sm">
          <h2 className="text-lg font-bold mb-4">📝 Console Output</h2>
          <div className="text-green-400">
            Open your browser's Developer Console (F12) to see detailed logs.
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold text-red-800 mb-2">❌ Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`border rounded-xl p-6 ${
            result.status === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <h2 className={`text-lg font-bold mb-4 ${
              result.status === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.status === 'success' ? '✅ Success!' : '❌ Error'}
            </h2>
            <pre className="bg-white p-4 rounded-lg overflow-auto max-h-96 text-xs">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
          <h2 className="text-lg font-bold text-blue-800 mb-4">📖 Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-900">
            <li>Go to your Orders page and copy an order ID (UUID format)</li>
            <li>Paste the order ID in the field above</li>
            <li>Optionally, add your user ID to test authorization</li>
            <li>Click "Test Tracking API"</li>
            <li>Check the console (F12) for detailed logs</li>
            <li>If you see logs with "[Tracking API]" prefix, the fix is working!</li>
          </ol>
        </div>

        {/* Fix Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mt-6">
          <h2 className="text-lg font-bold text-yellow-800 mb-4">🔧 What Was Fixed</h2>
          <p className="text-yellow-900 mb-2">
            <strong>Issue:</strong> Next.js 15+ made <code className="bg-yellow-100 px-2 py-1 rounded">params</code> a Promise that must be awaited.
          </p>
          <p className="text-yellow-900">
            <strong>Fix:</strong> Updated all API routes to use <code className="bg-yellow-100 px-2 py-1 rounded">await params</code> before accessing the ID.
          </p>
          <p className="text-yellow-900 mt-2">
            <strong>Commit:</strong> <code className="bg-yellow-100 px-2 py-1 rounded">5f68d99</code>
          </p>
        </div>
      </div>
    </div>
  );
}
