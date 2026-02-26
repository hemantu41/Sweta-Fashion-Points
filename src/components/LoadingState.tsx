/**
 * Enhanced loading states for different API operations
 * Provides better UX during slow API calls
 */

interface LoadingStateProps {
  message?: string;
  submessage?: string;
  type?: 'default' | 'payment' | 'courier' | 'upload';
  progress?: number;
}

export function LoadingState({ message, submessage, type = 'default', progress }: LoadingStateProps) {
  const getIcon = () => {
    switch (type) {
      case 'payment':
        return (
          <svg className="w-16 h-16 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'courier':
        return (
          <svg className="w-16 h-16 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        );
      case 'upload':
        return (
          <svg className="w-16 h-16 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Icon */}
      {getIcon()}

      {/* Spinner */}
      <div className="relative mt-6">
        <div className="w-16 h-16 border-4 border-[#E8E2D9] border-t-[#722F37] rounded-full animate-spin"></div>
        {progress !== undefined && progress > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-[#722F37]">{Math.round(progress)}%</span>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <p className="mt-4 text-[#2D2D2D] font-medium text-center">{message}</p>
      )}

      {/* Submessage */}
      {submessage && (
        <p className="mt-2 text-[#6B6B6B] text-sm text-center max-w-md">{submessage}</p>
      )}

      {/* Progress bar */}
      {progress !== undefined && progress > 0 && (
        <div className="mt-4 w-64 h-2 bg-[#E8E2D9] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#722F37] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function PaymentLoadingState() {
  return (
    <LoadingState
      type="payment"
      message="Processing Payment..."
      submessage="Please wait while we process your payment securely with Razorpay. This may take a few seconds."
    />
  );
}

export function CourierLoadingState() {
  return (
    <LoadingState
      type="courier"
      message="Fetching Courier Rates..."
      submessage="Comparing rates across 17+ courier partners to find you the best price. This may take a few seconds."
    />
  );
}

export function UploadLoadingState({ progress }: { progress?: number }) {
  return (
    <LoadingState
      type="upload"
      message="Uploading Images..."
      submessage="Compressing and uploading your images. Please don't close this window."
      progress={progress}
    />
  );
}

export function DefaultLoadingState({ message }: { message?: string }) {
  return (
    <LoadingState
      message={message || "Loading..."}
      submessage="Please wait a moment"
    />
  );
}
