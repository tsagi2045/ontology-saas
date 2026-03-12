import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute, rowToRelation } from '@/lib/db';
import { ensureInitialized } from '../../init/route';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureInitialized();
  const { id } = await params;
  const relation = await queryOne('SELECT * FROM relations WHERE id = $1', [id]);
  if (!relation) return NextResponse.json({ error: '관계를 찾을 수 없습니다' }, { status: 404 });
  return NextResponse.json({ success: true, data: rowToRelation(relation) });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureInitialized();
  const { id } = await params;
  await execute('DELETE FROM relations WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
