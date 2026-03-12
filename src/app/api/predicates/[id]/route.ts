import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute, rowToPredicate } from '@/lib/db';
import { ensureInitialized } from '../../init/route';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureInitialized();
  const { id } = await params;
  const body = await request.json();

  await execute(
    'UPDATE predicate_types SET name = $1, inverse_id = $2, source_class_ids = $3, target_class_ids = $4, description = $5 WHERE id = $6',
    [body.name, body.inverseId || null, JSON.stringify(body.sourceClassIds || []), JSON.stringify(body.targetClassIds || []), body.description || null, id]
  );

  const updated = await queryOne('SELECT * FROM predicate_types WHERE id = $1', [id]);
  return NextResponse.json({ success: true, data: rowToPredicate(updated) });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureInitialized();
  const { id } = await params;
  await execute('DELETE FROM predicate_types WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
