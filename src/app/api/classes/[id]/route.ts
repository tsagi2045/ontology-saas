import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute, rowToClass } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  await execute(
    'UPDATE ontology_classes SET name = $1, parent_class_id = $2, required_properties = $3, optional_properties = $4, description = $5, icon = $6, color = $7 WHERE id = $8',
    [body.name, body.parentClassId || null, JSON.stringify(body.requiredProperties || []), JSON.stringify(body.optionalProperties || []), body.description || null, body.icon || null, body.color || '#6B7280', id]
  );

  const updated = await queryOne('SELECT * FROM ontology_classes WHERE id = $1', [id]);
  return NextResponse.json({ success: true, data: rowToClass(updated) });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await execute('UPDATE ontology_classes SET parent_class_id = NULL WHERE parent_class_id = $1', [id]);
  await execute('DELETE FROM ontology_classes WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
