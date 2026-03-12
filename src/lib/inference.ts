import { query, queryOne, execute, rowToEntity, rowToRule, rowToRelation } from './db';
import { InferenceRule, RuleCondition, Entity } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface InferenceResult {
  ruleId: string;
  ruleName: string;
  affectedEntities: Array<{
    entityId: string;
    entityName: string;
    actions: string[];
  }>;
}

export async function executeAllRules(): Promise<InferenceResult[]> {
  const rulesRows = await query('SELECT * FROM inference_rules WHERE is_active = true ORDER BY priority DESC');
  const rules = rulesRows.map(rowToRule);
  const results: InferenceResult[] = [];

  for (const rule of rules) {
    const result = await executeRule(rule);
    if (result.affectedEntities.length > 0) {
      results.push(result);
      for (const affected of result.affectedEntities) {
        await execute(
          'INSERT INTO inference_logs (id, rule_id, rule_name, affected_entity_id, affected_entity_name, action_summary) VALUES ($1, $2, $3, $4, $5, $6)',
          [uuidv4(), rule.id, rule.name, affected.entityId, affected.entityName, affected.actions.join('; ')]
        );
      }
    }
  }

  return results;
}

export async function testRule(rule: InferenceRule): Promise<InferenceResult> {
  return executeRule(rule, true);
}

async function executeRule(rule: InferenceRule, dryRun = false): Promise<InferenceResult> {
  const result: InferenceResult = {
    ruleId: rule.id,
    ruleName: rule.name,
    affectedEntities: [],
  };

  const classCondition = rule.conditions.find(c => c.type === 'class_check');
  if (!classCondition?.entityClassId) return result;

  const classIds = await getClassAndSubclasses(classCondition.entityClassId);
  const placeholders = classIds.map((_, i) => `$${i + 1}`).join(',');
  const entitiesRows = await query(`SELECT * FROM entities WHERE class_id IN (${placeholders})`, classIds);
  const entities = entitiesRows.map(rowToEntity);

  for (const entity of entities) {
    if (await checkConditions(entity, rule.conditions)) {
      const actions: string[] = [];
      if (!dryRun) {
        await applyActions(entity, rule.actions, actions);
      } else {
        describeActions(rule.actions, actions);
      }
      result.affectedEntities.push({
        entityId: entity.id,
        entityName: entity.name,
        actions,
      });
    }
  }

  return result;
}

async function getClassAndSubclasses(classId: string): Promise<string[]> {
  const result = [classId];
  const children = await query<{ id: string }>('SELECT id FROM ontology_classes WHERE parent_class_id = $1', [classId]);
  for (const child of children) {
    result.push(...await getClassAndSubclasses(child.id));
  }
  return result;
}

async function checkConditions(entity: Entity, conditions: RuleCondition[]): Promise<boolean> {
  for (const condition of conditions) {
    switch (condition.type) {
      case 'class_check':
        break;

      case 'property_check': {
        const value = entity.properties[condition.propertyName || ''];
        if (value === undefined || value === null) return false;
        if (!compareValues(value, condition.operator || 'eq', condition.value)) return false;
        break;
      }

      case 'relation_exists': {
        const count = await queryOne<{ cnt: number }>(
          'SELECT COUNT(*) as cnt FROM relations WHERE (source_id = $1 OR target_id = $2) AND predicate_id = $3',
          [entity.id, entity.id, condition.predicateId]
        );
        if (!count || count.cnt === 0) return false;
        break;
      }

      case 'relation_count': {
        const count = await queryOne<{ cnt: number }>(
          'SELECT COUNT(*) as cnt FROM relations WHERE target_id = $1 AND predicate_id = $2',
          [entity.id, condition.predicateId]
        );
        if (!count || count.cnt < (condition.minCount || 0)) return false;
        break;
      }
    }
  }

  return true;
}

function compareValues(actual: any, operator: string, expected: any): boolean {
  switch (operator) {
    case 'eq': return actual == expected;
    case 'neq': return actual != expected;
    case 'gt': return Number(actual) > Number(expected);
    case 'gte': return Number(actual) >= Number(expected);
    case 'lt': return Number(actual) < Number(expected);
    case 'lte': return Number(actual) <= Number(expected);
    case 'contains': return String(actual).includes(String(expected));
    default: return false;
  }
}

async function applyActions(entity: Entity, actions: any[], descriptions: string[]) {
  for (const action of actions) {
    switch (action.type) {
      case 'set_property': {
        const props = { ...entity.properties };
        if (action.value === 'auto_count') {
          const count = await queryOne<{ cnt: number }>(
            'SELECT COUNT(*) as cnt FROM relations WHERE target_id = $1',
            [entity.id]
          );
          props[action.propertyName] = count?.cnt || 0;
        } else {
          props[action.propertyName] = action.value;
        }
        await execute('UPDATE entities SET properties = $1, updated_at = NOW() WHERE id = $2',
          [JSON.stringify(props), entity.id]);
        descriptions.push(`속성 "${action.propertyName}" 설정`);
        break;
      }

      case 'add_tag': {
        const props = { ...entity.properties };
        const tags: string[] = props.tags || [];
        if (!tags.includes(action.tag)) {
          tags.push(action.tag);
          props.tags = tags;
          await execute('UPDATE entities SET properties = $1, updated_at = NOW() WHERE id = $2',
            [JSON.stringify(props), entity.id]);
        }
        descriptions.push(`태그 "${action.tag}" 추가`);
        break;
      }

      case 'change_class': {
        await execute('UPDATE entities SET class_id = $1, updated_at = NOW() WHERE id = $2',
          [action.value, entity.id]);
        descriptions.push(`클래스를 "${action.value}"로 변경`);
        break;
      }

      case 'add_relation': {
        if (action.predicateId && action.targetEntityId) {
          const existing = await queryOne<{ cnt: number }>(
            'SELECT COUNT(*) as cnt FROM relations WHERE source_id = $1 AND target_id = $2 AND predicate_id = $3',
            [entity.id, action.targetEntityId, action.predicateId]
          );
          if (!existing || existing.cnt === 0) {
            await execute(
              'INSERT INTO relations (id, source_id, target_id, predicate_id) VALUES ($1, $2, $3, $4)',
              [uuidv4(), entity.id, action.targetEntityId, action.predicateId]
            );
          }
        }
        descriptions.push(`관계 추가`);
        break;
      }
    }
  }
}

function describeActions(actions: any[], descriptions: string[]) {
  for (const action of actions) {
    switch (action.type) {
      case 'set_property':
        descriptions.push(`속성 "${action.propertyName}" → ${action.value}`);
        break;
      case 'add_tag':
        descriptions.push(`태그 "${action.tag}" 추가`);
        break;
      case 'change_class':
        descriptions.push(`클래스 → "${action.value}"`);
        break;
      case 'add_relation':
        descriptions.push(`관계 추가 (${action.predicateId})`);
        break;
    }
  }
}
