'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function LeadCapturePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    // Check if user has already submitted or closed the popup
    const hasSubmitted = localStorage.getItem('leadSubmitted');
    const hasClosed = sessionStorage.getItem('popupClosed');

    if (!hasSubmitted && !hasClosed) {
      // Show popup after 3 seconds
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('popupClosed', 'true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          mobile,
          page_visited: window.location.pathname,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(language === 'hi' ? 'धन्यवाद! हम जल्द ही आपसे संपर्क करेंगे।' : 'Thank you! We will contact you soon.');
        localStorage.setItem('leadSubmitted', 'true');

        // Close popup after 2 seconds
        setTimeout(() => {
          setIsOpen(false);
        }, 2000);
      } else {
        setMessage(data.error || (language === 'hi' ? 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।' : 'Something went wrong. Please try again.'));
      }
    } catch (error) {
      setMessage(language === 'hi' ? 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।' : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#722F37] to-[#8B3A42] px-6 py-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
            {language === 'hi' ? 'विशेष ऑफर!' : 'Special Offer!'}
          </h2>
          <p className="text-white/90 text-sm">
            {language === 'hi'
              ? 'अपना विवरण दर्ज करें और विशेष छूट पाएं'
              : 'Enter your details to get exclusive discounts'}
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-600 font-medium">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'hi' ? 'आपका नाम' : 'Your Name'}
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                  placeholder={language === 'hi' ? 'अपना नाम दर्ज करें' : 'Enter your name'}
                />
              </div>

              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">
                    +91
                  </span>
                  <input
                    type="tel"
                    id="mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    pattern="[6-9][0-9]{9}"
                    className="w-full px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                    placeholder={language === 'hi' ? '10 अंक का नंबर' : '10 digit number'}
                  />
                </div>
              </div>

              {message && !isSuccess && (
                <p className="text-red-500 text-sm text-center">{message}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#722F37] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#5a252c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {language === 'hi' ? 'भेज रहा है...' : 'Submitting...'}
                  </>
                ) : (
                  language === 'hi' ? 'सबमिट करें' : 'Get Exclusive Offers'
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                {language === 'hi'
                  ? 'हम आपकी जानकारी को सुरक्षित रखते हैं'
                  : 'We keep your information secure'}
              </p>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
