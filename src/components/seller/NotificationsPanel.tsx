'use client';

interface Notification {
  id: string;
  type: 'order' | 'qc' | 'payment' | 'alert';
  text: string;
  time: string;
  read: boolean;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAllRead: () => void;
}

const TYPE_CONFIG = {
  order: { bg: '#EBF2FB', color: '#1A3D6B', icon: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0' },
  qc: { bg: '#EBF7EF', color: '#1A6B3A', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  payment: { bg: '#FEFCE8', color: '#B8860B', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
  alert: { bg: '#FDF3F3', color: '#8B1A1A', icon: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01' },
};

export default function NotificationsPanel({ isOpen, onClose, notifications, onMarkAllRead }: NotificationsPanelProps) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40" onClick={onClose} />}
      <div
        className={`fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Notifications</h2>
          <div className="flex items-center gap-2">
            <button onClick={onMarkAllRead} className="text-xs text-[#8B1A1A] hover:underline">Mark all read</button>
            <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map(n => {
              const cfg = TYPE_CONFIG[n.type];
              return (
                <div
                  key={n.id}
                  className={`flex gap-3 px-5 py-3.5 transition-colors ${!n.read ? 'bg-[#FDF3F3]/40' : 'hover:bg-gray-50'}`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: cfg.bg }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={cfg.icon} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-snug">{n.text}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-[#8B1A1A] flex-shrink-0 mt-1.5" />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
