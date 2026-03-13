import { neon } from '@neondatabase/serverless';

export function getSQL() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다');
  }
  return neon(databaseUrl);
}

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const sql = getSQL();
  const rows = await sql.query(text, params);
  return rows as T[];
}

export async function queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

export async function execute(text: string, params: any[] = []): Promise<void> {
  const sql = getSQL();
  await sql.query(text, params);
}

export async function initializeDb() {
  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS ontology_classes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_class_id TEXT,
      required_properties TEXT DEFAULT '[]',
      optional_properties TEXT DEFAULT '[]',
      description TEXT,
      icon TEXT,
      color TEXT NOT NULL DEFAULT '#6B7280',
      FOREIGN KEY (parent_class_id) REFERENCES ontology_classes(id) ON DELETE SET NULL
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      class_id TEXT NOT NULL,
      properties TEXT DEFAULT '{}',
      description TEXT,
      color TEXT,
      positions TEXT DEFAULT '{}',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      FOREIGN KEY (class_id) REFERENCES ontology_classes(id) ON DELETE CASCADE
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS predicate_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      inverse_id TEXT,
      source_class_ids TEXT DEFAULT '[]',
      target_class_ids TEXT DEFAULT '[]',
      description TEXT
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS relations (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      predicate_id TEXT NOT NULL,
      properties TEXT DEFAULT '{}',
      weight REAL DEFAULT 1.0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      FOREIGN KEY (source_id) REFERENCES entities(id) ON DELETE CASCADE,
      FOREIGN KEY (target_id) REFERENCES entities(id) ON DELETE CASCADE,
      FOREIGN KEY (predicate_id) REFERENCES predicate_types(id) ON DELETE CASCADE
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS inference_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      conditions TEXT DEFAULT '[]',
      actions TEXT DEFAULT '[]',
      is_active BOOLEAN DEFAULT TRUE,
      priority INTEGER DEFAULT 0,
      description TEXT
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS inference_logs (
      id TEXT PRIMARY KEY,
      rule_id TEXT NOT NULL,
      rule_name TEXT NOT NULL,
      affected_entity_id TEXT,
      affected_entity_name TEXT,
      action_summary TEXT,
      executed_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`;

  // Create indexes (IF NOT EXISTS is supported in PostgreSQL 9.5+)
  await sql`CREATE INDEX IF NOT EXISTS idx_entities_class ON entities(class_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_relations_source ON relations(source_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_relations_target ON relations(target_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_relations_predicate ON relations(predicate_id)`;
}

// Helper: convert DB row to Entity
export function rowToEntity(row: any) {
  return {
    id: row.id,
    name: row.name,
    classId: row.class_id,
    properties: typeof row.properties === 'string' ? JSON.parse(row.properties || '{}') : (row.properties || {}),
    description: row.description,
    color: row.color,
    positions: typeof row.positions === 'string' ? JSON.parse(row.positions || '{}') : (row.positions || {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper: convert DB row to Relation
export function rowToRelation(row: any) {
  return {
    id: row.id,
    sourceId: row.source_id,
    targetId: row.target_id,
    predicateId: row.predicate_id,
    properties: typeof row.properties === 'string' ? JSON.parse(row.properties || '{}') : (row.properties || {}),
    weight: row.weight,
    createdAt: row.created_at,
  };
}

// Helper: convert DB row to OntologyClass
export function rowToClass(row: any) {
  return {
    id: row.id,
    name: row.name,
    parentClassId: row.parent_class_id || undefined,
    requiredProperties: typeof row.required_properties === 'string' ? JSON.parse(row.required_properties || '[]') : (row.required_properties || []),
    optionalProperties: typeof row.optional_properties === 'string' ? JSON.parse(row.optional_properties || '[]') : (row.optional_properties || []),
    description: row.description,
    icon: row.icon,
    color: row.color,
  };
}

// Helper: convert DB row to PredicateType
export function rowToPredicate(row: any) {
  return {
    id: row.id,
    name: row.name,
    inverseId: row.inverse_id || undefined,
    sourceClassIds: typeof row.source_class_ids === 'string' ? JSON.parse(row.source_class_ids || '[]') : (row.source_class_ids || []),
    targetClassIds: typeof row.target_class_ids === 'string' ? JSON.parse(row.target_class_ids || '[]') : (row.target_class_ids || []),
    description: row.description,
  };
}

// Helper: convert DB row to InferenceRule
export function rowToRule(row: any) {
  return {
    id: row.id,
    name: row.name,
    conditions: typeof row.conditions === 'string' ? JSON.parse(row.conditions || '[]') : (row.conditions || []),
    actions: typeof row.actions === 'string' ? JSON.parse(row.actions || '[]') : (row.actions || []),
    isActive: !!row.is_active,
    priority: row.priority,
    description: row.description,
  };
}
