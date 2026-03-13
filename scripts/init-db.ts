import { neon } from '@neondatabase/serverless';

async function main() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL 환경변수가 설정되지 않았습니다');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  console.log('DB 초기화 시작...');

  // 모든 테이블과 인덱스를 하나의 SQL로 생성
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
    );

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
    );

    CREATE TABLE IF NOT EXISTS predicate_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      inverse_id TEXT,
      source_class_ids TEXT DEFAULT '[]',
      target_class_ids TEXT DEFAULT '[]',
      description TEXT
    );

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
    );

    CREATE TABLE IF NOT EXISTS inference_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      conditions TEXT DEFAULT '[]',
      actions TEXT DEFAULT '[]',
      is_active BOOLEAN DEFAULT TRUE,
      priority INTEGER DEFAULT 0,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS inference_logs (
      id TEXT PRIMARY KEY,
      rule_id TEXT NOT NULL,
      rule_name TEXT NOT NULL,
      affected_entity_id TEXT,
      affected_entity_name TEXT,
      action_summary TEXT,
      executed_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_entities_class ON entities(class_id);
    CREATE INDEX IF NOT EXISTS idx_relations_source ON relations(source_id);
    CREATE INDEX IF NOT EXISTS idx_relations_target ON relations(target_id);
    CREATE INDEX IF NOT EXISTS idx_relations_predicate ON relations(predicate_id);
  `;

  console.log('테이블 및 인덱스 생성 완료');
  console.log('DB 초기화 완료!');
}

main().catch((err) => {
  console.error('DB 초기화 실패:', err);
  process.exit(1);
});
