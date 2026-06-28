'use client';

import { useEffect } from 'react';
import { trackViewItem } from '@/lib/analytics';

interface Props {
  itemId: string;
  itemName: string;
  category?: string;
  price: number;
}

export default function ProductViewTracker({ itemId, itemName, category, price }: Props) {
  useEffect(() => {
    trackViewItem({ itemId, itemName, category, price });
  }, [itemId, itemName, category, price]);

  return null;
}
