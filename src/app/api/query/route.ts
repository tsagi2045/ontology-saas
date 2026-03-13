import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, rowToEntity, rowToRelation } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { startClassId, filters, depth } = body;

  const classIds = await getClassAndSubclasses(startClassId);
  const placeholders = classIds.map((_, i) => `$${i + 1}`).join(',');
  const entitiesRows = await query(`SELECT * FROM entities WHERE class_id IN (${placeholders})`, classIds);
  let entities = entitiesRows.map(rowToEntity);

  // Apply property filters
  for (const filter of (filters || [])) {
    if (filter.type === 'property' && filter.propertyName) {
      entities = entities.filter(e => {
        const val = e.properties[filter.propertyName];
        if (val === undefined) return false;
        switch (filter.operator) {
          case 'eq': return val == filter.value;
          case 'contains': return String(val).includes(String(filter.value));
          case 'gt': return Number(val) > Number(filter.value);
          case 'gte': return Number(val) >= Number(filter.value);
          case 'lt': return Number(val) < Number(filter.value);
          case 'lte': return Number(val) <= Number(filter.value);
          default: return true;
        }
      });
    }
  }

  const entityIds = new Set(entities.map(e => e.id));
  const relations: any[] = [];

  if (depth > 0) {
    for (const entity of [...entities]) {
      const rels = (await query('SELECT * FROM relations WHERE source_id = $1 OR target_id = $2', [entity.id, entity.id])).map(rowToRelation);
      for (const rel of rels) {
        relations.push(rel);
        const neighborId = rel.sourceId === entity.id ? rel.targetId : rel.sourceId;
        if (!entityIds.has(neighborId)) {
          const neighbor = await queryOne('SELECT * FROM entities WHERE id = $1', [neighborId]);
          if (neighbor) {
            entities.push(rowToEntity(neighbor));
            entityIds.add(neighborId);
          }
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    data: { entities, relations: [...new Map(relations.map(r => [r.id, r])).values()] },
  });
}

async function getClassAndSubclasses(classId: string): Promise<string[]> {
  const result = [classId];
  const children = await query<{ id: string }>('SELECT id FROM ontology_classes WHERE parent_class_id = $1', [classId]);
  for (const child of children) {
    result.push(...await getClassAndSubclasses(child.id));
  }
  return result;
}
