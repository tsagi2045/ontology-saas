import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { ensureInitialized } from '../../../init/route';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureInitialized();
  const { id } = await params;
  const body = await request.json();

  const { x, y, layoutKey } = body;
  if (typeof layoutKey !== 'string') {
    return NextResponse.json({ error: 'layoutKey가 필요합니다' }, { status: 400 });
  }

  const row = await queryOne<{ positions: string }>('SELECT positions FROM entities WHERE id = $1', [id]);
  if (!row) return NextResponse.json({ error: '엔티티를 찾을 수 없습니다' }, { status: 404 });

  const positions = typeof row.positions === 'string' ? JSON.parse(row.positions || '{}') : (row.positions || {});
  if (x === null || y === null) {
    delete positions[layoutKey];
  } else {
    if (typeof x !== 'number' || typeof y !== 'number') {
      return NextResponse.json({ error: 'x, y는 숫자여야 합니다' }, { status: 400 });
    }
    positions[layoutKey] = { x, y };
  }

  await execute('UPDATE entities SET positions = $1 WHERE id = $2', [JSON.stringify(positions), id]);

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureInitialized();
  const { id } = await params;

  await execute("UPDATE entities SET positions = '{}' WHERE id = $1", [id]);

  return NextResponse.json({ success: true });
}
