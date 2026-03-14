'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function LocationSection() {
  const { language } = useLanguage();

  return (
    <section className="py-24 md:py-32 bg-[#F2EFEB]">
      <div className="max-w-[1300px] mx-auto px-6 sm:px-8 lg:px-14">

        {/* Section Header — centered */}
        <div className="text-center mb-14 md:mb-18">
          <h2
            className="text-[2rem] sm:text-[2.6rem] md:text-[3rem] font-semibold text-[#1A1A1A] tracking-[-0.025em] leading-tight"
            style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}
          >
            {language === 'hi' ? 'संपर्क करें' : 'Contact Us'}
          </h2>
          <p className="mt-3 text-[13.5px] text-[#ADADAD] font-light tracking-wide max-w-sm mx-auto leading-relaxed">
            {language === 'hi'
              ? 'हमारे स्टोर पर आएं या कभी भी सहायता के लिए हमसे संपर्क करें।'
              : 'Visit our store or reach us anytime for assistance.'
            }
          </p>
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">

          {/* Left — Map */}
          <div className="group flex flex-col">
            <div
              className="flex-1 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.09)] transition-shadow duration-500 group-hover:shadow-[0_8px_40px_rgba(0,0,0,0.14)] min-h-[420px]"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14479.837772685765!2d85.00!3d24.79!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f32a5d46b9b8c5%3A0x2c1f2c0e0f0f0f0f!2sAmas%2C%20Bihar%20824219!5e0!3m2!1sen!2sin!4v1699999999999!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Fashion Points Store Location"
              />
            </div>
            {/* Map label */}
            <p className="mt-3 text-[11px] text-[#ADADAD] font-light tracking-wide">
              {language === 'hi'
                ? 'अमास, गया के 100 किमी के भीतर ग्राहकों की सेवा करते हैं।'
                : 'Serving customers within 100 km of Amas, Gaya.'
              }
            </p>
          </div>

          {/* Right — Contact Card */}
          <div className="bg-white border border-[#E8E2D9] p-9 md:p-11 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">

            {/* Store name */}
            <div className="mb-8 pb-8 border-b border-[#F0EDE8]">
              <h3
                className="text-[1.4rem] font-semibold text-[#1A1A1A] tracking-tight mb-1"
                style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}
              >
                Fashion Points
              </h3>
              <p className="text-[12px] text-[#ADADAD] tracking-[0.12em] uppercase font-medium">
                {language === 'hi' ? 'आपका प्रीमियम फैशन स्टोर' : 'Your Premium Fashion Store'}
              </p>
            </div>

            {/* Contact rows */}
            <div className="space-y-7">

              {/* Address */}
              <div className="flex items-start gap-4 group/row">
                <div className="flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover/row:scale-110">
                  <svg className="w-4.5 h-4.5 text-[#722F37]" style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10.5px] tracking-[0.2em] uppercase text-[#ADADAD] font-semibold mb-1.5">
                    {language === 'hi' ? 'पता' : 'Address'}
                  </p>
                  <p className="text-[14px] text-[#1A1A1A] font-medium leading-snug">Fashion Points</p>
                  <p className="text-[13px] text-[#6B6B6B] font-light leading-snug mt-0.5">
                    Amas, Gaya, Bihar – 824219
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4 group/row">
                <div className="flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover/row:scale-110">
                  <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} className="text-[#722F37]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10.5px] tracking-[0.2em] uppercase text-[#ADADAD] font-semibold mb-1.5">
                    {language === 'hi' ? 'फोन' : 'Phone'}
                  </p>
                  <a
                    href="tel:+918294153256"
                    className="text-[14px] text-[#1A1A1A] font-medium hover:text-[#722F37] transition-colors duration-200"
                  >
                    +91 82941 53256
                  </a>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-4 group/row">
                <div className="flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover/row:scale-110">
                  <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} className="text-[#722F37]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10.5px] tracking-[0.2em] uppercase text-[#ADADAD] font-semibold mb-1.5">
                    {language === 'hi' ? 'व्यापार के घंटे' : 'Business Hours'}
                  </p>
                  <p className="text-[14px] text-[#1A1A1A] font-medium leading-snug">
                    9:00 AM – 5:30 PM IST
                  </p>
                  <p className="text-[13px] text-[#6B6B6B] font-light mt-0.5 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                    {language === 'hi' ? 'हर दिन खुला' : 'Open Every Day'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-9 space-y-3">

              {/* Call Now — primary */}
              <a
                href="tel:+918294153256"
                className="group/btn flex items-center justify-center gap-2.5 w-full bg-[#722F37] text-white py-4 text-[11px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 hover:bg-[#5A252C] hover:shadow-[0_6px_20px_rgba(114,47,55,0.35)] hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 transition-transform duration-200 group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                {language === 'hi' ? 'अभी कॉल करें' : 'Call Now'}
              </a>

              {/* Get Directions — secondary */}
              <a
                href="https://maps.google.com/?q=Amas,+Gaya,+Bihar+824219"
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn flex items-center justify-center gap-2.5 w-full border border-[#1A1A1A] text-[#1A1A1A] py-4 text-[11px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 hover:bg-[#1A1A1A] hover:text-white hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 transition-transform duration-200 group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
                {language === 'hi' ? 'दिशा प्राप्त करें' : 'Get Directions'}
              </a>

              {/* WhatsApp Chat */}
              <a
                href="https://wa.me/918294153256"
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn flex items-center justify-center gap-2.5 w-full border border-[#25D366] text-[#1A8A3F] py-4 text-[11px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 hover:bg-[#25D366] hover:text-white hover:shadow-[0_6px_20px_rgba(37,211,102,0.3)] hover:-translate-y-0.5"
              >
                {/* WhatsApp icon */}
                <svg className="w-4 h-4 transition-transform duration-200 group-hover/btn:scale-110" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {language === 'hi' ? 'व्हाट्सएप चैट' : 'WhatsApp Chat'}
              </a>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
