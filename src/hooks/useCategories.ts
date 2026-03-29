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

// Module-level cache — shared across all consumers; expires every 2 minutes
// so admin changes propagate to navbar + seller dashboard on the next fetch cycle.
const CACHE_TTL_MS = 2 * 60 * 1000;
let _cache: CategoryNode[] | null = null;
let _cacheAt: number = 0;
let _inflight: Promise<CategoryNode[]> | null = null;

function isCacheValid(): boolean {
  return _cache !== null && Date.now() - _cacheAt < CACHE_TTL_MS;
}

async function fetchCategoryTree(): Promise<CategoryNode[]> {
  if (isCacheValid()) return _cache!;
  if (!_inflight) {
    _inflight = fetch('/api/categories?tree=true')
      .then(r => r.json())
      .then(body => {
        _cache = (body.data as CategoryNode[]) ?? [];
        _cacheAt = Date.now();
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
    if (isCacheValid()) {
      setTree(_cache!);
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
