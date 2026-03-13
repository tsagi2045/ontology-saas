import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ensureInitialized } from '../init/route';

export async function GET() {
  await ensureInitialized();

  // Run all queries in parallel
  const [entityCount, relationCount, classCount, activeRuleCount, classDistribution, recentEntitiesRows, recentLogs] = await Promise.all([
    queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM entities'),
    queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM relations'),
    queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM ontology_classes'),
    queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM inference_rules WHERE is_active = true'),
    query(`
      SELECT oc.name, oc.color, COUNT(e.id) as count
      FROM ontology_classes oc
      LEFT JOIN entities e ON e.class_id = oc.id
      GROUP BY oc.id, oc.name, oc.color
      HAVING COUNT(e.id) > 0
      ORDER BY count DESC
    `),
    query(`
      SELECT e.*, oc.name as class_name, oc.icon as class_icon
      FROM entities e
      JOIN ontology_classes oc ON e.class_id = oc.id
      ORDER BY e.created_at DESC LIMIT 10
    `),
    query('SELECT * FROM inference_logs ORDER BY executed_at DESC LIMIT 5'),
  ]);

  const recentEntities = recentEntitiesRows.map((row: any) => ({
    id: row.id,
    name: row.name,
    className: row.class_name,
    classIcon: row.class_icon,
    createdAt: row.created_at,
  }));

  return NextResponse.json({
    stats: {
      entityCount: entityCount?.cnt || 0,
      relationCount: relationCount?.cnt || 0,
      classCount: classCount?.cnt || 0,
      activeRuleCount: activeRuleCount?.cnt || 0,
    },
    classDistribution,
    recentEntities,
    recentLogs,
  });
}
