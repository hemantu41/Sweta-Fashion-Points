'use client';

import { useEffect } from 'react';
import { trackViewItemList } from '@/lib/analytics';

interface TrackerItem {
  itemId: string;
  itemName: string;
  price: number;
}

interface Props {
  itemListName: string;
  items: TrackerItem[];
}

export default function CategoryViewTracker({ itemListName, items }: Props) {
  useEffect(() => {
    if (items.length === 0) return;
    trackViewItemList({ itemListName, items });
  }, [itemListName, items]);

  return null;
}
