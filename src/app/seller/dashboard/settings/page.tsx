'use client';

export default function SettingsPage() {
  return (
    <div className="max-w-xl space-y-5" style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}>
      <div className="bg-white rounded-xl border border-[#E8E0E4] shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-[#F5EDF2] flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999999" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-[#333333] mb-2">Settings</h2>
        <p className="text-sm text-[#999999]">Account settings and preferences will be available here soon.</p>
        <p className="text-xs text-[#999999] mt-3">To update your business details, contact support at support@fashionpoints.co.in</p>
      </div>
    </div>
  );
}
