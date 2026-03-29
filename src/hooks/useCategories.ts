'use client';

import { useState, useEffect } from 'react';

export interface CategoryNode {
  id: string;
  name: string;
  name_hindi: string | null;
  slug: string;
  level: number;
  icon: string | null;
  image_url: string | null;
  display_order: number;
  is_occasion: boolean;
  product_count: number;
  children: CategoryNode[];
}

// Module-level cache — shared across all consumers, never double-fetches
let _cache: CategoryNode[] | null = null;
let _inflight: Promise<CategoryNode[]> | null = null;

async function fetchCategoryTree(): Promise<CategoryNode[]> {
  if (_cache) return _cache;
  if (!_inflight) {
    _inflight = fetch('/api/categories?tree=true')
      .then(r => r.json())
      .then(body => {
        _cache = (body.data as CategoryNode[]) ?? [];
        _inflight = null;
        return _cache;
      })
      .catch(() => {
        _inflight = null;
        return [];
      });
  }
  return _inflight;
}

export function useCategories() {
  const [tree, setTree] = useState<CategoryNode[]>(_cache ?? []);
  const [loading, setLoading] = useState<boolean>(!_cache);

  useEffect(() => {
    if (_cache) {
      setTree(_cache);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchCategoryTree().then(data => {
      setTree(data);
      setLoading(false);
    });
  }, []);

  return { tree, loading };
}
