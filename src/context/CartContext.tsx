'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { Product } from '@/data/products';
import { products as allProducts } from '@/data/products';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

type CartAction =
  | { type: 'ADD'; product: Product }
  | { type: 'REMOVE'; productId: string }
  | { type: 'SET_QTY'; productId: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'INIT'; items: CartItem[] };

function reducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find(i => i.product.id === action.product.id);
      if (existing) {
        return state.map(i =>
          i.product.id === action.product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...state, { product: action.product, quantity: 1 }];
    }
    case 'REMOVE':
      return state.filter(i => i.product.id !== action.productId);
    case 'SET_QTY':
      if (action.quantity <= 0) return state.filter(i => i.product.id !== action.productId);
      return state.map(i =>
        i.product.id === action.productId ? { ...i, quantity: action.quantity } : i
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
        const parsed = JSON.parse(stored) as { id: string; qty: number }[];
        const restored = parsed
          .map(({ id, qty }) => {
            const product = allProducts.find(p => p.id === id);
            return product ? { product, quantity: qty } : null;
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
      JSON.stringify(items.map(i => ({ id: i.product.id, qty: i.quantity })))
    );
  }, [items]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart: (product) => dispatch({ type: 'ADD', product }),
      removeFromCart: (productId) => dispatch({ type: 'REMOVE', productId }),
      updateQuantity: (productId, quantity) => dispatch({ type: 'SET_QTY', productId, quantity }),
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
