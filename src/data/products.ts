export interface ProductColor {
  name: string;
  nameHi: string;
  hex: string;
}

export interface Seller {
  id: string;
  businessName: string;
  businessNameHi?: string;
  city?: string;
  state?: string;
  businessPhone?: string;
}

export interface Product {
  id: string;
  productId?: string;
  name: string;
  nameHi: string;
  category: 'mens' | 'womens' | 'sarees' | 'kids';
  subCategory: string;
  price: number;
  originalPrice?: number;
  priceRange: 'budget' | 'mid' | 'premium';
  image?: string; // Legacy field for compatibility
  mainImage?: string | null; // New field from database
  images: string[];
  colors?: ProductColor[];
  sizes?: string[];
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  description: string;
  descriptionHi: string;
  fabric?: string;
  fabricHi?: string;
  stockQuantity?: number;
  isActive?: boolean;
  sellerId?: string | null;
  seller?: Seller | null; // Seller information for multi-seller marketplace
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
  { id: 'jeans', name: 'Jeans', nameHi: 'जींस' },
  { id: 'shirts', name: 'Shirts', nameHi: 'शर्ट' },
  { id: 'tshirts', name: 'T-Shirts', nameHi: 'टी-शर्ट' },
  { id: 'ethnic', name: 'Ethnic/Festive', nameHi: 'एथनिक/फेस्टिव' },
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

// Products with Cloudinary images
export const products: Product[] = [
  // Men's Jeans
  {
    id: 'mens-jeans-1',
    name: 'Classic Blue Jeans',
    nameHi: 'क्लासिक ब्लू जींस',
    category: 'mens',
    subCategory: 'jeans',
    price: 1299,
    originalPrice: 1799,
    priceRange: 'mid',
    image: '3.1_y3tpdl',
    images: ['3.1_y3tpdl'],
    colors: [
      { name: 'Blue', nameHi: 'नीला', hex: '#3B82F6' },
      { name: 'Dark Blue', nameHi: 'गहरा नीला', hex: '#1E3A5F' },
    ],
    sizes: ['30', '32', '34', '36', '38'],
    isNewArrival: true,
    description: 'Classic fit blue jeans for everyday style',
    descriptionHi: 'रोज़मर्रा की स्टाइल के लिए क्लासिक फिट ब्लू जींस',
    fabric: 'Denim',
    fabricHi: 'डेनिम',
  },
  {
    id: 'mens-jeans-2',
    name: 'Slim Fit Jeans',
    nameHi: 'स्लिम फिट जींस',
    category: 'mens',
    subCategory: 'jeans',
    price: 1499,
    originalPrice: 2199,
    priceRange: 'mid',
    image: '3.2_awamro',
    images: ['3.2_awamro'],
    colors: [
      { name: 'Black', nameHi: 'काला', hex: '#111827' },
      { name: 'Navy', nameHi: 'नेवी', hex: '#1E3A8A' },
    ],
    sizes: ['30', '32', '34', '36', '38'],
    isBestSeller: true,
    description: 'Modern slim fit jeans with perfect stretch',
    descriptionHi: 'परफेक्ट स्ट्रेच के साथ मॉडर्न स्लिम फिट जींस',
    fabric: 'Stretch Denim',
    fabricHi: 'स्ट्रेच डेनिम',
  },
  {
    id: 'mens-jeans-3',
    name: 'Dark Wash Jeans',
    nameHi: 'डार्क वॉश जींस',
    category: 'mens',
    subCategory: 'jeans',
    price: 1399,
    originalPrice: 1999,
    priceRange: 'mid',
    image: '3.3_j5zgse',
    images: ['3.3_j5zgse'],
    colors: [
      { name: 'Dark Blue', nameHi: 'गहरा नीला', hex: '#1E3A5F' },
      { name: 'Charcoal', nameHi: 'चारकोल', hex: '#374151' },
    ],
    sizes: ['30', '32', '34', '36', '38'],
    description: 'Premium dark wash jeans for a polished look',
    descriptionHi: 'पॉलिश्ड लुक के लिए प्रीमियम डार्क वॉश जींस',
    fabric: 'Premium Denim',
    fabricHi: 'प्रीमियम डेनिम',
  },
  {
    id: 'mens-jeans-4',
    name: 'Casual Denim Jeans',
    nameHi: 'कैजुअल डेनिम जींस',
    category: 'mens',
    subCategory: 'jeans',
    price: 1199,
    originalPrice: 1699,
    priceRange: 'mid',
    image: '3.4_rlx0zi',
    images: ['3.4_rlx0zi'],
    colors: [
      { name: 'Blue', nameHi: 'नीला', hex: '#3B82F6' },
      { name: 'Grey', nameHi: 'ग्रे', hex: '#6B7280' },
    ],
    sizes: ['30', '32', '34', '36', '38'],
    description: 'Comfortable casual jeans for daily wear',
    descriptionHi: 'दैनिक पहनने के लिए आरामदायक कैजुअल जींस',
    fabric: 'Cotton Denim',
    fabricHi: 'कॉटन डेनिम',
  },
  {
    id: 'mens-jeans-5',
    name: 'Stylish Blue Jeans',
    nameHi: 'स्टाइलिश ब्लू जींस',
    category: 'mens',
    subCategory: 'jeans',
    price: 1599,
    originalPrice: 2299,
    priceRange: 'mid',
    image: 'kiwihug-GH1ZyBYVWYI-unsplash_tfl6oc',
    images: ['kiwihug-GH1ZyBYVWYI-unsplash_tfl6oc'],
    colors: [
      { name: 'Blue', nameHi: 'नीला', hex: '#3B82F6' },
      { name: 'Indigo', nameHi: 'इंडिगो', hex: '#4F46E5' },
    ],
    sizes: ['30', '32', '34', '36', '38'],
    isNewArrival: true,
    description: 'Trendy stylish jeans for a fashionable look',
    descriptionHi: 'फैशनेबल लुक के लिए ट्रेंडी स्टाइलिश जींस',
    fabric: 'Premium Denim',
    fabricHi: 'प्रीमियम डेनिम',
  },

  // Men's Shirts
  {
    id: 'mens-shirt-1',
    name: 'Formal White Shirt',
    nameHi: 'फॉर्मल व्हाइट शर्ट',
    category: 'mens',
    subCategory: 'shirts',
    price: 999,
    originalPrice: 1499,
    priceRange: 'budget',
    image: '2.1.0_vagdum',
    images: ['2.1.0_vagdum'],
    colors: [
      { name: 'White', nameHi: 'सफेद', hex: '#F9FAFB' },
      { name: 'Light Blue', nameHi: 'हल्का नीला', hex: '#BFDBFE' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    isBestSeller: true,
    description: 'Classic formal white shirt for office wear',
    descriptionHi: 'ऑफिस वियर के लिए क्लासिक फॉर्मल व्हाइट शर्ट',
    fabric: 'Pure Cotton',
    fabricHi: 'शुद्ध कॉटन',
  },
  {
    id: 'mens-shirt-2',
    name: 'Casual Check Shirt',
    nameHi: 'कैजुअल चेक शर्ट',
    category: 'mens',
    subCategory: 'shirts',
    price: 1199,
    originalPrice: 1799,
    priceRange: 'mid',
    image: '2.1.1_bvtqpu',
    images: ['2.1.1_bvtqpu'],
    colors: [
      { name: 'Blue Check', nameHi: 'नीला चेक', hex: '#93C5FD' },
      { name: 'Green Check', nameHi: 'हरा चेक', hex: '#86EFAC' },
      { name: 'Pink Check', nameHi: 'गुलाबी चेक', hex: '#F9A8D4' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    isNewArrival: true,
    description: 'Stylish casual check shirt for everyday wear',
    descriptionHi: 'रोज़मर्रा के पहनने के लिए स्टाइलिश कैजुअल चेक शर्ट',
    fabric: 'Cotton Blend',
    fabricHi: 'कॉटन ब्लेंड',
  },

  // Men's T-Shirts
  {
    id: 'mens-tshirt-1',
    name: 'Cotton Round Neck T-Shirt',
    nameHi: 'कॉटन राउंड नेक टी-शर्ट',
    category: 'mens',
    subCategory: 'tshirts',
    price: 599,
    originalPrice: 899,
    priceRange: 'budget',
    image: '2.3_u1iyzf',
    images: ['2.3_u1iyzf'],
    colors: [
      { name: 'White', nameHi: 'सफेद', hex: '#F9FAFB' },
      { name: 'Black', nameHi: 'काला', hex: '#111827' },
      { name: 'Navy', nameHi: 'नेवी', hex: '#1E3A8A' },
      { name: 'Grey', nameHi: 'ग्रे', hex: '#6B7280' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    isBestSeller: true,
    description: 'Comfortable cotton t-shirt for casual wear',
    descriptionHi: 'कैजुअल वियर के लिए आरामदायक कॉटन टी-शर्ट',
    fabric: '100% Cotton',
    fabricHi: '100% कॉटन',
  },

  // Sarees
  {
    id: 'saree-1',
    name: 'Traditional Silk Saree',
    nameHi: 'पारंपरिक सिल्क साड़ी',
    category: 'sarees',
    subCategory: 'party',
    price: 2999,
    originalPrice: 4499,
    priceRange: 'mid',
    image: 'bulbul-ahmed-SiQTqnp-qd8-unsplash_g8merb',
    images: ['bulbul-ahmed-SiQTqnp-qd8-unsplash_g8merb'],
    colors: [
      { name: 'Red', nameHi: 'लाल', hex: '#DC2626' },
      { name: 'Maroon', nameHi: 'मैरूनी', hex: '#7F1D1D' },
      { name: 'Gold', nameHi: 'सोनेरी', hex: '#D97706' },
    ],
    sizes: ['Free Size'],
    isBestSeller: true,
    description: 'Beautiful traditional silk saree for special occasions',
    descriptionHi: 'विशेष अवसरों के लिए सुंदर पारंपरिक सिल्क साड़ी',
    fabric: 'Pure Silk',
    fabricHi: 'शुद्ध सिल्क',
  },
  {
    id: 'saree-2',
    name: 'Designer Party Saree',
    nameHi: 'डिज़ाइनर पार्टी साड़ी',
    category: 'sarees',
    subCategory: 'party',
    price: 3499,
    originalPrice: 5499,
    priceRange: 'premium',
    image: '4.1_m1opau',
    images: ['4.1_m1opau'],
    colors: [
      { name: 'Navy', nameHi: 'नेवी', hex: '#1E3A8A' },
      { name: 'Wine Red', nameHi: 'वाइन रेड', hex: '#7F1D1D' },
      { name: 'Emerald', nameHi: 'एमरेल्ड', hex: '#065F46' },
    ],
    sizes: ['Free Size'],
    isNewArrival: true,
    description: 'Elegant designer saree for parties and events',
    descriptionHi: 'पार्टियों और इवेंट्स के लिए एलिगेंट डिज़ाइनर साड़ी',
    fabric: 'Georgette Silk',
    fabricHi: 'जॉर्जेट सिल्क',
  },
  {
    id: 'saree-3',
    name: 'Classic Cotton Saree',
    nameHi: 'क्लासिक कॉटन साड़ी',
    category: 'sarees',
    subCategory: 'daily',
    price: 1299,
    originalPrice: 1799,
    priceRange: 'mid',
    image: 'Sarees_t3i6wt',
    images: ['Sarees_t3i6wt'],
    colors: [
      { name: 'Blue', nameHi: 'नीला', hex: '#3B82F6' },
      { name: 'Pink', nameHi: 'गुलाबी', hex: '#EC4899' },
      { name: 'Yellow', nameHi: 'पीला', hex: '#EAB308' },
    ],
    sizes: ['Free Size'],
    description: 'Comfortable cotton saree for daily wear',
    descriptionHi: 'दैनिक पहनने के लिए आरामदायक कॉटन साड़ी',
    fabric: 'Pure Cotton',
    fabricHi: 'शुद्ध कॉटन',
  },

  // Women's
  {
    id: 'womens-1',
    name: 'Cotton Kurti',
    nameHi: 'कॉटन कुर्ती',
    category: 'womens',
    subCategory: 'daily',
    price: 699,
    originalPrice: 999,
    priceRange: 'budget',
    image: 'bulbul-ahmed-SiQTqnp-qd8-unsplash_g8merb', // TEMPORARY: Using saree image as placeholder
    images: ['bulbul-ahmed-SiQTqnp-qd8-unsplash_g8merb'],
    colors: [
      { name: 'Blue', nameHi: 'नीला', hex: '#3B82F6' },
      { name: 'Pink', nameHi: 'गुलाबी', hex: '#EC4899' },
      { name: 'Yellow', nameHi: 'पीला', hex: '#EAB308' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Comfortable cotton kurti for everyday style',
    descriptionHi: 'रोज़मर्रा की स्टाइल के लिए आरामदायक कॉटन कुर्ती',
    fabric: 'Pure Cotton',
    fabricHi: 'शुद्ध कॉटन',
  },

  // Kids
  {
    id: 'kids-1',
    name: 'Kids Cotton Set',
    nameHi: 'बच्चों का कॉटन सेट',
    category: 'kids',
    subCategory: '4-7',
    price: 599,
    originalPrice: 899,
    priceRange: 'budget',
    image: '2.3_u1iyzf', // TEMPORARY: Using t-shirt image as placeholder
    images: ['2.3_u1iyzf'],
    colors: [
      { name: 'Navy', nameHi: 'नेवी', hex: '#1E3A8A' },
      { name: 'Grey', nameHi: 'ग्रे', hex: '#6B7280' },
      { name: 'Red', nameHi: 'लाल', hex: '#DC2626' },
    ],
    sizes: ['4-6Y', '6-8Y', '8-10Y'],
    description: 'Comfortable cotton set for kids',
    descriptionHi: 'बच्चों के लिए आरामदायक कॉटन सेट',
    fabric: '100% Cotton',
    fabricHi: '100% कॉटन',
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
