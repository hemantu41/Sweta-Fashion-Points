'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function TermsAndConditionsPage() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg border border-[#E8E2D9] p-8 md:p-12">
          <h1
            className="text-4xl md:text-5xl font-bold text-[#722F37] mb-8 text-center"
            style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}
          >
            {language === 'hi' ? 'नियम और शर्तें' : 'Terms & Conditions'}
          </h1>

          <div className="prose prose-lg max-w-none text-[#2D2D2D]">
            <p className="text-sm text-[#6B6B6B] mb-8">
              {language === 'hi'
                ? 'अंतिम अपडेट: 25 फरवरी, 2026'
                : 'Last Updated: February 25, 2026'}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '1. परिचय' : '1. Introduction'}
              </h2>
              <p className="text-[#2D2D2D] leading-relaxed mb-4">
                {language === 'hi'
                  ? 'Sweta Fashion Points में आपका स्वागत है। fashionpoints.co.in ("वेबसाइट") का उपयोग करके, आप इन नियमों और शर्तों से बाध्य होने के लिए सहमत हैं। कृपया सावधानीपूर्वक पढ़ें।'
                  : 'Welcome to Sweta Fashion Points. By using fashionpoints.co.in ("Website"), you agree to be bound by these Terms and Conditions. Please read carefully.'}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '2. उत्पाद और सेवाएं' : '2. Products and Services'}
              </h2>
              <p className="text-[#2D2D2D] leading-relaxed mb-4">
                {language === 'hi'
                  ? 'हम पुरुषों, महिलाओं और बच्चों के लिए फैशन परिधान, साड़ियां, फुटवियर, और ब्यूटी उत्पाद बेचते हैं। सभी उत्पाद विवरण, छवियां और कीमतें परिवर्तन के अधीन हैं। हम बिना किसी सूचना के किसी भी समय किसी भी उत्पाद या सेवा को बंद करने या संशोधित करने का अधिकार सुरक्षित रखते हैं।'
                  : 'We sell fashion clothing for men, women, and children, sarees, footwear, and beauty products. All product descriptions, images, and prices are subject to change. We reserve the right to discontinue or modify any product or service at any time without notice.'}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '3. मूल्य निर्धारण' : '3. Pricing'}
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-[#2D2D2D]">
                <li>{language === 'hi' ? 'सभी कीमतें भारतीय रुपये (₹) में हैं' : 'All prices are in Indian Rupees (₹)'}</li>
                <li>{language === 'hi' ? 'कीमतों में लागू कर शामिल हैं' : 'Prices include applicable taxes'}</li>
                <li>{language === 'hi' ? 'हम कीमतों में त्रुटियों को सुधारने का अधिकार सुरक्षित रखते हैं' : 'We reserve the right to correct pricing errors'}</li>
                <li>{language === 'hi' ? 'ऑफ़र और छूट बदल सकते हैं' : 'Offers and discounts are subject to change'}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '4. ऑर्डर और भुगतान' : '4. Orders and Payment'}
              </h2>
              <p className="text-[#2D2D2D] leading-relaxed mb-4">
                {language === 'hi'
                  ? 'ऑर्डर देकर, आप खरीदारी के लिए एक बाध्यकारी प्रस्ताव दे रहे हैं। हम किसी भी ऑर्डर को स्वीकार करने या अस्वीकार करने का अधिकार सुरक्षित रखते हैं। भुगतान Razorpay के माध्यम से सुरक्षित रूप से संसाधित किए जाते हैं। हम UPI, डेबिट कार्ड, क्रेडिट कार्ड और नेट बैंकिंग स्वीकार करते हैं।'
                  : 'By placing an order, you are making a binding offer to purchase. We reserve the right to accept or decline any order. Payments are processed securely through Razorpay. We accept UPI, Debit Cards, Credit Cards, and Net Banking.'}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '5. शिपिंग और डिलीवरी' : '5. Shipping and Delivery'}
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-[#2D2D2D]">
                <li>{language === 'hi' ? 'हम भारत भर में डिलीवरी करते हैं' : 'We deliver across India'}</li>
                <li>{language === 'hi' ? 'Amas, Gaya के भीतर स्थानीय डिलीवरी (15 किमी): 1-2 दिन' : 'Local delivery within Amas, Gaya (15km): 1-2 days'}</li>
                <li>{language === 'hi' ? 'कूरियर डिलीवरी (बाकी भारत): 5-7 व्यावसायिक दिन' : 'Courier delivery (Rest of India): 5-7 business days'}</li>
                <li>{language === 'hi' ? 'डिलीवरी समय अनुमानित है और गारंटीकृत नहीं है' : 'Delivery times are estimated and not guaranteed'}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '6. रिटर्न और रिफंड' : '6. Returns and Refunds'}
              </h2>
              <p className="text-[#2D2D2D] leading-relaxed mb-4">
                {language === 'hi'
                  ? 'कृपया विस्तृत जानकारी के लिए हमारी रिटर्न पॉलिसी देखें। हम डिलीवरी की तारीख से 7 दिनों के भीतर रिटर्न स्वीकार करते हैं। उत्पाद अप्रयुक्त, अनधोया और मूल टैग के साथ होना चाहिए।'
                  : 'Please see our Return Policy for detailed information. We accept returns within 7 days of delivery. Products must be unused, unwashed, and with original tags.'}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '7. उपयोगकर्ता खाते' : '7. User Accounts'}
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-[#2D2D2D]">
                <li>{language === 'hi' ? 'आप अपनी खाता जानकारी की गोपनीयता बनाए रखने के लिए जिम्मेदार हैं' : 'You are responsible for maintaining the confidentiality of your account information'}</li>
                <li>{language === 'hi' ? 'सटीक और अद्यतित जानकारी प्रदान करें' : 'Provide accurate and up-to-date information'}</li>
                <li>{language === 'hi' ? 'अपने खाते के तहत होने वाली सभी गतिविधियों के लिए आप जिम्मेदार हैं' : 'You are responsible for all activities under your account'}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '8. बौद्धिक संपदा' : '8. Intellectual Property'}
              </h2>
              <p className="text-[#2D2D2D] leading-relaxed mb-4">
                {language === 'hi'
                  ? 'वेबसाइट पर सभी सामग्री, लोगो, डिज़ाइन और ट्रेडमार्क Sweta Fashion Points की संपत्ति हैं। बिना लिखित अनुमति के किसी भी सामग्री का उपयोग, पुनरुत्पादन या वितरण निषिद्ध है।'
                  : 'All content, logos, designs, and trademarks on the Website are the property of Sweta Fashion Points. Any use, reproduction, or distribution of any content without written permission is prohibited.'}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '9. गोपनीयता' : '9. Privacy'}
              </h2>
              <p className="text-[#2D2D2D] leading-relaxed mb-4">
                {language === 'hi'
                  ? 'आपकी गोपनीयता हमारे लिए महत्वपूर्ण है। हम आपके व्यक्तिगत डेटा को सुरक्षित रूप से संग्रहीत करते हैं और केवल ऑर्डर प्रोसेसिंग और डिलीवरी के लिए उपयोग करते हैं। हम आपकी जानकारी को तीसरे पक्ष को नहीं बेचते हैं।'
                  : 'Your privacy is important to us. We store your personal data securely and use it only for order processing and delivery. We do not sell your information to third parties.'}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '10. दायित्व की सीमा' : '10. Limitation of Liability'}
              </h2>
              <p className="text-[#2D2D2D] leading-relaxed mb-4">
                {language === 'hi'
                  ? 'Sweta Fashion Points वेबसाइट के उपयोग या उत्पादों की खरीद से उत्पन्न किसी भी प्रत्यक्ष, अप्रत्यक्ष, आकस्मिक या परिणामी क्षति के लिए उत्तरदायी नहीं होगा। हमारा अधिकतम दायित्व खरीद मूल्य तक सीमित है।'
                  : 'Sweta Fashion Points shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of the Website or purchase of products. Our maximum liability is limited to the purchase price.'}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '11. नियम और शर्तों में परिवर्तन' : '11. Changes to Terms'}
              </h2>
              <p className="text-[#2D2D2D] leading-relaxed mb-4">
                {language === 'hi'
                  ? 'हम किसी भी समय इन नियमों और शर्तों को संशोधित करने का अधिकार सुरक्षित रखते हैं। परिवर्तन तुरंत प्रभावी होंगे। संशोधनों के बाद वेबसाइट का निरंतर उपयोग नए नियमों की स्वीकृति माना जाएगा।'
                  : 'We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately. Continued use of the Website after modifications constitutes acceptance of the new terms.'}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '12. संपर्क जानकारी' : '12. Contact Information'}
              </h2>
              <div className="bg-[#F0EDE8] rounded-lg p-6 text-[#2D2D2D]">
                <p className="mb-2">
                  <strong>{language === 'hi' ? 'पता:' : 'Address:'}</strong> Amas, Gaya, Bihar - 824219
                </p>
                <p className="mb-2">
                  <strong>{language === 'hi' ? 'ईमेल:' : 'Email:'}</strong> support@fashionpoints.co.in
                </p>
                <p className="mb-2">
                  <strong>{language === 'hi' ? 'फोन:' : 'Phone:'}</strong> +91 82941 53256
                </p>
                <p>
                  <strong>{language === 'hi' ? 'वेबसाइट:' : 'Website:'}</strong> fashionpoints.co.in
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '13. शासकीय कानून' : '13. Governing Law'}
              </h2>
              <p className="text-[#2D2D2D] leading-relaxed mb-4">
                {language === 'hi'
                  ? 'ये नियम और शर्तें भारत के कानूनों द्वारा शासित होंगी। किसी भी विवाद के मामले में, Gaya, Bihar की अदालतों का विशेष क्षेत्राधिकार होगा।'
                  : 'These Terms and Conditions shall be governed by the laws of India. In case of any dispute, the courts of Gaya, Bihar shall have exclusive jurisdiction.'}
              </p>
            </section>

            <div className="mt-12 p-6 bg-[#722F37] bg-opacity-10 rounded-lg border border-[#722F37]">
              <p className="text-[#722F37] font-semibold text-center">
                {language === 'hi'
                  ? 'इन नियमों और शर्तों को स्वीकार करके, आप Sweta Fashion Points के साथ एक कानूनी समझौते में प्रवेश कर रहे हैं।'
                  : 'By accepting these Terms and Conditions, you are entering into a legally binding agreement with Sweta Fashion Points.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
