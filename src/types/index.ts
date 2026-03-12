// ============================================================
// Ontology Knowledge Graph — Core Type Definitions
// ============================================================

export interface Entity {
  id: string;
  name: string;
  classId: string;
  properties: Record<string, any>;
  description?: string;
  color?: string;
  positions?: Record<string, { x: number; y: number }>;
  createdAt: string;
  updatedAt: string;
}

export interface Relation {
  id: string;
  sourceId: string;
  targetId: string;
  predicateId: string;
  properties?: Record<string, any>;
  weight?: number;
  createdAt: string;
}

export interface OntologyClass {
  id: string;
  name: string;
  parentClassId?: string;
  requiredProperties: string[];
  optionalProperties: string[];
  description?: string;
  icon?: string;
  color: string;
}

export interface PredicateType {
  id: string;
  name: string;
  inverseId?: string;
  sourceClassIds: string[];
  targetClassIds: string[];
  description?: string;
}

export interface InferenceRule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  isActive: boolean;
  priority: number;
  description?: string;
}

export interface RuleCondition {
  type: 'property_check' | 'relation_exists' | 'relation_count' | 'class_check';
  entityClassId?: string;
  propertyName?: string;
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';
  value?: any;
  predicateId?: string;
  minCount?: number;
}

export interface RuleAction {
  type: 'set_property' | 'add_relation' | 'change_class' | 'add_tag';
  propertyName?: string;
  value?: any;
  predicateId?: string;
  targetEntityId?: string;
  tag?: string;
}

// Graph visualization types (react-flow)
export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    entity: Entity;
    ontologyClass: OntologyClass;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data: {
    relation: Relation;
    predicate: PredicateType;
  };
  label?: string;
  animated?: boolean;
  style?: Record<string, any>;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Dashboard stats
export interface DashboardStats {
  entityCount: number;
  relationCount: number;
  classCount: number;
  activeRuleCount: number;
}

// Query types
export interface StructuredQuery {
  startClassId: string;
  filters: QueryFilter[];
  depth: number;
}

export interface QueryFilter {
  type: 'property' | 'relation';
  propertyName?: string;
  operator?: string;
  value?: any;
  predicateId?: string;
  targetClassId?: string;
}

// Import types
export interface CsvMapping {
  column: string;
  field: string;
  type: 'name' | 'property' | 'class' | 'ignore';
}

export interface TemplateType {
  id: string;
  name: string;
  description: string;
  icon: string;
}
