import { NextResponse } from 'next/server';
import { query, rowToEntity, rowToRelation, rowToPredicate } from '@/lib/db';

export async function GET() {

  const entities = (await query('SELECT * FROM entities')).map(rowToEntity);
  const relations = (await query('SELECT * FROM relations')).map(rowToRelation);
  const predicates = (await query('SELECT * FROM predicate_types')).map(rowToPredicate);

  const entityMap = new Map(entities.map(e => [e.id, e]));
  const predicateMap = new Map(predicates.map(p => [p.id, p]));

  const triples = relations.map(r => ({
    subject: entityMap.get(r.sourceId)?.name || r.sourceId,
    predicate: predicateMap.get(r.predicateId)?.name || r.predicateId,
    object: entityMap.get(r.targetId)?.name || r.targetId,
    subjectId: r.sourceId,
    predicateId: r.predicateId,
    objectId: r.targetId,
  }));

  return NextResponse.json({ triples });
}
