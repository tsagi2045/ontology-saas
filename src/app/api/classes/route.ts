import { NextRequest, NextResponse } from 'next/server';
import { query, execute, queryOne, rowToClass } from '@/lib/db';

export async function GET() {
  const rows = await query('SELECT * FROM ontology_classes');
  const items = rows.map(rowToClass);
  return NextResponse.json({ items }, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  await execute(
    'INSERT INTO ontology_classes (id, name, parent_class_id, required_properties, optional_properties, description, icon, color) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    [body.id, body.name, body.parentClassId || null, JSON.stringify(body.requiredProperties || []), JSON.stringify(body.optionalProperties || []), body.description || null, body.icon || null, body.color || '#6B7280']
  );

  const created = await queryOne('SELECT * FROM ontology_classes WHERE id = $1', [body.id]);
  return NextResponse.json({ success: true, data: rowToClass(created) });
}
