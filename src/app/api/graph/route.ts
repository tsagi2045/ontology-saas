import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized } from '../init/route';
import { getGraphData } from '@/lib/graph-utils';

export async function GET(request: NextRequest) {
  await ensureInitialized();
  const { searchParams } = new URL(request.url);
  const classFilter = searchParams.get('classes')?.split(',').filter(Boolean);
  const predicateFilter = searchParams.get('predicates')?.split(',').filter(Boolean);
  const layoutKey = searchParams.get('layoutKey') || undefined;

  const data = await getGraphData(classFilter, predicateFilter, layoutKey);
  return NextResponse.json(data);
}
