import { NextRequest, NextResponse } from 'next/server';
import {
  CATEGORIES,
  getLevel1Categories,
  getLevel2Categories,
  getLevel3Categories,
} from '@/lib/categories';

// GET /api/categories?level=1
// GET /api/categories?parentId=women
// GET /api/categories?parentId=sarees&targetLevel=3
// GET /api/categories            → full tree
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level');
  const parentId = searchParams.get('parentId');

  const headers = {
    'Cache-Control': 'public, s-maxage=3600',
  };

  if (level === '1') {
    return NextResponse.json(
      { categories: getLevel1Categories() },
      { headers },
    );
  }

  if (parentId) {
    const targetLevel = parseInt(searchParams.get('targetLevel') ?? '2', 10);
    const cats =
      targetLevel === 3
        ? getLevel3Categories(parentId)
        : getLevel2Categories(parentId);
    return NextResponse.json({ categories: cats }, { headers });
  }

  // Return full tree: L1 → L2 → L3
  const l1 = getLevel1Categories();
  const tree = l1.map((cat) => ({
    ...cat,
    children: getLevel2Categories(cat.id).map((l2) => ({
      ...l2,
      children: getLevel3Categories(l2.id),
    })),
  }));

  return NextResponse.json({ tree, total: CATEGORIES.length }, { headers });
}
