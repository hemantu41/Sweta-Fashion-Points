'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { Product } from '@/data/products';
import { products as allProducts } from '@/data/products';

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
  const [items, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    const stored = localStorage.getItem('sweta_cart');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { id: string; qty: number; size?: string }[];
        const restored = parsed
          .map(({ id, qty, size }) => {
            const product = allProducts.find(p => p.id === id);
            return product ? { product, quantity: qty, ...(size !== undefined ? { size } : {}) } : null;
          })
          .filter((item): item is CartItem => item !== null);
        if (restored.length > 0) dispatch({ type: 'INIT', items: restored });
      } catch {
        // ignore invalid data
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'sweta_cart',
      JSON.stringify(items.map(i => ({ id: i.product.id, qty: i.quantity, size: i.size })))
    );
  }, [items]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart: (product, size) => dispatch({ type: 'ADD', product, size }),
      removeFromCart: (productId, size) => dispatch({ type: 'REMOVE', productId, size }),
      updateQuantity: (productId, quantity, size) => dispatch({ type: 'SET_QTY', productId, quantity, size }),
      clearCart: () => dispatch({ type: 'CLEAR' }),
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
