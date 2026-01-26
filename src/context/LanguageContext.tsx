'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.mens': "Men's",
    'nav.womens': "Women's",
    'nav.sarees': 'Sarees',
    'nav.kids': 'Kids',
    'nav.newArrivals': 'New Arrivals',
    'nav.offers': 'Offers',
    'nav.visitStore': 'Visit Store',
    'nav.contact': 'Contact',

    // Hero Section
    'hero.title': 'Your Style, Your Story',
    'hero.subtitle': 'Discover the latest trends in fashion for the whole family',
    'hero.shopNow': 'Shop Now',
    'hero.viewCollection': 'View Collections',
    'hero.yearsExperience': 'Years of Trust',
    'hero.happyCustomers': 'Happy Customers',
    'hero.qualityProducts': 'Quality Products',

    // Categories
    'cat.mens': "Men's Collection",
    'cat.mensDesc': 'Casual, Formal & Ethnic Wear',
    'cat.womens': "Women's Collection",
    'cat.womensDesc': 'Daily, Party & Ethnic Wear',
    'cat.sarees': 'Sarees Collection',
    'cat.sareesDesc': 'Traditional & Designer Sarees',
    'cat.kids': "Kids' Collection",
    'cat.kidsDesc': 'Comfortable & Stylish',

    // Why Choose Us
    'why.title': 'Why Choose Sweta Fashion Points?',
    'why.quality': 'Premium Quality',
    'why.qualityDesc': 'Handpicked fabrics and materials for lasting comfort',
    'why.price': 'Affordable Prices',
    'why.priceDesc': 'Best fashion at prices that fit your budget',
    'why.variety': 'Wide Variety',
    'why.varietyDesc': 'Collections for every occasion and age group',
    'why.trust': 'Trusted Locally',
    'why.trustDesc': 'Serving families in Gaya region for years',

    // Contact
    'contact.title': 'Visit Our Store',
    'contact.address': 'Address',
    'contact.phone': 'Phone',
    'contact.hours': 'Business Hours',
    'contact.hoursValue': 'Every day 9:00 AM - 5:30 PM IST',
    'contact.serving': 'Serving customers within 100 km of Amas, Gaya',
    'contact.whatsapp': 'Order on WhatsApp',
    'contact.call': 'Call Now',
    'contact.directions': 'Get Directions',

    // Products
    'product.availableInStore': 'Available in Store',
    'product.orderWhatsapp': 'Order on WhatsApp',
    'product.newArrival': 'New Arrival',
    'product.bestSeller': 'Best Seller',
    'product.viewAll': 'View All',

    // Sarees Categories
    'saree.byOccasion': 'By Occasion',
    'saree.byPrice': 'By Price Range',
    'saree.daily': 'Daily Wear',
    'saree.party': 'Party Wear',
    'saree.wedding': 'Wedding & Bridal',
    'saree.festival': 'Festival Special',
    'saree.under1000': 'Under ₹1,000',
    'saree.1000to2500': '₹1,000 - ₹2,500',
    'saree.2500to5000': '₹2,500 - ₹5,000',
    'saree.premium': 'Wedding Premium',

    // Footer
    'footer.tagline': 'Your trusted fashion destination in Gaya',
    'footer.quickLinks': 'Quick Links',
    'footer.categories': 'Categories',
    'footer.contact': 'Contact Us',
    'footer.followUs': 'Follow Us',
    'footer.rights': 'All rights reserved',

    // Common
    'common.exploreCollection': 'Explore Collection',
    'common.seeMore': 'See More',
    'common.shopCollection': 'Shop Collection',
  },
  hi: {
    // Navigation
    'nav.home': 'होम',
    'nav.mens': 'पुरुष',
    'nav.womens': 'महिला',
    'nav.sarees': 'साड़ियां',
    'nav.kids': 'बच्चे',
    'nav.newArrivals': 'नए आगमन',
    'nav.offers': 'ऑफर',
    'nav.visitStore': 'स्टोर पर जाएं',
    'nav.contact': 'संपर्क',

    // Hero Section
    'hero.title': 'आपकी स्टाइल, आपकी कहानी',
    'hero.subtitle': 'पूरे परिवार के लिए फैशन में नवीनतम ट्रेंड खोजें',
    'hero.shopNow': 'अभी खरीदें',
    'hero.viewCollection': 'कलेक्शन देखें',
    'hero.yearsExperience': 'वर्षों का विश्वास',
    'hero.happyCustomers': 'खुश ग्राहक',
    'hero.qualityProducts': 'गुणवत्ता उत्पाद',

    // Categories
    'cat.mens': 'पुरुषों का कलेक्शन',
    'cat.mensDesc': 'कैजुअल, फॉर्मल और एथनिक वियर',
    'cat.womens': 'महिलाओं का कलेक्शन',
    'cat.womensDesc': 'डेली, पार्टी और एथनिक वियर',
    'cat.sarees': 'साड़ी कलेक्शन',
    'cat.sareesDesc': 'पारंपरिक और डिज़ाइनर साड़ियां',
    'cat.kids': 'बच्चों का कलेक्शन',
    'cat.kidsDesc': 'आरामदायक और स्टाइलिश',

    // Why Choose Us
    'why.title': 'स्वेता फैशन पॉइंट्स क्यों चुनें?',
    'why.quality': 'प्रीमियम क्वालिटी',
    'why.qualityDesc': 'लंबे समय तक आराम के लिए चुने हुए कपड़े',
    'why.price': 'किफायती कीमतें',
    'why.priceDesc': 'आपके बजट में बेहतरीन फैशन',
    'why.variety': 'विस्तृत विविधता',
    'why.varietyDesc': 'हर अवसर और उम्र के लिए कलेक्शन',
    'why.trust': 'स्थानीय विश्वास',
    'why.trustDesc': 'वर्षों से गया क्षेत्र के परिवारों की सेवा',

    // Contact
    'contact.title': 'हमारे स्टोर पर आएं',
    'contact.address': 'पता',
    'contact.phone': 'फोन',
    'contact.hours': 'व्यापार के घंटे',
    'contact.hoursValue': 'हर दिन सुबह 9:00 - शाम 5:30 IST',
    'contact.serving': 'अमस, गया से 100 किमी के भीतर ग्राहकों की सेवा',
    'contact.whatsapp': 'WhatsApp पर ऑर्डर करें',
    'contact.call': 'अभी कॉल करें',
    'contact.directions': 'दिशा-निर्देश प्राप्त करें',

    // Products
    'product.availableInStore': 'स्टोर में उपलब्ध',
    'product.orderWhatsapp': 'WhatsApp पर ऑर्डर करें',
    'product.newArrival': 'नया आगमन',
    'product.bestSeller': 'बेस्ट सेलर',
    'product.viewAll': 'सभी देखें',

    // Sarees Categories
    'saree.byOccasion': 'अवसर के अनुसार',
    'saree.byPrice': 'कीमत के अनुसार',
    'saree.daily': 'डेली वियर',
    'saree.party': 'पार्टी वियर',
    'saree.wedding': 'शादी और दुल्हन',
    'saree.festival': 'त्योहार विशेष',
    'saree.under1000': '₹1,000 से कम',
    'saree.1000to2500': '₹1,000 - ₹2,500',
    'saree.2500to5000': '₹2,500 - ₹5,000',
    'saree.premium': 'वेडिंग प्रीमियम',

    // Footer
    'footer.tagline': 'गया में आपका विश्वसनीय फैशन गंतव्य',
    'footer.quickLinks': 'त्वरित लिंक',
    'footer.categories': 'श्रेणियां',
    'footer.contact': 'संपर्क करें',
    'footer.followUs': 'हमें फॉलो करें',
    'footer.rights': 'सर्वाधिकार सुरक्षित',

    // Common
    'common.exploreCollection': 'कलेक्शन देखें',
    'common.seeMore': 'और देखें',
    'common.shopCollection': 'शॉप कलेक्शन',
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'en' || saved === 'hi')) {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
