import { query, queryOne, execute } from './db';
import { v4 as uuidv4 } from 'uuid';

export async function seedDatabase() {
  // Check if data already exists
  const count = await queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM ontology_classes');
  if (count && count.cnt > 0) return;

  // ============================================================
  // 1. Ontology Classes
  // ============================================================
  const classes = [
    // 서비스유형 계층
    { id: 'service_type', name: '서비스유형', parentClassId: null, icon: '🔧', color: '#22C55E', required: '["name"]', optional: '["description","price_range"]' },
    { id: 'residential_cleaning', name: '주거청소', parentClassId: 'service_type', icon: '🏠', color: '#22C55E', required: '["name"]', optional: '["description","base_price"]' },
    { id: 'move_in_cleaning', name: '입주청소', parentClassId: 'residential_cleaning', icon: '🏠', color: '#22C55E', required: '["name","base_price"]', optional: '["description","duration_hours"]' },
    { id: 'move_out_cleaning', name: '이사청소', parentClassId: 'residential_cleaning', icon: '📦', color: '#22C55E', required: '["name","base_price"]', optional: '["description","duration_hours"]' },
    { id: 'regular_cleaning', name: '정기청소', parentClassId: 'residential_cleaning', icon: '🔄', color: '#22C55E', required: '["name","base_price"]', optional: '["description","frequency"]' },
    { id: 'commercial_cleaning', name: '상업청소', parentClassId: 'service_type', icon: '🏢', color: '#22C55E', required: '["name"]', optional: '["description","base_price"]' },
    { id: 'office_cleaning', name: '사무실청소', parentClassId: 'commercial_cleaning', icon: '🏢', color: '#22C55E', required: '["name","base_price"]', optional: '["description","area_sqm"]' },
    { id: 'store_cleaning', name: '매장청소', parentClassId: 'commercial_cleaning', icon: '🏪', color: '#22C55E', required: '["name","base_price"]', optional: '["description","area_sqm"]' },

    // 사람 계층
    { id: 'person', name: '사람', parentClassId: null, icon: '👤', color: '#3B82F6', required: '["name","phone"]', optional: '["email","role","birth_date"]' },
    { id: 'ceo', name: '대표', parentClassId: 'person', icon: '👔', color: '#3B82F6', required: '["name","phone"]', optional: '["email"]' },
    { id: 'manager', name: '책임자', parentClassId: 'person', icon: '👨‍💼', color: '#3B82F6', required: '["name","phone"]', optional: '["email","department"]' },
    { id: 'team_member', name: '팀원', parentClassId: 'person', icon: '👷', color: '#3B82F6', required: '["name","phone"]', optional: '["email","team"]' },

    // 조직 계층
    { id: 'organization', name: '조직', parentClassId: null, icon: '🏛️', color: '#8B5CF6', required: '["name"]', optional: '["description","address","founded_date"]' },
    { id: 'headquarters', name: '본사', parentClassId: 'organization', icon: '🏛️', color: '#8B5CF6', required: '["name","address"]', optional: '["description","employee_count"]' },
    { id: 'team', name: '시공팀', parentClassId: 'organization', icon: '👥', color: '#8B5CF6', required: '["name"]', optional: '["description","member_count"]' },

    // 고객 계층
    { id: 'customer', name: '고객', parentClassId: null, icon: '🧑', color: '#F59E0B', required: '["name","phone"]', optional: '["email","address","registration_date"]' },
    { id: 'regular_customer', name: '일반고객', parentClassId: 'customer', icon: '🧑', color: '#F59E0B', required: '["name","phone"]', optional: '["email","address"]' },
    { id: 'vip_customer', name: 'VIP고객', parentClassId: 'customer', icon: '⭐', color: '#F59E0B', required: '["name","phone"]', optional: '["email","address","vip_since"]' },

    // 시공건
    { id: 'project', name: '시공건', parentClassId: null, icon: '📋', color: '#EC4899', required: '["name","date","price"]', optional: '["description","status","review_score","area_sqm"]' },

    // 지역
    { id: 'location', name: '지역', parentClassId: null, icon: '📍', color: '#6B7280', required: '["name"]', optional: '["description","district","city"]' },
  ];

  for (const c of classes) {
    await execute(
      'INSERT INTO ontology_classes (id, name, parent_class_id, required_properties, optional_properties, description, icon, color) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [c.id, c.name, c.parentClassId, c.required, c.optional, null, c.icon, c.color]
    );
  }

  // ============================================================
  // 2. Predicate Types
  // ============================================================
  const predicates = [
    { id: 'is_ceo_of', name: '대표이다', inverseId: 'has_ceo', sourceClassIds: '["ceo","person"]', targetClassIds: '["organization","headquarters"]', description: '조직의 대표' },
    { id: 'has_ceo', name: '대표가 있다', inverseId: 'is_ceo_of', sourceClassIds: '["organization","headquarters"]', targetClassIds: '["ceo","person"]', description: '조직의 대표 (역방향)' },
    { id: 'is_manager_of', name: '책임이다', inverseId: null, sourceClassIds: '["manager","person"]', targetClassIds: '["organization","headquarters"]', description: '조직의 책임자' },
    { id: 'is_leader_of', name: '팀장이다', inverseId: null, sourceClassIds: '["person","team_member"]', targetClassIds: '["team"]', description: '팀의 팀장' },
    { id: 'belongs_to', name: '소속이다', inverseId: 'has_member', sourceClassIds: '["team","person"]', targetClassIds: '["organization","headquarters"]', description: '조직에 소속' },
    { id: 'has_member', name: '소속원이 있다', inverseId: 'belongs_to', sourceClassIds: '["organization","headquarters","team"]', targetClassIds: '["person","team"]', description: '소속원 보유' },
    { id: 'provides_service', name: '서비스를 제공한다', inverseId: null, sourceClassIds: '["organization","headquarters"]', targetClassIds: '["service_type","residential_cleaning","commercial_cleaning","move_in_cleaning","move_out_cleaning","regular_cleaning","office_cleaning","store_cleaning"]', description: '서비스 제공' },
    { id: 'inquired', name: '문의했다', inverseId: null, sourceClassIds: '["customer","regular_customer","vip_customer"]', targetClassIds: '["service_type","move_in_cleaning","move_out_cleaning","regular_cleaning","office_cleaning","store_cleaning"]', description: '서비스 문의' },
    { id: 'lives_in', name: '거주한다', inverseId: null, sourceClassIds: '["customer","regular_customer","vip_customer","person"]', targetClassIds: '["location"]', description: '거주 지역' },
    { id: 'project_customer', name: '고객이다', inverseId: null, sourceClassIds: '["project"]', targetClassIds: '["customer","regular_customer","vip_customer"]', description: '시공건의 고객' },
    { id: 'project_service_type', name: '서비스유형', inverseId: null, sourceClassIds: '["project"]', targetClassIds: '["service_type","move_in_cleaning","move_out_cleaning","regular_cleaning","office_cleaning","store_cleaning"]', description: '시공건의 서비스 유형' },
    { id: 'project_team', name: '담당팀', inverseId: null, sourceClassIds: '["project"]', targetClassIds: '["team"]', description: '시공건 담당 팀' },
    { id: 'project_location', name: '담당지역', inverseId: null, sourceClassIds: '["project"]', targetClassIds: '["location"]', description: '시공건 지역' },
    { id: 'member_of_team', name: '팀원이다', inverseId: null, sourceClassIds: '["person","team_member"]', targetClassIds: '["team"]', description: '팀의 팀원' },
  ];

  for (const p of predicates) {
    await execute(
      'INSERT INTO predicate_types (id, name, inverse_id, source_class_ids, target_class_ids, description) VALUES ($1, $2, $3, $4, $5, $6)',
      [p.id, p.name, p.inverseId, p.sourceClassIds, p.targetClassIds, p.description]
    );
  }

  // ============================================================
  // 3. Entities
  // ============================================================
  const entities: Array<{ id: string; name: string; classId: string; properties: Record<string, any>; description?: string }> = [
    // 사람
    { id: 'person_kim_mj', name: '김민준', classId: 'ceo', properties: { phone: '010-1234-5678', email: 'minjun@bros.kr', role: '대표이사' }, description: '브로스 대표' },
    { id: 'person_kim_hm', name: '김홍민', classId: 'manager', properties: { phone: '010-2345-6789', email: 'hongmin@bros.kr', department: '운영' }, description: '운영 책임자' },
    { id: 'person_lee_jh', name: '이재호', classId: 'team_member', properties: { phone: '010-3456-7890', email: 'jaeho@bros.kr', team: 'A팀' }, description: 'A팀 팀장' },
    { id: 'person_park_sy', name: '박서연', classId: 'team_member', properties: { phone: '010-4567-8901', email: 'seoyeon@bros.kr', team: 'B팀' }, description: 'B팀 팀장' },
    { id: 'person_choi_jh', name: '최준혁', classId: 'team_member', properties: { phone: '010-5678-9012', email: 'junhyuk@bros.kr', team: 'C팀' }, description: 'C팀 팀장' },

    // 조직
    { id: 'org_bros', name: '브로스 본사', classId: 'headquarters', properties: { address: '서울특별시 강남구 테헤란로 123', employee_count: 15, founded_date: '2020-03-01' }, description: 'BROS 청소업체 본사' },
    { id: 'org_team_a', name: 'A팀', classId: 'team', properties: { member_count: 4 }, description: '입주청소 전문팀' },
    { id: 'org_team_b', name: 'B팀', classId: 'team', properties: { member_count: 3 }, description: '이사청소 전문팀' },
    { id: 'org_team_c', name: 'C팀', classId: 'team', properties: { member_count: 3 }, description: '상업청소 전문팀' },

    // 서비스
    { id: 'svc_move_in', name: '입주청소', classId: 'move_in_cleaning', properties: { base_price: 350000, duration_hours: 6, description: '새 아파트 입주 전 전문 청소' } },
    { id: 'svc_move_out', name: '이사청소', classId: 'move_out_cleaning', properties: { base_price: 250000, duration_hours: 4, description: '이사 후 원상복구 청소' } },
    { id: 'svc_regular', name: '정기청소', classId: 'regular_cleaning', properties: { base_price: 150000, frequency: '주 1회', description: '정기적 가정 청소 서비스' } },
    { id: 'svc_office', name: '사무실청소', classId: 'office_cleaning', properties: { base_price: 400000, area_sqm: 100, description: '사무실 전문 청소' } },
    { id: 'svc_store', name: '매장청소', classId: 'store_cleaning', properties: { base_price: 300000, area_sqm: 80, description: '매장/상가 청소' } },

    // 고객
    { id: 'cust_park_jy', name: '고객_박지영', classId: 'regular_customer', properties: { phone: '010-1111-2222', email: 'jiyoung@email.com', address: '강남구 역삼동 123' }, description: '입주청소 문의 고객' },
    { id: 'cust_lee_sh', name: '고객_이수현', classId: 'regular_customer', properties: { phone: '010-3333-4444', email: 'suhyun@email.com', address: '서초구 서초동 456' }, description: '이사청소 문의 고객' },
    { id: 'cust_jung_dy', name: '고객_정도윤', classId: 'vip_customer', properties: { phone: '010-5555-6666', email: 'doyun@email.com', address: '마포구 합정동 789', vip_since: '2024-06-01' }, description: 'VIP 단골 고객' },
    { id: 'cust_han_sh', name: '고객_한소희', classId: 'regular_customer', properties: { phone: '010-7777-8888', email: 'sohee@email.com', address: '송파구 잠실동 321' }, description: '사무실청소 문의 고객' },
    { id: 'cust_yoo_js', name: '고객_유재석', classId: 'vip_customer', properties: { phone: '010-9999-0000', email: 'jaeseok@email.com', address: '강남구 청담동 654', vip_since: '2024-03-01' }, description: 'VIP 고객 (다수 시공)' },

    // 시공건
    { id: 'proj_001', name: '시공_2024_001', classId: 'project', properties: { date: '2024-07-15', price: 380000, status: '완료', review_score: 4.8, area_sqm: 32 }, description: '입주청소 - 강남구 역삼동' },
    { id: 'proj_002', name: '시공_2024_002', classId: 'project', properties: { date: '2024-08-02', price: 270000, status: '완료', review_score: 4.5, area_sqm: 25 }, description: '이사청소 - 서초구' },
    { id: 'proj_003', name: '시공_2024_003', classId: 'project', properties: { date: '2024-09-10', price: 550000, status: '완료', review_score: 4.9, area_sqm: 45 }, description: '입주청소 - 마포구 대형 아파트' },
    { id: 'proj_004', name: '시공_2024_004', classId: 'project', properties: { date: '2024-10-05', price: 420000, status: '완료', review_score: 4.7, area_sqm: 38 }, description: '사무실청소 - 송파구' },
    { id: 'proj_005', name: '시공_2024_005', classId: 'project', properties: { date: '2024-11-20', price: 600000, status: '진행중', review_score: null, area_sqm: 55 }, description: '입주청소 - 강남구 대형' },

    // 지역
    { id: 'loc_gangnam', name: '강남구', classId: 'location', properties: { district: '강남구', city: '서울특별시' } },
    { id: 'loc_seocho', name: '서초구', classId: 'location', properties: { district: '서초구', city: '서울특별시' } },
    { id: 'loc_mapo', name: '마포구', classId: 'location', properties: { district: '마포구', city: '서울특별시' } },
    { id: 'loc_songpa', name: '송파구', classId: 'location', properties: { district: '송파구', city: '서울특별시' } },
  ];

  for (const e of entities) {
    const classInfo = classes.find(c => c.id === e.classId);
    await execute(
      'INSERT INTO entities (id, name, class_id, properties, description, color) VALUES ($1, $2, $3, $4, $5, $6)',
      [e.id, e.name, e.classId, JSON.stringify(e.properties), e.description || null, classInfo?.color || null]
    );
  }

  // ============================================================
  // 4. Relations
  // ============================================================
  const relations = [
    { sourceId: 'person_kim_mj', targetId: 'org_bros', predicateId: 'is_ceo_of' },
    { sourceId: 'person_kim_hm', targetId: 'org_bros', predicateId: 'is_manager_of' },
    { sourceId: 'person_lee_jh', targetId: 'org_team_a', predicateId: 'is_leader_of' },
    { sourceId: 'person_park_sy', targetId: 'org_team_b', predicateId: 'is_leader_of' },
    { sourceId: 'person_choi_jh', targetId: 'org_team_c', predicateId: 'is_leader_of' },
    { sourceId: 'org_team_a', targetId: 'org_bros', predicateId: 'belongs_to' },
    { sourceId: 'org_team_b', targetId: 'org_bros', predicateId: 'belongs_to' },
    { sourceId: 'org_team_c', targetId: 'org_bros', predicateId: 'belongs_to' },
    { sourceId: 'person_lee_jh', targetId: 'org_team_a', predicateId: 'member_of_team' },
    { sourceId: 'person_park_sy', targetId: 'org_team_b', predicateId: 'member_of_team' },
    { sourceId: 'person_choi_jh', targetId: 'org_team_c', predicateId: 'member_of_team' },
    { sourceId: 'org_bros', targetId: 'svc_move_in', predicateId: 'provides_service' },
    { sourceId: 'org_bros', targetId: 'svc_move_out', predicateId: 'provides_service' },
    { sourceId: 'org_bros', targetId: 'svc_regular', predicateId: 'provides_service' },
    { sourceId: 'org_bros', targetId: 'svc_office', predicateId: 'provides_service' },
    { sourceId: 'org_bros', targetId: 'svc_store', predicateId: 'provides_service' },
    { sourceId: 'cust_park_jy', targetId: 'svc_move_in', predicateId: 'inquired' },
    { sourceId: 'cust_lee_sh', targetId: 'svc_move_out', predicateId: 'inquired' },
    { sourceId: 'cust_jung_dy', targetId: 'svc_move_in', predicateId: 'inquired' },
    { sourceId: 'cust_jung_dy', targetId: 'svc_regular', predicateId: 'inquired' },
    { sourceId: 'cust_han_sh', targetId: 'svc_office', predicateId: 'inquired' },
    { sourceId: 'cust_yoo_js', targetId: 'svc_move_in', predicateId: 'inquired' },
    { sourceId: 'cust_yoo_js', targetId: 'svc_move_out', predicateId: 'inquired' },
    { sourceId: 'cust_park_jy', targetId: 'loc_gangnam', predicateId: 'lives_in' },
    { sourceId: 'cust_lee_sh', targetId: 'loc_seocho', predicateId: 'lives_in' },
    { sourceId: 'cust_jung_dy', targetId: 'loc_mapo', predicateId: 'lives_in' },
    { sourceId: 'cust_han_sh', targetId: 'loc_songpa', predicateId: 'lives_in' },
    { sourceId: 'cust_yoo_js', targetId: 'loc_gangnam', predicateId: 'lives_in' },
    { sourceId: 'proj_001', targetId: 'cust_park_jy', predicateId: 'project_customer' },
    { sourceId: 'proj_001', targetId: 'svc_move_in', predicateId: 'project_service_type' },
    { sourceId: 'proj_001', targetId: 'org_team_a', predicateId: 'project_team' },
    { sourceId: 'proj_001', targetId: 'loc_gangnam', predicateId: 'project_location' },
    { sourceId: 'proj_002', targetId: 'cust_lee_sh', predicateId: 'project_customer' },
    { sourceId: 'proj_002', targetId: 'svc_move_out', predicateId: 'project_service_type' },
    { sourceId: 'proj_002', targetId: 'org_team_b', predicateId: 'project_team' },
    { sourceId: 'proj_002', targetId: 'loc_seocho', predicateId: 'project_location' },
    { sourceId: 'proj_003', targetId: 'cust_jung_dy', predicateId: 'project_customer' },
    { sourceId: 'proj_003', targetId: 'svc_move_in', predicateId: 'project_service_type' },
    { sourceId: 'proj_003', targetId: 'org_team_a', predicateId: 'project_team' },
    { sourceId: 'proj_003', targetId: 'loc_mapo', predicateId: 'project_location' },
    { sourceId: 'proj_004', targetId: 'cust_han_sh', predicateId: 'project_customer' },
    { sourceId: 'proj_004', targetId: 'svc_office', predicateId: 'project_service_type' },
    { sourceId: 'proj_004', targetId: 'org_team_c', predicateId: 'project_team' },
    { sourceId: 'proj_004', targetId: 'loc_songpa', predicateId: 'project_location' },
    { sourceId: 'proj_005', targetId: 'cust_yoo_js', predicateId: 'project_customer' },
    { sourceId: 'proj_005', targetId: 'svc_move_in', predicateId: 'project_service_type' },
    { sourceId: 'proj_005', targetId: 'org_team_a', predicateId: 'project_team' },
    { sourceId: 'proj_005', targetId: 'loc_gangnam', predicateId: 'project_location' },
  ];

  for (const r of relations) {
    await execute(
      'INSERT INTO relations (id, source_id, target_id, predicate_id, properties, weight) VALUES ($1, $2, $3, $4, $5, $6)',
      [uuidv4(), r.sourceId, r.targetId, r.predicateId, '{}', 1.0]
    );
  }

  // ============================================================
  // 5. Inference Rules
  // ============================================================
  const rules = [
    {
      id: 'rule_vip',
      name: 'VIP 자동 분류',
      conditions: JSON.stringify([
        { type: 'class_check', entityClassId: 'customer' },
        { type: 'relation_count', predicateId: 'project_customer', minCount: 2 },
        { type: 'property_check', propertyName: 'total_spent', operator: 'gte', value: 5000000 },
      ]),
      actions: JSON.stringify([
        { type: 'change_class', value: 'vip_customer' },
        { type: 'add_tag', tag: 'vip' },
      ]),
      isActive: true,
      priority: 10,
      description: '시공건 2회 이상 & 총 시공금액 500만원 이상인 고객을 VIP로 자동 분류',
    },
    {
      id: 'rule_premium',
      name: '프리미엄 시공 분류',
      conditions: JSON.stringify([
        { type: 'class_check', entityClassId: 'project' },
        { type: 'property_check', propertyName: 'price', operator: 'gte', value: 500000 },
        { type: 'property_check', propertyName: 'review_score', operator: 'gte', value: 4.5 },
      ]),
      actions: JSON.stringify([
        { type: 'add_tag', tag: 'premium' },
      ]),
      isActive: true,
      priority: 5,
      description: '가격 50만원 이상 & 리뷰점수 4.5 이상인 시공건에 premium 태그 부여',
    },
    {
      id: 'rule_repeat',
      name: '재방문 고객 표시',
      conditions: JSON.stringify([
        { type: 'class_check', entityClassId: 'customer' },
        { type: 'relation_count', predicateId: 'project_customer', minCount: 2 },
      ]),
      actions: JSON.stringify([
        { type: 'add_tag', tag: 'repeat_customer' },
        { type: 'set_property', propertyName: 'repeat_visit_count', value: 'auto_count' },
      ]),
      isActive: true,
      priority: 3,
      description: '시공건 관계가 2회 이상인 고객에 재방문 태그 부여',
    },
  ];

  for (const r of rules) {
    await execute(
      'INSERT INTO inference_rules (id, name, conditions, actions, is_active, priority, description) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [r.id, r.name, r.conditions, r.actions, r.isActive, r.priority, r.description]
    );
  }
}
