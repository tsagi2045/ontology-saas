import { NextRequest, NextResponse } from 'next/server';
import { getGraphData } from '@/lib/graph-utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const classFilter = searchParams.get('classes')?.split(',').filter(Boolean);
  const predicateFilter = searchParams.get('predicates')?.split(',').filter(Boolean);
  const layoutKey = searchParams.get('layoutKey') || undefined;

  const data = await getGraphData(classFilter, predicateFilter, layoutKey);
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
  });
}
