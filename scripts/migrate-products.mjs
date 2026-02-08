import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read environment variables
const envContent = readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1]] = match[2];
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Products from src/data/products.ts
const products = [
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
  {
    id: 'womens-1',
    name: 'Cotton Kurti',
    nameHi: 'कॉटन कुर्ती',
    category: 'womens',
    subCategory: 'daily',
    price: 699,
    originalPrice: 999,
    priceRange: 'budget',
    image: '',
    images: [],
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
  {
    id: 'kids-1',
    name: 'Kids Cotton Set',
    nameHi: 'बच्चों का कॉटन सेट',
    category: 'kids',
    subCategory: '4-7',
    price: 599,
    originalPrice: 899,
    priceRange: 'budget',
    image: '',
    images: [],
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

async function migrateProducts() {
  console.log('Starting product migration...\n');

  let successCount = 0;
  let failCount = 0;

  for (const product of products) {
    try {
      const { data, error } = await supabase
        .from('spf_productdetails')
        .insert({
          product_id: product.id,
          name: product.name,
          name_hi: product.nameHi,
          category: product.category,
          sub_category: product.subCategory,
          price: product.price,
          original_price: product.originalPrice,
          price_range: product.priceRange,
          description: product.description,
          description_hi: product.descriptionHi,
          fabric: product.fabric,
          fabric_hi: product.fabricHi,
          main_image: product.image,
          images: product.images,
          colors: product.colors,
          sizes: product.sizes,
          stock_quantity: 100, // Default stock
          is_new_arrival: product.isNewArrival || false,
          is_best_seller: product.isBestSeller || false,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed to migrate ${product.id}:`, error.message);
        failCount++;
      } else {
        console.log(`✅ Migrated: ${product.id} - ${product.name}`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Error migrating ${product.id}:`, err);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Migration Complete!');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📦 Total: ${products.length}`);
  console.log('='.repeat(60));
}

migrateProducts();
