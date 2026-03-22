'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface SellerResponseFormProps {
  reviewId: string;
  existingResponse?: string;
  onResponseSaved: () => void;
}

export default function SellerResponseForm({ reviewId, existingResponse, onResponseSaved }: SellerResponseFormProps) {
  const [text, setText] = useState(existingResponse || '');
  const [saving, setSaving] = useState(false);
  const maxLen = 800;

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseText: text.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(existingResponse ? 'Response updated' : 'Response published');
        onResponseSaved();
      } else {
        toast.error(data.error || 'Failed to save response');
      }
    } catch {
      toast.error('Failed to save response');
    }
    setSaving(false);
  };

  return (
    <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-amber-800">
          {existingResponse ? 'Edit Your Response' : 'Reply to This Review'}
        </p>
        <span className={`text-[10px] font-medium ${text.length > maxLen ? 'text-red-500' : 'text-amber-500'}`}>
          {text.length}/{maxLen}
        </span>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        maxLength={maxLen}
        rows={3}
        placeholder="Write a professional, helpful response to this review..."
        className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300/50 resize-none"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving || !text.trim() || text.length > maxLen}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Publishing...' : existingResponse ? 'Update Response' : 'Publish Response'}
        </button>
      </div>
    </div>
  );
}
