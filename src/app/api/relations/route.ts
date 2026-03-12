import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute, rowToRelation } from '@/lib/db';
import { ensureInitialized } from '../init/route';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  await ensureInitialized();
  const rows = await query('SELECT * FROM relations ORDER BY created_at DESC');
  const items = rows.map(rowToRelation);
  return NextResponse.json({ items, total: items.length });
}

export async function POST(request: NextRequest) {
  await ensureInitialized();
  const body = await request.json();

  // Duplicate check
  const existing = await queryOne(
    'SELECT id FROM relations WHERE source_id = $1 AND target_id = $2 AND predicate_id = $3',
    [body.sourceId, body.targetId, body.predicateId]
  );
  if (existing) {
    return NextResponse.json({ error: '이미 동일한 관계가 존재합니다', duplicate: true }, { status: 409 });
  }

  const id = uuidv4();
  await execute(
    'INSERT INTO relations (id, source_id, target_id, predicate_id, properties, weight) VALUES ($1, $2, $3, $4, $5, $6)',
    [id, body.sourceId, body.targetId, body.predicateId, JSON.stringify(body.properties || {}), body.weight ?? 1.0]
  );

  const relation = await queryOne('SELECT * FROM relations WHERE id = $1', [id]);
  return NextResponse.json({ success: true, data: rowToRelation(relation) });
}
