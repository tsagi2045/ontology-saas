import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute, rowToRule } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  await execute(
    'UPDATE inference_rules SET name = $1, conditions = $2, actions = $3, is_active = $4, priority = $5, description = $6 WHERE id = $7',
    [body.name, JSON.stringify(body.conditions || []), JSON.stringify(body.actions || []), body.isActive ?? true, body.priority || 0, body.description || null, id]
  );

  const updated = await queryOne('SELECT * FROM inference_rules WHERE id = $1', [id]);
  return NextResponse.json({ success: true, data: rowToRule(updated) });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await execute('DELETE FROM inference_rules WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
