// ─── PDF Utilities — shared types, styles, helpers ──────────────────────────

export interface LabelOrderData {
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_mobile: string;
  pincode: string;
  district: string;
  items: Array<{ name: string; quantity: number; price: number; size?: string }>;
  total: number;
  payment_mode: string;
  created_at: string;
  weight_kg?: number;
}

export interface InvoiceOrderData extends LabelOrderData {
  invoice_number?: string;
  seller_gstin?: string;
  seller_name?: string;
  seller_address?: string;
}

export const SELLER_INFO = {
  name: 'INSTA FASHION POINTS',
  gstin: '10AABCU9603R1ZM',
  address: 'Amas, Gaya, Bihar 824219',
  state: 'Bihar',
  stateCode: '10',
  phone: '+91 82941XXXXX',
  pan: 'AABCU9603R',
};

export const BRAND_COLOR = '#059669';

// HSN codes for common fashion products
export function getHSNCode(productName: string): string {
  const lower = productName.toLowerCase();
  if (lower.includes('saree') || lower.includes('silk')) return '5007';
  if (lower.includes('kurta') || lower.includes('cotton')) return '6109';
  if (lower.includes('lehenga') || lower.includes('dress')) return '6204';
  if (lower.includes('dupatta') || lower.includes('scarf')) return '6214';
  if (lower.includes('palazzo') || lower.includes('pant')) return '6204';
  if (lower.includes('kid') || lower.includes('child')) return '6209';
  return '6117'; // default: knitted clothing accessories
}

// Number to words (Indian system) for invoice
export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = 'Rupees ' + convert(rupees);
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
  return result + ' Only';
}
