export interface Product {
  id: string;
  name: string;
  nameHi: string;
  category: 'mens' | 'womens' | 'sarees' | 'kids';
  subCategory: string;
  price: number;
  priceRange: 'budget' | 'mid' | 'premium';
  image: string;
  images: string[];
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  description: string;
  descriptionHi: string;
  fabric?: string;
  fabricHi?: string;
}

export interface Category {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  image: string;
  link: string;
}

export const categories: Category[] = [
  {
    id: 'mens',
    name: "Men's Collection",
    nameHi: 'पुरुषों का कलेक्शन',
    description: 'Casual, Formal & Ethnic Wear',
    descriptionHi: 'कैजुअल, फॉर्मल और एथनिक वियर',
    image: '/images/categories/mens.jpg',
    link: '/mens',
  },
  {
    id: 'womens',
    name: "Women's Collection",
    nameHi: 'महिलाओं का कलेक्शन',
    description: 'Daily, Party & Ethnic Wear',
    descriptionHi: 'डेली, पार्टी और एथनिक वियर',
    image: '/images/categories/womens.jpg',
    link: '/womens',
  },
  {
    id: 'sarees',
    name: 'Sarees Collection',
    nameHi: 'साड़ी कलेक्शन',
    description: 'Traditional & Designer Sarees',
    descriptionHi: 'पारंपरिक और डिज़ाइनर साड़ियां',
    image: '/images/categories/sarees.jpg',
    link: '/sarees',
  },
  {
    id: 'kids',
    name: "Kids' Collection",
    nameHi: 'बच्चों का कलेक्शन',
    description: 'Comfortable & Stylish',
    descriptionHi: 'आरामदायक और स्टाइलिश',
    image: '/images/categories/kids.jpg',
    link: '/kids',
  },
];

export const mensSubCategories = [
  { id: 'casual', name: 'Casual Wear', nameHi: 'कैजुअल वियर' },
  { id: 'formal', name: 'Formal Wear', nameHi: 'फॉर्मल वियर' },
  { id: 'ethnic', name: 'Ethnic/Festive', nameHi: 'एथनिक/फेस्टिव' },
  { id: 'accessories', name: 'Accessories', nameHi: 'एक्सेसरीज़' },
];

export const womensSubCategories = [
  { id: 'daily', name: 'Daily Wear', nameHi: 'डेली वियर' },
  { id: 'party', name: 'Party Wear', nameHi: 'पार्टी वियर' },
  { id: 'ethnic', name: 'Ethnic Wear', nameHi: 'एथनिक वियर' },
  { id: 'seasonal', name: 'Seasonal Collections', nameHi: 'सीज़नल कलेक्शन' },
];

export const sareesSubCategories = {
  byOccasion: [
    { id: 'daily', name: 'Daily Wear Sarees', nameHi: 'डेली वियर साड़ी' },
    { id: 'party', name: 'Party Wear Sarees', nameHi: 'पार्टी वियर साड़ी' },
    { id: 'wedding', name: 'Wedding & Bridal Sarees', nameHi: 'शादी और दुल्हन साड़ी' },
    { id: 'festival', name: 'Festival Special Sarees', nameHi: 'त्योहार विशेष साड़ी' },
  ],
  byPrice: [
    { id: 'under1000', name: 'Under ₹1,000', nameHi: '₹1,000 से कम', maxPrice: 1000 },
    { id: '1000to2500', name: '₹1,000 - ₹2,500', nameHi: '₹1,000 - ₹2,500', minPrice: 1000, maxPrice: 2500 },
    { id: '2500to5000', name: '₹2,500 - ₹5,000', nameHi: '₹2,500 - ₹5,000', minPrice: 2500, maxPrice: 5000 },
    { id: 'premium', name: 'Wedding Premium', nameHi: 'वेडिंग प्रीमियम', minPrice: 5000 },
  ],
};

export const kidsSubCategories = [
  { id: '0-3', name: 'Age 0-3 Years', nameHi: '0-3 वर्ष' },
  { id: '4-7', name: 'Age 4-7 Years', nameHi: '4-7 वर्ष' },
  { id: '8-12', name: 'Age 8-12 Years', nameHi: '8-12 वर्ष' },
];

