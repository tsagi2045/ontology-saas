import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute, rowToEntity } from '@/lib/db';
import { ensureInitialized } from '../init/route';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  await ensureInitialized();
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '50');

  let queryStr = 'SELECT * FROM entities';
  let countStr = 'SELECT COUNT(*) as cnt FROM entities';
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (classId) {
    conditions.push(`class_id = $${paramIdx++}`);
    params.push(classId);
  }
  if (search) {
    conditions.push(`name LIKE $${paramIdx++}`);
    params.push(`%${search}%`);
  }
  if (conditions.length > 0) {
    const where = ' WHERE ' + conditions.join(' AND ');
    queryStr += where;
    countStr += where;
  }

  const countResult = await queryOne<{ cnt: number }>(countStr, params);
  const total = countResult?.cnt || 0;

  queryStr += ` ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  params.push(pageSize, (page - 1) * pageSize);

  const rows = await query(queryStr, params);
  const items = rows.map(rowToEntity);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  await ensureInitialized();
  const body = await request.json();

  const id = uuidv4();
  await execute(
    'INSERT INTO entities (id, name, class_id, properties, description, color) VALUES ($1, $2, $3, $4, $5, $6)',
    [id, body.name, body.classId, JSON.stringify(body.properties || {}), body.description || null, body.color || null]
  );

  const entity = await queryOne('SELECT * FROM entities WHERE id = $1', [id]);
  return NextResponse.json({ success: true, data: rowToEntity(entity) });
}
