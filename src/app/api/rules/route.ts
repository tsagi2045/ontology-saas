import { NextRequest, NextResponse } from 'next/server';
import { query, execute, queryOne, rowToRule } from '@/lib/db';
import { ensureInitialized } from '../init/route';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  await ensureInitialized();
  const rows = await query('SELECT * FROM inference_rules ORDER BY priority DESC');
  const items = rows.map(rowToRule);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  await ensureInitialized();
  const body = await request.json();

  const id = body.id || uuidv4();
  await execute(
    'INSERT INTO inference_rules (id, name, conditions, actions, is_active, priority, description) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [id, body.name, JSON.stringify(body.conditions || []), JSON.stringify(body.actions || []), body.isActive ?? true, body.priority || 0, body.description || null]
  );

  const created = await queryOne('SELECT * FROM inference_rules WHERE id = $1', [id]);
  return NextResponse.json({ success: true, data: rowToRule(created) });
}
