declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

function canTrack(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

export function trackViewItem({
  itemId,
  itemName,
  category,
  price,
}: {
  itemId: string;
  itemName: string;
  category?: string;
  price: number;
}) {
  if (!canTrack()) return;
  window.gtag('event', 'view_item', {
    currency: 'INR',
    value: price,
    items: [{ item_id: itemId, item_name: itemName, item_category: category, price, quantity: 1 }],
  });
}

export function trackViewItemList({
  itemListName,
  items,
}: {
  itemListName: string;
  items: { itemId: string; itemName: string; price: number }[];
}) {
  if (!canTrack()) return;
  window.gtag('event', 'view_item_list', {
    item_list_name: itemListName,
    items: items.map(i => ({ item_id: i.itemId, item_name: i.itemName, price: i.price })),
  });
}

export function trackAddToCart({
  itemId,
  itemName,
  category,
  price,
  quantity,
}: {
  itemId: string;
  itemName: string;
  category?: string;
  price: number;
  quantity: number;
}) {
  if (!canTrack()) return;
  window.gtag('event', 'add_to_cart', {
    currency: 'INR',
    value: price * quantity,
    items: [{ item_id: itemId, item_name: itemName, item_category: category, price, quantity }],
  });
}

export function trackRemoveFromCart({
  itemId,
  itemName,
  price,
  quantity,
}: {
  itemId: string;
  itemName: string;
  price: number;
  quantity: number;
}) {
  if (!canTrack()) return;
  window.gtag('event', 'remove_from_cart', {
    currency: 'INR',
    value: price * quantity,
    items: [{ item_id: itemId, item_name: itemName, price, quantity }],
  });
}

export function trackBeginCheckout({
  value,
  items,
}: {
  value: number;
  items: { itemId: string; itemName: string; price: number; quantity: number }[];
}) {
  if (!canTrack()) return;
  window.gtag('event', 'begin_checkout', {
    currency: 'INR',
    value,
    items: items.map(i => ({ item_id: i.itemId, item_name: i.itemName, price: i.price, quantity: i.quantity })),
  });
}

export function trackPurchase({
  transactionId,
  value,
  shipping = 0,
  items,
}: {
  transactionId: string;
  value: number;
  shipping?: number;
  items: { itemId: string; itemName: string; price: number; quantity: number }[];
}) {
  if (!canTrack()) return;
  window.gtag('event', 'purchase', {
    transaction_id: transactionId,
    currency: 'INR',
    value,
    shipping,
    items: items.map(i => ({ item_id: i.itemId, item_name: i.itemName, price: i.price, quantity: i.quantity })),
  });
}

export function trackSellerSignup({ sellerId, city }: { sellerId: string; city?: string }) {
  if (!canTrack()) return;
  window.gtag('event', 'seller_signup', { seller_id: sellerId, city });
}

export function trackProductListed({ productId, category }: { productId: string; category?: string }) {
  if (!canTrack()) return;
  window.gtag('event', 'product_listed', { product_id: productId, category });
}

export function trackSearch({ searchTerm }: { searchTerm: string }) {
  if (!canTrack()) return;
  window.gtag('event', 'search', { search_term: searchTerm });
}
