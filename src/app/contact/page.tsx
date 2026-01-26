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

            {/* WhatsApp Order */}
            <div className="bg-[#FAF7F2] rounded-2xl p-6">
              <span className="text-4xl mb-4 block">📱</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'hi' ? 'WhatsApp से ऑर्डर करें' : 'Order via WhatsApp'}
              </h3>
              <p className="text-gray-600 mb-4">
                {language === 'hi'
                  ? 'स्टोर नहीं आ सकते? कोई बात नहीं! WhatsApp पर फोटो मंगवाएं और घर बैठे ऑर्डर करें।'
                  : "Can't visit the store? No problem! Get photos on WhatsApp and order from home."}
              </p>
              <a
                href="https://wa.me/919608063673?text=Hi!%20I%20want%20to%20order%20via%20WhatsApp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 transition-colors text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Start Chat
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
                  ? 'हां, हम Gaya और आसपास के क्षेत्रों में होम डिलीवरी की सुविधा प्रदान करते हैं। WhatsApp पर संपर्क करें।'
                  : 'Yes, we offer home delivery in Gaya and nearby areas. Contact us on WhatsApp for details.'}
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
