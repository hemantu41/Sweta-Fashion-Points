'use client';

import { LocationSection } from '@/components';
import { useLanguage } from '@/context/LanguageContext';

export default function ContactPage() {
  const { language, t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#722F37] to-[#5A252C] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('contact.title')}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            {t('contact.serving')}
          </p>
        </div>
      </div>

      {/* Location Section */}
      <LocationSection />

      {/* Additional Info */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Why Visit */}
            <div className="bg-[#FAF7F2] rounded-2xl p-6">
              <span className="text-4xl mb-4 block">🛍️</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'hi' ? 'स्टोर पर क्यों आएं?' : 'Why Visit Our Store?'}
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#722F37]">✓</span>
                  <span>{language === 'hi' ? 'पूरा कलेक्शन देखें' : 'See the full collection'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#722F37]">✓</span>
                  <span>{language === 'hi' ? 'कपड़े को छूकर देखें' : 'Touch and feel the fabric'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#722F37]">✓</span>
                  <span>{language === 'hi' ? 'ट्राई करके खरीदें' : 'Try before you buy'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#722F37]">✓</span>
                  <span>{language === 'hi' ? 'स्टाइलिंग टिप्स पाएं' : 'Get styling tips'}</span>
                </li>
              </ul>
            </div>

            {/* Shop Online */}
            <div className="bg-[#FAF7F2] rounded-2xl p-6">
              <span className="text-4xl mb-4 block">🛒</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'hi' ? 'ऑनलाइन शॉपिंग करें' : 'Shop Online'}
              </h3>
              <p className="text-gray-600 mb-4">
                {language === 'hi'
                  ? 'हमारे कलेक्शन को ऑनलाइन देखें और घर बैठे अपनी पसंद चुनें।'
                  : 'Browse our collection online and choose your favorites from home.'}
              </p>
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 bg-[#722F37] text-white font-medium rounded-full hover:bg-[#5a252c] transition-colors text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {language === 'hi' ? 'शॉपिंग शुरू करें' : 'Start Shopping'}
              </a>
            </div>

            {/* Area Served */}
            <div className="bg-[#FAF7F2] rounded-2xl p-6">
              <span className="text-4xl mb-4 block">📍</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'hi' ? 'सेवा क्षेत्र' : 'Areas We Serve'}
              </h3>
              <p className="text-gray-600 mb-4">
                {language === 'hi'
                  ? 'अमस, गया से 100 किमी के भीतर सभी क्षेत्रों में सेवा उपलब्ध'
                  : 'We serve customers within 100 km radius of Amas, Gaya'}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-700">Gaya</span>
                <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-700">Bodh Gaya</span>
                <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-700">Nawada</span>
                <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-700">Aurangabad</span>
                <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-700">Jehanabad</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            {language === 'hi' ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}
          </h2>

          <div className="space-y-4">
            <details className="bg-white rounded-xl p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer flex justify-between items-center">
                {language === 'hi' ? 'क्या आप होम डिलीवरी करते हैं?' : 'Do you offer home delivery?'}
                <span className="text-[#722F37] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-gray-600">
                {language === 'hi'
                  ? 'हां, हम Gaya और आसपास के क्षेत्रों में होम डिलीवरी की सुविधा प्रदान करते हैं। ऑनलाइन ऑर्डर करें या स्टोर पर कॉल करें।'
                  : 'Yes, we offer home delivery in Gaya and nearby areas. Order online or call our store for details.'}
              </p>
            </details>

            <details className="bg-white rounded-xl p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer flex justify-between items-center">
                {language === 'hi' ? 'क्या मैं खरीदने से पहले ट्राई कर सकता हूं?' : 'Can I try before buying?'}
                <span className="text-[#722F37] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-gray-600">
                {language === 'hi'
                  ? 'बिल्कुल! हमारे स्टोर पर आएं और जितने चाहें उतने कपड़े ट्राई करें। हमारे पास ट्रायल रूम उपलब्ध है।'
                  : 'Absolutely! Visit our store and try as many clothes as you like. We have trial rooms available.'}
              </p>
            </details>

            <details className="bg-white rounded-xl p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer flex justify-between items-center">
                {language === 'hi' ? 'पेमेंट के क्या विकल्प हैं?' : 'What payment options do you accept?'}
                <span className="text-[#722F37] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-gray-600">
                {language === 'hi'
                  ? 'हम कैश, UPI (Google Pay, PhonePe), और कार्ड पेमेंट स्वीकार करते हैं।'
                  : 'We accept Cash, UPI (Google Pay, PhonePe), and Card payments.'}
              </p>
            </details>

            <details className="bg-white rounded-xl p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer flex justify-between items-center">
                {language === 'hi' ? 'क्या एक्सचेंज/रिटर्न संभव है?' : 'Is exchange/return possible?'}
                <span className="text-[#722F37] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-gray-600">
                {language === 'hi'
                  ? 'हां, अनयूज्ड प्रोडक्ट को 7 दिनों के भीतर बिल के साथ एक्सचेंज किया जा सकता है।'
                  : 'Yes, unused products can be exchanged within 7 days with the bill.'}
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
