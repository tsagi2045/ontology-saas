import { NextRequest, NextResponse } from 'next/server';
import { query, execute, queryOne, rowToPredicate } from '@/lib/db';

export async function GET() {
  const rows = await query('SELECT * FROM predicate_types');
  const items = rows.map(rowToPredicate);
  return NextResponse.json({ items }, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  await execute(
    'INSERT INTO predicate_types (id, name, inverse_id, source_class_ids, target_class_ids, description) VALUES ($1, $2, $3, $4, $5, $6)',
    [body.id, body.name, body.inverseId || null, JSON.stringify(body.sourceClassIds || []), JSON.stringify(body.targetClassIds || []), body.description || null]
  );

  const created = await queryOne('SELECT * FROM predicate_types WHERE id = $1', [body.id]);
  return NextResponse.json({ success: true, data: rowToPredicate(created) });
}
