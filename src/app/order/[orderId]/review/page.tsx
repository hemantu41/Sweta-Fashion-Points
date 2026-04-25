'use client';

import { useState, use } from 'react';
import StarRating from '@/components/reviews/StarRating';
import toast, { Toaster } from 'react-hot-toast';

export default function ReviewSubmissionPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [productName, setProductName] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!title.trim() || !body.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          rating,
          title: title.trim(),
          body: body.trim(),
          buyerName: buyerName.trim(),
          buyerEmail: buyerEmail.trim(),
          productName: productName.trim() || 'Product',
          sellerId: sellerId.trim() || 'unknown',
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
      } else if (res.status === 409) {
        toast.error('You have already reviewed this order');
        setSubmitted(true);
      } else {
        toast.error(data.error || 'Failed to submit review');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center px-4">
        <Toaster position="top-right" />
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center max-w-md w-full shadow-sm">
          <div className="text-5xl mb-4"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your review has been submitted successfully. It helps other shoppers and our sellers improve.
          </p>
          <a
            href="/"
            className="inline-flex px-6 py-2.5 bg-[#8B1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#701515] transition-colors"
          >
            Continue Shopping
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center px-4 py-10">
      <Toaster position="top-right" />
      <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-lg shadow-sm">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-800">Rate Your Experience</h1>
          <p className="text-xs text-gray-400 mt-0.5">Order: {orderId}</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Buyer info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Your Name</label>
              <input
                type="text"
                value={buyerName}
                onChange={e => setBuyerName(e.target.value)}
                required
                placeholder="Priya Sharma"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A]/40"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Email</label>
              <input
                type="email"
                value={buyerEmail}
                onChange={e => setBuyerEmail(e.target.value)}
                required
                placeholder="priya@example.com"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A]/40"
              />
            </div>
          </div>

          {/* Product + Seller */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Product Name</label>
              <input
                type="text"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                required
                placeholder="Banarasi Silk Saree"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A]/40"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Seller ID</label>
              <input
                type="text"
                value={sellerId}
                onChange={e => setSellerId(e.target.value)}
                required
                placeholder="seller-id"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A]/40"
              />
            </div>
          </div>

          {/* Star rating */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-2 block">Rating</label>
            <div className="flex items-center gap-3">
              <StarRating rating={rating} size={28} interactive onChange={setRating} />
              {rating > 0 && (
                <span className="text-sm font-medium text-gray-600">
                  {['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'][rating]}
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Review Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              maxLength={100}
              placeholder="Summarize your experience"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A]/40"
            />
            <p className="text-[10px] text-gray-400 mt-1 text-right">{title.length}/100</p>
          </div>

          {/* Body */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Your Review</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              required
              maxLength={1000}
              rows={4}
              placeholder="Share details of your experience..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20 focus:border-[#8B1A1A]/40 resize-none"
            />
            <p className="text-[10px] text-gray-400 mt-1 text-right">{body.length}/1000</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="w-full py-3 bg-[#8B1A1A] text-white rounded-lg text-sm font-semibold hover:bg-[#701515] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
