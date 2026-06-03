'use client';

import { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import type { Product } from '@/data/products';
import { useAuth } from '@/context/AuthContext';

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size?: string) => void;
  removeFromCart: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

type CartAction =
  | { type: 'ADD'; product: Product; size?: string }
  | { type: 'REMOVE'; productId: string; size?: string }
  | { type: 'SET_QTY'; productId: string; quantity: number; size?: string }
  | { type: 'CLEAR' }
  | { type: 'INIT'; items: CartItem[] };

function matchItem(i: CartItem, productId: string, size?: string) {
  return i.product.id === productId && i.size === size;
}

function reducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find(i => matchItem(i, action.product.id, action.size));
      if (existing) {
        return state.map(i =>
          matchItem(i, action.product.id, action.size) ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...state, { product: action.product, quantity: 1, size: action.size }];
    }
    case 'REMOVE':
      return state.filter(i => !matchItem(i, action.productId, action.size));
    case 'SET_QTY':
      if (action.quantity <= 0) return state.filter(i => !matchItem(i, action.productId, action.size));
      return state.map(i =>
        matchItem(i, action.productId, action.size) ? { ...i, quantity: action.quantity } : i
      );
    case 'CLEAR':
      return [];
    case 'INIT':
      return action.items;
    default:
      return state;
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Scope the localStorage key to the logged-in user so carts are never shared.
  // Guest (not logged in) gets its own isolated key.
  const cartKey = user?.id ? `sweta_cart_${user.id}` : 'sweta_cart_guest';

  // Track the previous cartKey so the save effect can detect a key change
  // and skip writing stale items to the new user's storage slot.
  const prevCartKeyRef = useRef<string>('');

  const [items, dispatch] = useReducer(reducer, []);

  // ── Load ─────────────────────────────────────────────────────────────────────
  // Runs whenever the user logs in, logs out, or switches accounts.
  // Dispatches INIT with whatever is stored for that user (or empty array).
  useEffect(() => {
    let restoredItems: CartItem[] = [];

    const stored = localStorage.getItem(cartKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.product) {
          restoredItems = parsed
            .filter((e: { product?: Product; qty?: number }) => e.product && e.qty)
            .map(({ product, qty, size }: { product: Product; qty: number; size?: string }) => ({
              product,
              quantity: qty,
              ...(size !== undefined ? { size } : {}),
            }));
        }
      } catch {
        // ignore corrupted data
      }
    }

    dispatch({ type: 'INIT', items: restoredItems });
  }, [cartKey]);

  // ── Save ─────────────────────────────────────────────────────────────────────
  // Runs whenever items change.  On a cartKey change we skip one save cycle to
  // avoid writing the previous user's (now stale) items into the new user's slot
  // before INIT has had a chance to update `items`.
  useEffect(() => {
    if (prevCartKeyRef.current !== cartKey) {
      prevCartKeyRef.current = cartKey;
      return; // skip — items are still from the previous user
    }
    localStorage.setItem(
      cartKey,
      JSON.stringify(items.map(i => ({ product: i.product, qty: i.quantity, size: i.size })))
    );
  }, [items, cartKey]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart:      (product, size)           => dispatch({ type: 'ADD',     product, size }),
      removeFromCart: (productId, size)          => dispatch({ type: 'REMOVE',  productId, size }),
      updateQuantity: (productId, quantity, size) => dispatch({ type: 'SET_QTY', productId, quantity, size }),
      clearCart:      ()                         => dispatch({ type: 'CLEAR' }),
      totalItems,
      totalPrice,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
