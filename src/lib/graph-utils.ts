import { query, rowToEntity, rowToRelation, rowToClass, rowToPredicate } from './db';
import type { GraphNode, GraphEdge } from '@/types';

export async function getGraphData(classFilter?: string[], predicateFilter?: string[], layoutKey?: string) {
  let entityQuery = 'SELECT * FROM entities';
  const entityParams: any[] = [];
  if (classFilter && classFilter.length > 0) {
    const placeholders = classFilter.map((_, i) => `$${i + 1}`).join(',');
    entityQuery += ` WHERE class_id IN (${placeholders})`;
    entityParams.push(...classFilter);
  }

  const entitiesRows = await query(entityQuery, entityParams);
  const entities = entitiesRows.map(rowToEntity);
  const classesRows = await query('SELECT * FROM ontology_classes');
  const classes = classesRows.map(rowToClass);
  const predicatesRows = await query('SELECT * FROM predicate_types');
  const predicates = predicatesRows.map(rowToPredicate);

  const entityIds = new Set(entities.map(e => e.id));

  let relationQuery = 'SELECT * FROM relations';
  const relationParams: any[] = [];
  if (predicateFilter && predicateFilter.length > 0) {
    const placeholders = predicateFilter.map((_, i) => `$${i + 1}`).join(',');
    relationQuery += ` WHERE predicate_id IN (${placeholders})`;
    relationParams.push(...predicateFilter);
  }

  const allRelationsRows = await query(relationQuery, relationParams);
  const allRelations = allRelationsRows.map(rowToRelation);
  const relations = allRelations.filter(r => entityIds.has(r.sourceId) && entityIds.has(r.targetId));

  const nodes: GraphNode[] = entities.map((entity, index) => {
    const classInfo = classes.find(c => c.id === entity.classId);
    const savedPos = layoutKey && entity.positions ? entity.positions[layoutKey] : null;
    const hasSavedPosition = savedPos != null;
    const cols = Math.ceil(Math.sqrt(entities.length));
    const row = Math.floor(index / cols);
    const col = index % cols;

    return {
      id: entity.id,
      type: 'entityNode',
      position: hasSavedPosition
        ? { x: savedPos.x, y: savedPos.y }
        : { x: 100 + col * 280 + (row % 2) * 60, y: 100 + row * 180 },
      data: {
        entity,
        ontologyClass: classInfo || { id: '', name: '알 수 없음', color: '#6B7280', requiredProperties: [], optionalProperties: [] },
        hasSavedPosition,
      },
    };
  });

  const edges: GraphEdge[] = relations.map(relation => {
    const predicate = predicates.find(p => p.id === relation.predicateId);
    const isInferred = relation.properties?.inferred === true;

    return {
      id: relation.id,
      source: relation.sourceId,
      target: relation.targetId,
      type: 'relationEdge',
      data: {
        relation,
        predicate: predicate || { id: '', name: '알 수 없음', sourceClassIds: [], targetClassIds: [] },
      },
      label: predicate?.name || relation.predicateId,
      animated: isInferred,
    };
  });

  return { nodes, edges, classes, predicates };
}

export async function getNeighbors(entityId: string, depth: number = 1) {
  const visited = new Set<string>();
  const entities: any[] = [];
  const relations: any[] = [];

  async function traverse(id: string, currentDepth: number) {
    if (currentDepth > depth || visited.has(id)) return;
    visited.add(id);

    const entity = await query('SELECT * FROM entities WHERE id = $1', [id]);
    if (entity[0]) entities.push(rowToEntity(entity[0]));

    const outgoing = (await query('SELECT * FROM relations WHERE source_id = $1', [id])).map(rowToRelation);
    const incoming = (await query('SELECT * FROM relations WHERE target_id = $1', [id])).map(rowToRelation);

    for (const rel of [...outgoing, ...incoming]) {
      relations.push(rel);
      const neighborId = rel.sourceId === id ? rel.targetId : rel.sourceId;
      await traverse(neighborId, currentDepth + 1);
    }
  }

  await traverse(entityId, 0);

  return { entities, relations: [...new Map(relations.map(r => [r.id, r])).values()] };
}
