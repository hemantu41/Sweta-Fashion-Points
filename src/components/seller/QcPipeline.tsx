export type QcStage = 0 | 1 | 2 | 3 | 4; // 0=submitted,1=image,2=content,3=admin,4=live

const STAGES = ['Submitted', 'Image Check', 'Content Review', 'Admin Approval', 'Live'];

interface QcPipelineProps {
  currentStage: QcStage;
  rejected?: boolean;
  compact?: boolean;
}

export default function QcPipeline({ currentStage, rejected = false, compact = false }: QcPipelineProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-0.5">
        {STAGES.map((_, i) => {
          const done = i < currentStage;
          const active = i === currentStage;
          const isRej = rejected && active;
          return (
            <div
              key={i}
              className="h-1 rounded-full flex-1"
              style={{
                background: isRej ? '#EF4444' : done ? '#2E7D32' : active ? '#C49A3C' : '#E5E7EB',
              }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center">
      {STAGES.map((label, i) => {
        const done = i < currentStage;
        const active = i === currentStage;
        const isRej = rejected && active;
        const stepColor = isRej ? '#EF4444' : done ? '#2E7D32' : active ? '#C49A3C' : '#9CA3AF';

        return (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 transition-colors"
                style={{ background: done || active ? stepColor : 'transparent', borderColor: stepColor, color: done || active ? 'white' : stepColor }}
              >
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                ) : isRej ? '✕' : i + 1}
              </div>
              <span className="text-[9px] font-medium mt-1 text-center whitespace-nowrap" style={{ color: active || done ? stepColor : '#9CA3AF' }}>
                {label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 mb-4" style={{ background: done ? '#2E7D32' : '#E5E7EB' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