// Sample products - Replace with actual products later
export const products: Product[] = [
  // Men's Products
  {
    id: 'mens-1',
    name: 'Cotton Casual Shirt',
    nameHi: 'कॉटन कैजुअल शर्ट',
    category: 'mens',
    subCategory: 'casual',
    price: 899,
    priceRange: 'budget',
    image: '/images/products/mens-casual-1.jpg',
    images: ['/images/products/mens-casual-1.jpg'],
    isNewArrival: true,
    description: 'Comfortable cotton casual shirt perfect for daily wear',
    descriptionHi: 'दैनिक पहनने के लिए आरामदायक कॉटन कैजुअल शर्ट',
    fabric: 'Pure Cotton',
    fabricHi: 'शुद्ध कॉटन',
  },
  {
    id: 'mens-2',
    name: 'Formal Executive Shirt',
    nameHi: 'फॉर्मल एक्ज़ीक्यूटिव शर्ट',
    category: 'mens',
    subCategory: 'formal',
    price: 1299,
    priceRange: 'mid',
    image: '/images/products/mens-formal-1.jpg',
    images: ['/images/products/mens-formal-1.jpg'],
    isBestSeller: true,
    description: 'Premium formal shirt for office and meetings',
    descriptionHi: 'ऑफिस और मीटिंग के लिए प्रीमियम फॉर्मल शर्ट',
    fabric: 'Cotton Blend',
    fabricHi: 'कॉटन ब्लेंड',
  },
  {
    id: 'mens-3',
    name: 'Kurta Pajama Set',
    nameHi: 'कुर्ता पजामा सेट',
    category: 'mens',
    subCategory: 'ethnic',
    price: 1899,
    priceRange: 'mid',
    image: '/images/products/mens-ethnic-1.jpg',
    images: ['/images/products/mens-ethnic-1.jpg'],
    isNewArrival: true,
    description: 'Traditional kurta pajama for festivals and occasions',
    descriptionHi: 'त्योहारों और अवसरों के लिए पारंपरिक कुर्ता पजामा',
    fabric: 'Silk Cotton',
    fabricHi: 'सिल्क कॉटन',
  },

  // Women's Products
  {
    id: 'womens-1',
    name: 'Cotton Kurti',
    nameHi: 'कॉटन कुर्ती',
    category: 'womens',
    subCategory: 'daily',
    price: 699,
    priceRange: 'budget',
    image: '/images/products/womens-daily-1.jpg',
    images: ['/images/products/womens-daily-1.jpg'],
    description: 'Comfortable cotton kurti for everyday style',
    descriptionHi: 'रोज़मर्रा की स्टाइल के लिए आरामदायक कॉटन कुर्ती',
    fabric: 'Pure Cotton',
    fabricHi: 'शुद्ध कॉटन',
  },
  {
    id: 'womens-2',
    name: 'Designer Party Dress',
    nameHi: 'डिज़ाइनर पार्टी ड्रेस',
    category: 'womens',
    subCategory: 'party',
    price: 2499,
    priceRange: 'mid',
    image: '/images/products/womens-party-1.jpg',
    images: ['/images/products/womens-party-1.jpg'],
    isBestSeller: true,
    description: 'Elegant party dress for special occasions',
    descriptionHi: 'विशेष अवसरों के लिए सुंदर पार्टी ड्रेस',
    fabric: 'Georgette',
    fabricHi: 'जॉर्जेट',
  },
  {
    id: 'womens-3',
    name: 'Anarkali Suit',
    nameHi: 'अनारकली सूट',
    category: 'womens',
    subCategory: 'ethnic',
    price: 3299,
    priceRange: 'premium',
    image: '/images/products/womens-ethnic-1.jpg',
    images: ['/images/products/womens-ethnic-1.jpg'],
    isNewArrival: true,
    description: 'Beautiful Anarkali suit with intricate embroidery',
    descriptionHi: 'सुंदर कढ़ाई वाला अनारकली सूट',
    fabric: 'Silk',
    fabricHi: 'सिल्क',
  },

  // Sarees
  {
    id: 'saree-1',
    name: 'Cotton Daily Wear Saree',
    nameHi: 'कॉटन डेली वियर साड़ी',
    category: 'sarees',
    subCategory: 'daily',
    price: 799,
    priceRange: 'budget',
    image: '/images/products/saree-daily-1.jpg',
    images: ['/images/products/saree-daily-1.jpg'],
    description: 'Lightweight cotton saree for comfortable daily wear',
    descriptionHi: 'आरामदायक दैनिक पहनने के लिए हल्की कॉटन साड़ी',
    fabric: 'Pure Cotton',
    fabricHi: 'शुद्ध कॉटन',
  },
  {
    id: 'saree-2',
    name: 'Banarasi Silk Party Saree',
    nameHi: 'बनारसी सिल्क पार्टी साड़ी',
    category: 'sarees',
    subCategory: 'party',
    price: 2999,
    priceRange: 'mid',
    image: '/images/products/saree-party-1.jpg',
    images: ['/images/products/saree-party-1.jpg'],
    isBestSeller: true,
    description: 'Elegant Banarasi silk saree for parties',
    descriptionHi: 'पार्टियों के लिए सुंदर बनारसी सिल्क साड़ी',
    fabric: 'Banarasi Silk',
    fabricHi: 'बनारसी सिल्क',
  },
  {
    id: 'saree-3',
    name: 'Bridal Kanjivaram Saree',
    nameHi: 'ब्राइडल कांजीवरम साड़ी',
    category: 'sarees',
    subCategory: 'wedding',
    price: 8999,
    priceRange: 'premium',
    image: '/images/products/saree-bridal-1.jpg',
    images: ['/images/products/saree-bridal-1.jpg'],
    isNewArrival: true,
    description: 'Premium Kanjivaram silk saree for weddings',
    descriptionHi: 'शादियों के लिए प्रीमियम कांजीवरम सिल्क साड़ी',
    fabric: 'Kanjivaram Silk',
    fabricHi: 'कांजीवरम सिल्क',
  },
  {
    id: 'saree-4',
    name: 'Festival Special Silk Saree',
    nameHi: 'त्योहार विशेष सिल्क साड़ी',
    category: 'sarees',
    subCategory: 'festival',
    price: 1999,
    priceRange: 'mid',
    image: '/images/products/saree-festival-1.jpg',
    images: ['/images/products/saree-festival-1.jpg'],
    description: 'Vibrant silk saree perfect for festivals',
    descriptionHi: 'त्योहारों के लिए जीवंत सिल्क साड़ी',
    fabric: 'Art Silk',
    fabricHi: 'आर्ट सिल्क',
  },

  // Kids Products
  {
    id: 'kids-1',
    name: 'Cotton T-Shirt Set',
    nameHi: 'कॉटन टी-शर्ट सेट',
    category: 'kids',
    subCategory: '0-3',
    price: 499,
    priceRange: 'budget',
    image: '/images/products/kids-toddler-1.jpg',
    images: ['/images/products/kids-toddler-1.jpg'],
    description: 'Soft cotton t-shirt set for toddlers',
    descriptionHi: 'छोटे बच्चों के लिए मुलायम कॉटन टी-शर्ट सेट',
    fabric: '100% Cotton',
    fabricHi: '100% कॉटन',
  },
  {
    id: 'kids-2',
    name: 'Kids Party Dress',
    nameHi: 'बच्चों की पार्टी ड्रेस',
    category: 'kids',
    subCategory: '4-7',
    price: 899,
    priceRange: 'budget',
    image: '/images/products/kids-party-1.jpg',
    images: ['/images/products/kids-party-1.jpg'],
    isBestSeller: true,
    description: 'Beautiful party dress for kids',
    descriptionHi: 'बच्चों के लिए सुंदर पार्टी ड्रेस',
    fabric: 'Cotton Blend',
    fabricHi: 'कॉटन ब्लेंड',
  },
  {
    id: 'kids-3',
    name: 'Kids Ethnic Set',
    nameHi: 'बच्चों का एथनिक सेट',
    category: 'kids',
    subCategory: '8-12',
    price: 1299,
    priceRange: 'mid',
    image: '/images/products/kids-ethnic-1.jpg',
    images: ['/images/products/kids-ethnic-1.jpg'],
    isNewArrival: true,
    description: 'Traditional ethnic wear set for kids',
    descriptionHi: 'बच्चों के लिए पारंपरिक एथनिक वियर सेट',
    fabric: 'Silk Cotton',
    fabricHi: 'सिल्क कॉटन',
  },
];

export const getProductsByCategory = (category: string) => {
  return products.filter((p) => p.category === category);
};

export const getProductsBySubCategory = (category: string, subCategory: string) => {
  return products.filter((p) => p.category === category && p.subCategory === subCategory);
};

export const getNewArrivals = () => {
  return products.filter((p) => p.isNewArrival);
};

export const getBestSellers = () => {
  return products.filter((p) => p.isBestSeller);
};
