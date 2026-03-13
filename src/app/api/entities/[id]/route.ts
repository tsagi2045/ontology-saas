import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute, rowToEntity, rowToRelation, rowToPredicate } from '@/lib/db';
import { ensureInitialized } from '../../init/route';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureInitialized();
  const { id } = await params;

  const entity = await queryOne('SELECT * FROM entities WHERE id = $1', [id]);
  if (!entity) return NextResponse.json({ error: '엔티티를 찾을 수 없습니다' }, { status: 404 });

  // Fetch relations, predicates, and related entity names in parallel
  const [relationsRows, predicatesRows, allEntitiesRows] = await Promise.all([
    query('SELECT * FROM relations WHERE source_id = $1 OR target_id = $2', [id, id]),
    query('SELECT * FROM predicate_types'),
    query('SELECT id, name FROM entities'),
  ]);
  const relations = relationsRows.map(rowToRelation);
  const predicates = predicatesRows.map(rowToPredicate);
  const entityNameMap: Record<string, string> = {};
  for (const row of allEntitiesRows) {
    entityNameMap[row.id] = row.name;
  }

  return NextResponse.json({
    success: true,
    data: {
      ...rowToEntity(entity),
      relations: relations.map(r => ({
        ...r,
        predicate: predicates.find(p => p.id === r.predicateId),
      })),
      relatedEntityNames: entityNameMap,
    },
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureInitialized();
  const { id } = await params;
  const body = await request.json();

  const existing = await queryOne('SELECT * FROM entities WHERE id = $1', [id]);
  if (!existing) return NextResponse.json({ error: '엔티티를 찾을 수 없습니다' }, { status: 404 });

  await execute(
    'UPDATE entities SET name = $1, class_id = $2, properties = $3, description = $4, color = $5, updated_at = NOW() WHERE id = $6',
    [
      body.name ?? (existing as any).name,
      body.classId ?? (existing as any).class_id,
      body.properties ? JSON.stringify(body.properties) : (existing as any).properties,
      body.description ?? (existing as any).description,
      body.color ?? (existing as any).color,
      id
    ]
  );

  const updated = await queryOne('SELECT * FROM entities WHERE id = $1', [id]);
  return NextResponse.json({ success: true, data: rowToEntity(updated) });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureInitialized();
  const { id } = await params;

  await execute('DELETE FROM relations WHERE source_id = $1 OR target_id = $2', [id, id]);
  await execute('DELETE FROM entities WHERE id = $1', [id]);

  return NextResponse.json({ success: true });
}
