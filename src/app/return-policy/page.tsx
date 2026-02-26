'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function ReturnPolicyPage() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg border border-[#E8E2D9] p-8 md:p-12">
          <h1
            className="text-4xl md:text-5xl font-bold text-[#722F37] mb-8 text-center"
            style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}
          >
            {language === 'hi' ? 'रिटर्न पॉलिसी' : 'Return Policy'}
          </h1>

          <div className="prose prose-lg max-w-none text-[#2D2D2D]">
            <p className="text-sm text-[#6B6B6B] mb-8">
              {language === 'hi'
                ? 'अंतिम अपडेट: 25 फरवरी, 2026'
                : 'Last Updated: February 25, 2026'}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '1. रिटर्न योग्यता' : '1. Return Eligibility'}
              </h2>
              <p className="text-[#2D2D2D] leading-relaxed mb-4">
                {language === 'hi'
                  ? 'हम डिलीवरी की तारीख से 7 दिनों के भीतर रिटर्न स्वीकार करते हैं। रिटर्न योग्य होने के लिए, आइटम को निम्नलिखित शर्तों को पूरा करना होगा:'
                  : 'We accept returns within 7 days of delivery. To be eligible for a return, the item must meet the following conditions:'}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#2D2D2D]">
                <li>{language === 'hi' ? 'अप्रयुक्त और अनधोया होना चाहिए' : 'Must be unused and unwashed'}</li>
                <li>{language === 'hi' ? 'मूल टैग और लेबल संलग्न होने चाहिए' : 'Must have original tags and labels attached'}</li>
                <li>{language === 'hi' ? 'मूल पैकेजिंग में होना चाहिए' : 'Must be in original packaging'}</li>
                <li>{language === 'hi' ? 'क्षतिग्रस्त या परिवर्तित नहीं होना चाहिए' : 'Must not be damaged or altered'}</li>
                <li>{language === 'hi' ? 'चालान/रसीद की एक कॉपी होनी चाहिए' : 'Must have a copy of the invoice/receipt'}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '2. गैर-रिटर्नेबल आइटम' : '2. Non-Returnable Items'}
              </h2>
              <p className="text-[#2D2D2D] leading-relaxed mb-4">
                {language === 'hi'
                  ? 'स्वास्थ्य और स्वच्छता कारणों से, निम्नलिखित आइटम रिटर्न के लिए योग्य नहीं हैं:'
                  : 'For health and hygiene reasons, the following items are not eligible for return:'}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#2D2D2D]">
                <li>{language === 'hi' ? 'अंडरगार्मेंट्स और इनरवियर' : 'Undergarments and innerwear'}</li>
                <li>{language === 'hi' ? 'सौंदर्य उत्पाद और मेकअप (एक बार खोलने के बाद)' : 'Beauty products and makeup (once opened)'}</li>
                <li>{language === 'hi' ? 'सेल या क्लीयरेंस आइटम' : 'Sale or clearance items'}</li>
                <li>{language === 'hi' ? 'कस्टमाइज़ या वैयक्तिकृत उत्पाद' : 'Customized or personalized products'}</li>
                <li>{language === 'hi' ? 'फ्रेगरेंस (एक बार खोलने के बाद)' : 'Fragrances (once opened)'}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '3. रिटर्न कैसे शुरू करें' : '3. How to Initiate a Return'}
              </h2>
              <div className="bg-[#F0EDE8] rounded-lg p-6 mb-4">
                <p className="font-semibold text-[#722F37] mb-3">
                  {language === 'hi' ? 'रिटर्न शुरू करने के लिए चरण:' : 'Steps to initiate a return:'}
                </p>
                <ol className="list-decimal pl-6 space-y-3 text-[#2D2D2D]">
                  <li>
                    {language === 'hi'
                      ? 'support@fashionpoints.co.in पर ईमेल करें या +91 82941 53256 पर कॉल करें'
                      : 'Email us at support@fashionpoints.co.in or call +91 82941 53256'}
                  </li>
                  <li>
                    {language === 'hi'
                      ? 'अपना ऑर्डर नंबर और रिटर्न का कारण प्रदान करें'
                      : 'Provide your order number and reason for return'}
                  </li>
                  <li>
                    {language === 'hi'
                      ? 'हमारी टीम 24 घंटे के भीतर रिटर्न निर्देशों के साथ जवाब देगी'
                      : 'Our team will respond with return instructions within 24 hours'}
                  </li>
                  <li>
                    {language === 'hi'
                      ? 'उत्पाद को सुरक्षित रूप से पैक करें और हमारे पते पर भेजें'
                      : 'Pack the product securely and ship to our address'}
                  </li>
                  <li>
                    {language === 'hi'
                      ? 'रिटर्न शिपमेंट ट्रैकिंग नंबर हमारे साथ साझा करें'
                      : 'Share the return shipment tracking number with us'}
                  </li>
                </ol>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '4. रिटर्न शिपिंग' : '4. Return Shipping'}
              </h2>
              <div className="space-y-3 text-[#2D2D2D]">
                <p>
                  <strong>{language === 'hi' ? 'स्थानीय रिटर्न (Amas, Gaya के भीतर 15 किमी):' : 'Local Returns (Within 15km of Amas, Gaya):'}</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>{language === 'hi' ? 'मुफ्त पिकअप सेवा उपलब्ध है' : 'Free pickup service available'}</li>
                  <li>{language === 'hi' ? 'हमारे डिलीवरी पार्टनर उत्पाद एकत्र करेंगे' : 'Our delivery partner will collect the product'}</li>
                </ul>

                <p className="mt-4">
                  <strong>{language === 'hi' ? 'अन्य स्थान:' : 'Other Locations:'}</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>{language === 'hi' ? 'ग्राहक को रिटर्न शिपिंग की व्यवस्था करनी होगी' : 'Customer must arrange return shipping'}</li>
                  <li>
                    {language === 'hi'
                      ? 'दोषपूर्ण/क्षतिग्रस्त उत्पादों के लिए, हम शिपिंग शुल्क वापस करेंगे'
                      : 'For defective/damaged products, we will reimburse shipping charges'}
                  </li>
                  <li>
                    {language === 'hi'
                      ? 'मन बदलने पर, ग्राहक शिपिंग शुल्क वहन करता है'
                      : 'For change of mind, customer bears shipping charges'}
                  </li>
                </ul>
              </div>

              <div className="bg-[#722F37] bg-opacity-10 rounded-lg p-4 mt-4 border border-[#722F37]">
                <p className="text-[#722F37] font-semibold">
                  {language === 'hi'
                    ? '📦 रिटर्न पता: Sweta Fashion Points, Amas, Gaya, Bihar - 824219'
                    : '📦 Return Address: Sweta Fashion Points, Amas, Gaya, Bihar - 824219'}
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '5. रिफंड प्रक्रिया' : '5. Refund Process'}
              </h2>
              <p className="text-[#2D2D2D] leading-relaxed mb-4">
                {language === 'hi'
                  ? 'एक बार जब हम आपका रिटर्न प्राप्त करते हैं और उसका निरीक्षण करते हैं:'
                  : 'Once we receive and inspect your return:'}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#2D2D2D]">
                <li>
                  {language === 'hi'
                    ? 'रिटर्न स्वीकृति की ईमेल पुष्टि 1-2 व्यावसायिक दिनों में भेजी जाएगी'
                    : 'Email confirmation of return approval will be sent within 1-2 business days'}
                </li>
                <li>
                  {language === 'hi'
                    ? 'रिफंड मूल भुगतान विधि में प्रोसेस किया जाएगा'
                    : 'Refund will be processed to the original payment method'}
                </li>
                <li>
                  {language === 'hi'
                    ? 'रिफंड आपके खाते में 5-7 व्यावसायिक दिनों में दिखाई देगा'
                    : 'Refund will reflect in your account within 5-7 business days'}
                </li>
                <li>
                  {language === 'hi'
                    ? 'मूल शिपिंग शुल्क वापस नहीं किया जाएगा (जब तक कि उत्पाद दोषपूर्ण न हो)'
                    : 'Original shipping charges are non-refundable (unless product is defective)'}
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '6. एक्सचेंज' : '6. Exchanges'}
              </h2>
              <p className="text-[#2D2D2D] leading-relaxed mb-4">
                {language === 'hi'
                  ? 'हम वर्तमान में सीधे एक्सचेंज की पेशकश नहीं करते हैं। यदि आप एक अलग साइज़ या रंग चाहते हैं:'
                  : 'We currently do not offer direct exchanges. If you want a different size or color:'}
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-[#2D2D2D]">
                <li>{language === 'hi' ? 'मूल आइटम को रिटर्न करें' : 'Return the original item'}</li>
                <li>{language === 'hi' ? 'वांछित आइटम के लिए नया ऑर्डर दें' : 'Place a new order for the desired item'}</li>
                <li>
                  {language === 'hi'
                    ? 'आपका रिफंड प्रोसेस हो जाने के बाद, नए ऑर्डर की राशि चार्ज की जाएगी'
                    : 'Once your refund is processed, the new order amount will be charged'}
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '7. क्षतिग्रस्त या दोषपूर्ण उत्पाद' : '7. Damaged or Defective Products'}
              </h2>
              <p className="text-[#2D2D2D] leading-relaxed mb-4">
                {language === 'hi'
                  ? 'यदि आपको क्षतिग्रस्त या दोषपूर्ण उत्पाद प्राप्त होता है:'
                  : 'If you receive a damaged or defective product:'}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#2D2D2D]">
                <li>
                  {language === 'hi'
                    ? 'डिलीवरी के 48 घंटे के भीतर क्षति/दोष की तस्वीरें के साथ हमसे संपर्क करें'
                    : 'Contact us within 48 hours of delivery with photos of the damage/defect'}
                </li>
                <li>
                  {language === 'hi'
                    ? 'हम तुरंत रिप्लेसमेंट या पूर्ण रिफंड की व्यवस्था करेंगे'
                    : 'We will arrange for immediate replacement or full refund'}
                </li>
                <li>
                  {language === 'hi'
                    ? 'रिटर्न शिपिंग शुल्क हमारे द्वारा वहन किया जाएगा'
                    : 'Return shipping charges will be borne by us'}
                </li>
                <li>
                  {language === 'hi'
                    ? 'कोई प्रश्न पूछे बिना पूर्ण रिफंड प्रदान किया जाएगा'
                    : 'Full refund will be provided with no questions asked'}
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '8. गलत उत्पाद प्राप्त होना' : '8. Wrong Product Received'}
              </h2>
              <p className="text-[#2D2D2D] leading-relaxed mb-4">
                {language === 'hi'
                  ? 'यदि आपको गलत उत्पाद प्राप्त होता है, तो हम गलती के लिए माफी मांगते हैं। कृपया:'
                  : 'If you receive the wrong product, we apologize for the mistake. Please:'}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#2D2D2D]">
                <li>
                  {language === 'hi'
                    ? 'तुरंत उत्पाद की तस्वीर के साथ हमसे संपर्क करें'
                    : 'Contact us immediately with a photo of the product'}
                </li>
                <li>
                  {language === 'hi'
                    ? 'हम सही उत्पाद मुफ्त में भेजेंगे'
                    : 'We will ship the correct product at no extra cost'}
                </li>
                <li>
                  {language === 'hi'
                    ? 'गलत उत्पाद के लिए मुफ्त पिकअप की व्यवस्था की जाएगी'
                    : 'Free pickup will be arranged for the wrong product'}
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '9. रिफंड अस्वीकृति' : '9. Refund Denial'}
              </h2>
              <p className="text-[#2D2D2D] leading-relaxed mb-4">
                {language === 'hi'
                  ? 'हम निम्नलिखित मामलों में रिफंड से इनकार करने का अधिकार सुरक्षित रखते हैं:'
                  : 'We reserve the right to deny refunds in the following cases:'}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#2D2D2D]">
                <li>{language === 'hi' ? 'उत्पाद का उपयोग या धोया गया' : 'Product has been used or washed'}</li>
                <li>{language === 'hi' ? 'मूल टैग या पैकेजिंग नहीं है' : 'Original tags or packaging missing'}</li>
                <li>{language === 'hi' ? '7 दिन की रिटर्न विंडो के बाद रिटर्न' : 'Return after 7-day return window'}</li>
                <li>{language === 'hi' ? 'उत्पाद क्षतिग्रस्त या परिवर्तित किया गया' : 'Product damaged or altered by customer'}</li>
                <li>{language === 'hi' ? 'गैर-रिटर्नेबल श्रेणी में आता है' : 'Falls under non-returnable category'}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-[#722F37] mb-4">
                {language === 'hi' ? '10. ग्राहक सहायता' : '10. Customer Support'}
              </h2>
              <div className="bg-[#F0EDE8] rounded-lg p-6 text-[#2D2D2D]">
                <p className="mb-4 font-semibold text-[#722F37]">
                  {language === 'hi'
                    ? 'रिटर्न से संबंधित किसी भी प्रश्न के लिए, कृपया हमसे संपर्क करें:'
                    : 'For any questions regarding returns, please contact us:'}
                </p>
                <p className="mb-2">
                  <strong>{language === 'hi' ? '📧 ईमेल:' : '📧 Email:'}</strong> support@fashionpoints.co.in
                </p>
                <p className="mb-2">
                  <strong>{language === 'hi' ? '📞 फोन:' : '📞 Phone:'}</strong> +91 82941 53256
                </p>
                <p className="mb-2">
                  <strong>{language === 'hi' ? '⏰ समय:' : '⏰ Hours:'}</strong>{' '}
                  {language === 'hi'
                    ? 'सोमवार - शनिवार, सुबह 10:00 बजे - शाम 6:00 बजे'
                    : 'Monday - Saturday, 10:00 AM - 6:00 PM'}
                </p>
                <p>
                  <strong>{language === 'hi' ? '📍 पता:' : '📍 Address:'}</strong> Amas, Gaya, Bihar - 824219
                </p>
              </div>
            </section>

            <div className="mt-12 p-6 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-800 font-semibold text-center mb-2">
                {language === 'hi' ? '✅ हमारी प्रतिबद्धता' : '✅ Our Commitment'}
              </p>
              <p className="text-green-700 text-center">
                {language === 'hi'
                  ? 'हम आपकी संतुष्टि के लिए प्रतिबद्ध हैं। यदि आप अपनी खरीदारी से संतुष्ट नहीं हैं, तो हम इसे सही करने के लिए हर संभव प्रयास करेंगे।'
                  : 'We are committed to your satisfaction. If you are not happy with your purchase, we will do everything we can to make it right.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
