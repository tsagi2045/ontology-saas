import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized } from '../../../init/route';
import { getNeighbors } from '@/lib/graph-utils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureInitialized();
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const depth = parseInt(searchParams.get('depth') || '1');

  const data = await getNeighbors(id, Math.min(depth, 3));
  return NextResponse.json(data);
}
